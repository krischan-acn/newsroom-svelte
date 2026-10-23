// lib/server/next-article.ts
//
// Which release the article page's infinite scroll loads next.
//
// The Next app answered this IN THE BROWSER, against the external API - which
// sends no CORS headers, so the call was blocked outright - and only from the
// latest 20 releases, so an article older than those had no successor at all.
// It now runs here, behind /api/article/[id]/next.
//
// "Next" means the next-older release: the reader is moving back through the
// wire. IDs rise with publication, so "the newest release with a smaller id
// than this one" is that successor, whether or not the current article is
// itself in the pool. Past the end of the recent pool, the same rule is applied
// to the company's own feed, so an old article still continues with that
// company's previous release instead of dead-ending.

import { API_BASE, apiFetch, apiInit } from './api';
import { fetchCompanyArticles } from './company-articles';

/** Recent releases scanned for a successor. /api/Articles caps Size at 100. */
const POOL_SIZE = 100;

async function recentIds(): Promise<number[]> {
	try {
		const res = await apiFetch(
			`${API_BASE}/api/Articles?Page=1&Size=${POOL_SIZE}`,
			apiInit({ next: { revalidate: 300 } })
		);
		if (!res.ok) return [];
		const rows: { articleId: number }[] = await res.json();
		return Array.isArray(rows) ? rows.map((r) => r.articleId) : [];
	} catch {
		return [];
	}
}

/** The newest id strictly older than `currentId`, from a newest-first list. */
function firstOlder(ids: number[], currentId: number): number | null {
	let best: number | null = null;
	for (const id of ids) {
		if (id < currentId && (best === null || id > best)) best = id;
	}
	return best;
}

export async function getNextArticleId(
	currentId: number,
	companyId?: string | null
): Promise<number | null> {
	const pool = await recentIds();
	const oldest = pool.length > 0 ? Math.min(...pool) : Infinity;

	// Inside the recent window: the wire's own order decides.
	if (currentId > oldest) {
		const next = firstOlder(pool, currentId);
		if (next !== null) return next;
	}

	// Older than anything recent: continue through this company's archive.
	if (companyId) {
		const feed = await fetchCompanyArticles(companyId, POOL_SIZE);
		return firstOlder(
			feed.map((a) => a.id),
			currentId
		);
	}

	return null;
}
