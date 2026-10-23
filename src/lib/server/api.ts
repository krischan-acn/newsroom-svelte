// lib/server/api.ts
//
// The one way this app talks to the newswire API.
//
// Next.js gave the old app a fetch cache for free: `next: { revalidate }` on a
// fetch() kept the response for that many seconds. SvelteKit has no such cache,
// so this module is it, and the services keep their call shape - they call
// apiFetch() where they used to call fetch(), and pass the same
// `next: { revalidate }` hint, which is read here as the TTL.
//
// What it does, per URL:
//   - fresh hit       -> served from memory, no network
//   - stale hit       -> refetched; if that refetch FAILS, the stale copy is
//                        served instead (stale-if-error). The API has gone down
//                        for hours at a time, and a page that was fine an hour
//                        ago is better than an empty one.
//   - concurrent miss -> one request in flight, every caller awaits it
//
// The memory lives per server instance, so on Vercel/Netlify it helps a warm
// function rather than every request. The CDN in front (see setHeaders in each
// route) is the cache most readers actually hit; this one keeps the miss cheap.

import { ACN_API_BASE } from '$app/env/private';

/** The newswire API. Defaults and trimming live in src/env.ts. */
export const API_BASE = ACN_API_BASE;

/**
 * Per-attempt deadline. Unchanged from the Next app: above the slowest healthy
 * response observed (~2.5s, the events list) and well under the point where a
 * visitor assumes the page has hung.
 */
export const API_TIMEOUT_MS = 6000;

/** Used when a caller passes no revalidate hint. */
const DEFAULT_TTL_S = 3600;

/** Caps memory: past this many URLs the oldest entry is dropped. */
const MAX_ENTRIES = 500;

type ApiInit = RequestInit & { next?: { revalidate?: number } };

interface Entry {
	status: number;
	body: string;
	expires: number;
}

const store = new Map<string, Entry>();
const inFlight = new Map<string, Promise<Entry>>();

/** Adds the deadline to a fetch init, preserving whatever else is on it. */
export function apiInit(init: ApiInit = {}): ApiInit {
	return { ...init, signal: AbortSignal.timeout(API_TIMEOUT_MS) };
}

/** 2xx and 404 are answers worth keeping. Anything else is the server failing. */
function cacheable(status: number): boolean {
	return (status >= 200 && status < 300) || status === 404;
}

function remember(url: string, entry: Entry) {
	store.delete(url);
	store.set(url, entry);
	if (store.size > MAX_ENTRIES) {
		const oldest = store.keys().next().value;
		if (oldest !== undefined) store.delete(oldest);
	}
}

async function load(url: string, init: ApiInit): Promise<Entry> {
	const { next, ...requestInit } = init;
	const ttl = (next?.revalidate ?? DEFAULT_TTL_S) * 1000;
	const res = await fetch(url, {
		...requestInit,
		headers: { Accept: 'application/json', ...requestInit.headers }
	});
	const entry: Entry = { status: res.status, body: await res.text(), expires: Date.now() + ttl };
	if (cacheable(res.status)) remember(url, entry);
	return entry;
}

/**
 * fetch(), with the cache above in front. Returns a real Response so callers can
 * keep using res.ok, res.status and res.json().
 */
export async function apiFetch(url: string, init: ApiInit = {}): Promise<Response> {
	const cached = store.get(url);
	if (cached && cached.expires > Date.now()) return toResponse(cached);

	let pending = inFlight.get(url);
	if (!pending) {
		pending = load(url, init).finally(() => inFlight.delete(url));
		inFlight.set(url, pending);
	}

	try {
		const entry = await pending;
		if (!cacheable(entry.status) && cached) return toResponse(cached);
		return toResponse(entry);
	} catch (err) {
		// Network failure or the deadline. A stale answer beats none.
		if (cached) return toResponse(cached);
		throw err;
	}
}

function toResponse(entry: Entry): Response {
	return new Response(entry.body, {
		status: entry.status,
		headers: { 'Content-Type': 'application/json' }
	});
}
