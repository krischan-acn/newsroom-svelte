// Every response passes through here, for two things.
//
// 1. Security headers. The Content-Security-Policy is configured in
//    vite.config.ts (SvelteKit hashes its own inline scripts into it); these
//    are the headers CSP does not cover.
//
// 2. The edge cache. On Vercel or Netlify a CDN-Cache-Control header is enough
//    to have the CDN keep a page. On Cloudflare it is not: a response a Worker
//    renders is never cached unless the Worker stores it itself, through the
//    Cache API. Without this, every request would re-render the page and
//    re-ask the newswire API.
//
//    The routes still say what they want in CDN-Cache-Control (see
//    lib/server/cache.ts); this hook carries it out:
//      s-maxage                -> fresh: served straight from the cache
//      stale-while-revalidate  -> stale: still served instantly, and the page is
//                                 re-rendered in the background for next time
//    The Cache API supports neither directive natively, so the age is tracked
//    in a header on the stored copy.
//
//    Every response says what happened in `x-edge-cache`: HIT, STALE, MISS or
//    BYPASS. The benchmark reads it. Note the cache lives per Cloudflare data
//    centre, and (per community reports) may do nothing on *.workers.dev - if
//    every request reports MISS there, the Worker needs a custom domain.

import type { RequestEvent } from '@sveltejs/kit';
import { SITE_URL } from '#lib/site.ts';
import {
	BROWSER_CACHE,
	FRESH_FOR,
	STORED_AT,
	cacheKey,
	edgeCache,
	freshness,
	served,
	withHeaders
} from '#lib/server/edge-cache.ts';
import type { Handle } from '@sveltejs/kit/hooks';
// The adapter hands SvelteKit no `platform` object, so the Workers runtime is
// reached directly: `caches` is a Workers global, and waitUntil keeps the
// background store/refresh alive after the response has gone. In local dev
// both are absent or stubbed, and every request reports BYPASS.
import { waitUntil } from 'cloudflare:workers';

const SECURITY_HEADERS: Record<string, string> = {
	'strict-transport-security': 'max-age=31536000; includeSubDomains',
	'x-content-type-options': 'nosniff',
	'x-frame-options': 'SAMEORIGIN',
	'referrer-policy': 'strict-origin-when-cross-origin',
	'permissions-policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
};

/** Fresh and stale lifetimes, in seconds, from a CDN-Cache-Control value. */
function edgePolicy(header: string | null): { fresh: number; stale: number } | null {
	if (!header || /no-store|private/.test(header)) return null;
	const fresh = Number(/s-maxage=(\d+)/.exec(header)?.[1]);
	if (!fresh) return null;
	const stale = Number(/stale-while-revalidate=(\d+)/.exec(header)?.[1] ?? 0);
	return { fresh, stale };
}

/**
 * Only the canonical host may be indexed. A test deployment (workers.dev, a
 * staging subdomain) serves the same pages, and without this a search engine
 * could index those copies. The canonical link already points at SITE_URL;
 * this keeps the copies out of the index entirely.
 */
const CANONICAL_HOST = new URL(SITE_URL).host;

/** Renders the page and adds the security headers. */
async function render(event: RequestEvent, resolve: Parameters<Handle>[0]['resolve']): Promise<Response> {
	const headers =
		event.url.host === CANONICAL_HOST ? SECURITY_HEADERS : { ...SECURITY_HEADERS, 'x-robots-tag': 'noindex' };
	return withHeaders(await resolve(event), headers);
}

/** Puts a rendered response in the edge cache, if its route asked to be cached. */
async function store(cache: Cache, key: Request, response: Response): Promise<void> {
	if (response.status !== 200 && response.status !== 404) return;
	const policy = edgePolicy(response.headers.get('cdn-cache-control'));
	if (!policy) return;

	const stored = withHeaders(response.clone(), {
		// The Cache API evicts at max-age, so the copy must outlive the stale
		// window. That value is for the cache only - see served() below.
		'cache-control': `public, max-age=${policy.fresh + policy.stale}`,
		[BROWSER_CACHE]: response.headers.get('cache-control') ?? 'no-cache',
		[STORED_AT]: String(Date.now()),
		[FRESH_FOR]: String(policy.fresh)
	});
	await cache.put(key, stored);
}

export const handle: Handle = async ({ event, resolve }) => {
	const cache = edgeCache();

	// Local dev without the Workers runtime, and anything that is not a GET.
	if (!cache || event.request.method !== 'GET') {
		return withHeaders(await render(event, resolve), { 'x-edge-cache': 'BYPASS' });
	}

	// Keyed on the URL alone: no page here varies by cookie or header.
	const key = cacheKey(event.request);
	const hit = await cache.match(key);

	if (hit) {
		const { ageSeconds, stale } = freshness(hit);
		if (stale) {
			waitUntil(render(event, resolve).then((fresh) => store(cache, key, fresh)));
		}
		return served(hit, {
			'x-edge-cache': stale ? 'STALE' : 'HIT',
			age: String(Math.round(ageSeconds))
		});
	}

	const response = await render(event, resolve);
	waitUntil(store(cache, key, response.clone()));
	return withHeaders(response, { 'x-edge-cache': 'MISS' });
};
