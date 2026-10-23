// lib/server/cache.ts
//
// How long a rendered response lives at the edge. This replaces Next's ISR.
//
// Routes state their policy in CDN-Cache-Control, the standard header for
// shared caches; src/hooks.server.ts carries it out with Cloudflare's Cache API.
// The browser gets plain Cache-Control and always rechecks with the edge, so a
// reader never sits on a stale copy in their own browser.

/** Fresh for an hour, then served stale for up to a day while one background request refreshes it. */
export const PAGE_CACHE = {
	'cache-control': 'public, max-age=0, must-revalidate',
	'cdn-cache-control': 'public, s-maxage=3600, stale-while-revalidate=86400'
};

/** The infinite scroll's next-release lookup: changes only as new releases arrive. */
export const NEXT_ARTICLE_CACHE = {
	'cache-control': 'public, max-age=60',
	'cdn-cache-control': 'public, s-maxage=300, stale-while-revalidate=3600'
};

/** For responses that must never be stored: errors from a failing API. */
export const NO_STORE = { 'cache-control': 'no-store' };
