// lib/server/edge-cache.ts
//
// The edge cache's shared pieces: how a request maps to a cache key, and how a
// stored copy is turned back into a response. Used by two callers:
//
//   - src/worker.ts answers FRESH hits before SvelteKit is even loaded.
//   - src/hooks.server.ts does everything else: misses, stale hits and the
//     background refresh, storing what it renders.
//
// Pure on purpose: no SvelteKit imports ($app/*), so the Worker entry can use
// it without pulling in the app it is trying not to start.

/** Bookkeeping kept on the stored copy and stripped before it is served. */
export const STORED_AT = 'x-edge-stored-at';
export const FRESH_FOR = 'x-edge-fresh-for';
/** The route's own browser Cache-Control, which the stored copy has to replace. */
export const BROWSER_CACHE = 'x-edge-browser-cache-control';

/**
 * Query parameters that only ever identify where a click came from. No route
 * reads them, so they are dropped from the cache key: without this, every
 * shared link (?fbclid=..., ?utm_source=...) is a fresh miss and a full render.
 *
 * A deny-list, not an allow-list, on purpose. Forgetting a tracker here costs a
 * cache miss; forgetting a real parameter in an allow-list would serve one
 * page's cached copy for another (?page=2 getting page 1).
 */
const TRACKING_PARAM =
	/^(utm_[a-z]+|fbclid|gclid|gbraid|wbraid|dclid|msclkid|yclid|twclid|ttclid|li_fat_id|mc_cid|mc_eid|_ga|_gl|igshid|ref_src)$/i;

/**
 * The cache key. Built from the RAW request URL, not SvelteKit's event.url: for
 * a client-side navigation SvelteKit requests /article/1/__data.json and then
 * rewrites event.url to /article/1. Keying on event.url stored that JSON under
 * the page's key, so the next reader to open the page got raw JSON (and a
 * navigation could get HTML where it expected JSON). The raw URL keeps the two
 * apart, and lets navigations hit the cache too.
 */
export function cacheKey(request: Request): Request {
	const url = new URL(request.url);
	for (const name of [...url.searchParams.keys()]) {
		if (TRACKING_PARAM.test(name)) url.searchParams.delete(name);
	}
	url.searchParams.sort();
	url.hash = '';
	return new Request(url.toString(), { method: 'GET' });
}

/** The Workers edge cache, or undefined outside the Workers runtime (plain `vite dev`). */
export function edgeCache(): Cache | undefined {
	return (globalThis.caches as { default?: Cache } | undefined)?.default;
}

export function withHeaders(response: Response, headers: Record<string, string>): Response {
	const copy = new Response(response.body, response);
	for (const [name, value] of Object.entries(headers)) copy.headers.set(name, value);
	return copy;
}

/** How old a stored copy is, and whether it is past its fresh lifetime. */
export function freshness(hit: Response): { ageSeconds: number; stale: boolean } {
	const ageSeconds = (Date.now() - Number(hit.headers.get(STORED_AT))) / 1000;
	return { ageSeconds, stale: ageSeconds > Number(hit.headers.get(FRESH_FOR)) };
}

/** A cached copy as the reader should get it: their Cache-Control back, bookkeeping removed. */
export function served(hit: Response, extra: Record<string, string>): Response {
	const response = withHeaders(hit, {
		'cache-control': hit.headers.get(BROWSER_CACHE) ?? 'no-cache',
		...extra
	});
	for (const name of [BROWSER_CACHE, STORED_AT, FRESH_FOR]) response.headers.delete(name);
	return response;
}
