// /news?page=N&limit=N - every press release, newest first.
//
// Ported from the Next app's app/news/page.tsx. Two of its rough edges are
// smoothed here because neither is visible to a reader who uses the site's own
// links:
//   - ?page=abc parsed to NaN there and asked the API for Page=NaN. Here any
//     unparsable or out-of-range value falls back to the default.
//   - ?limit was unbounded, but the API caps Size at 100 (news-list.ts), so a
//     larger limit made `hasNext` false forever. It is clamped to what the API
//     can return - which also bounds how many cache entries ?limit can create.

import { fetchNewsList } from '#lib/server/news-list.ts';
import { NO_STORE, PAGE_CACHE } from '#lib/server/cache.ts';
import type { PageServerLoad } from './$types';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function positiveInt(raw: string | null, fallback: number, max = Number.MAX_SAFE_INTEGER): number {
	const n = Number.parseInt(raw ?? '', 10);
	return Number.isFinite(n) && n >= 1 ? Math.min(n, max) : fallback;
}

export const load: PageServerLoad = async ({ url, setHeaders }) => {
	const page = positiveInt(url.searchParams.get('page'), 1);
	const limitParam = url.searchParams.get('limit');
	const limit = positiveInt(limitParam, DEFAULT_LIMIT, MAX_LIMIT);

	const articles = await fetchNewsList(page, limit);

	// An empty page is either past the end or the API failing (the feed degrades
	// to [] on error). Either way it is not worth pinning at the edge for an hour.
	setHeaders(articles.length > 0 ? PAGE_CACHE : NO_STORE);

	return {
		articles,
		page,
		// The Next heuristic, kept: the API returns no total, so a full page is
		// taken to mean there is another one.
		hasNext: articles.length === limit,
		// Carried into the pager links only when the reader asked for it, as Next did.
		limitParam: limitParam ? String(limit) : null
	};
};
