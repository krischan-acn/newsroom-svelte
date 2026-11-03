// /search - ported from the Next app's app/search/page.tsx (and its
// generateMetadata; the metadata export in app/search/layout.tsx was dead there
// because generateMetadata wins, so it is not ported).
//
// /search has two modes, and which one runs is decided by the query string:
//
//   ?q=<name>          company lookup, against the static index in
//                      src/data/company-index.json
//   ?sec=<sector>      live sector browse, against /api/Articles/by-industry
//
// The keyword article search this page used to run is gone. It read the static
// src/data/prefetched-articles.json snapshot, which stays on disk as a secondary
// path (services/search.ts still exports searchArticles), but the search bar now
// answers "which company is this" rather than "which headline mentions this" —
// the flow being search a company, reach its page, read its releases.
//
// Sector browse is live rather than snapshot-backed because by-industry works
// and paginates. Language and region facets do not survive the move: the
// endpoint has no language parameter, and no endpoint exposes a country per
// article since the legacy host went 503. v1 is sector filtering only.
//
// (Port note: services/search.ts and that 3.6 MB snapshot are NOT ported. The
// only thing this page took from it was the SearchResult type, now in
// features/search/SearchResults.svelte, and getSectorDisplayName, which is
// taxonomy.sectorLabel.)
//
// Platform difference: Next handed a repeated ?q= or ?sector= to the page as an
// array, and `.trim()` / `.split()` on it threw. URLSearchParams.get() reads the
// first value instead.

import { searchCompanies } from '#lib/server/company-search.ts';
import { fetchArticlesByIndustry } from '#lib/server/news-list.ts';
import { NO_STORE, PAGE_CACHE } from '#lib/server/cache.ts';
import { sectorOf, sectorLabel } from '#lib/taxonomy.ts';
import type { SearchResult } from '#lib/components/features/search/SearchResults.svelte';
import type { PageServerLoad } from './$types';

/** Articles per page in sector browse. by-industry 400s above 100. */
const SECTOR_PAGE_SIZE = 20;

const DEFAULT_LIMIT = 20;

/**
 * Next's `params.x ? toArray(params.x) : …`: null when the param is absent or a
 * single empty value (both falsy there), otherwise every value.
 */
function toArray(searchParams: URLSearchParams, name: string): string[] | null {
	const values = searchParams.getAll(name);
	if (values.length === 0 || (values.length === 1 && !values[0])) return null;
	return values;
}

/** Next's legacy comma-separated params (?sector=, ?language=). */
function commaList(raw: string | null): string[] {
	return (
		raw
			?.split(',')
			.map((s) => s.trim())
			.filter(Boolean) ?? []
	);
}

// Differs from Next: an unparsable value (?page=abc) was NaN there; here it falls back to the default.
function positiveInt(raw: string | null, fallback: number): number {
	const n = Number.parseInt(raw ?? String(fallback), 10);
	return Number.isNaN(n) ? fallback : Math.max(1, n);
}

export const load: PageServerLoad = async ({ url, setHeaders }) => {
	const params = url.searchParams;

	const q = (params.get('q') ?? '').trim();
	const page = positiveInt(params.get('page'), 1);
	const limit = positiveInt(params.get('limit'), DEFAULT_LIMIT);

	// Sectors: new ?sec= param, fallback to legacy ?sector= (comma-separated)
	const sectors = toArray(params, 'sec') ?? commaList(params.get('sector'));

	// Languages: new ?lang= param, fallback to legacy ?language= (comma-separated)
	const languages = toArray(params, 'lang') ?? commaList(params.get('language'));

	// Regions: new ?reg= param only. Read so the sidebar keeps its checked state,
	// but not applied — see the note at the top about country data.
	// (?country= is not read at all, as in Next.)
	const regions = toArray(params, 'reg') ?? [];

	// A query beats a sector filter: someone who typed a name is looking for that
	// company, not for whatever facet was left checked from a previous search.
	const isCompanyMode = q.length > 0;

	const { companies, total: companyTotal } = isCompanyMode
		? searchCompanies({ q, page, limit })
		: { companies: [], total: 0 };

	// The mega-menu links per industry (76 values) but by-industry only accepts
	// the nine sector types, so every incoming value is resolved to its parent
	// sector. sectorOf() passes a sector key through unchanged and returns '' for
	// anything it does not recognise, which is then skipped rather than sent.
	const sectorKeys = isCompanyMode ? [] : [...new Set(sectors.map(sectorOf).filter(Boolean))];

	const sectorArticles: SearchResult[] = [];
	if (sectorKeys.length > 0) {
		const batches = await Promise.all(
			sectorKeys.map((key) => fetchArticlesByIndustry(key, SECTOR_PAGE_SIZE, page))
		);

		// Deduped across sectors: an article tagged under two of the selected
		// sectors comes back in both batches and would otherwise render twice.
		const seen = new Set<number>();
		for (const batch of batches) {
			for (const item of batch) {
				if (seen.has(item.id)) continue;
				seen.add(item.id);
				sectorArticles.push({
					id: item.id,
					headline: item.headline,
					dateTime: item.dateTime,
					thumbImage: item.thumbImage,
					description: item.description,
					companyName: item.companyName,
					companyLogo: item.logoSrc,
					sectors: item.sector ? [item.sector] : [],
					// by-industry carries no language field, so no tag is rendered rather
					// than one being guessed.
					language: null
				});
			}
		}
	}

	// The endpoint reports no total, so pagination is driven by whether the page
	// came back full: a short page is the last one. Claiming a total we do not
	// have would print a number that is simply wrong.
	//
	// Differs from Next: with no sector to browse (bare /search, or only
	// unrecognised ?sec= values) Next's comparison was 0 < 0, false, so it
	// claimed page * 20 + 1 results - "Showing 0 of 21 results" and a pager
	// over an empty list. Nothing was fetched, so the total is 0.
	const sectorTotal =
		sectorKeys.length === 0
			? 0
			: sectorArticles.length < SECTOR_PAGE_SIZE * sectorKeys.length
				? (page - 1) * SECTOR_PAGE_SIZE + sectorArticles.length
				: page * SECTOR_PAGE_SIZE + 1;

	const heading = isCompanyMode
		? `Companies matching “${q}”`
		: sectorKeys.length > 0
			? sectorKeys.map(sectorLabel).join(', ')
			: 'Search for a company';

	// Company lookup reads an in-memory index, so it is always safe to cache. A
	// sector browse that came back empty may be the API failing (news-list.ts
	// degrades to [] on error), and is not worth pinning at the edge for an hour.
	setHeaders(sectorKeys.length > 0 && sectorArticles.length === 0 ? NO_STORE : PAGE_CACHE);

	return {
		// Search is noindex, follow (generateListingMetadata's `index: false`).
		robots: 'noindex, follow',
		q,
		page,
		limit,
		heading,
		isCompanyMode,
		companies,
		companyTotal,
		sectors,
		languages,
		regions,
		sectorArticles,
		sectorTotal,
		sectorPageSize: SECTOR_PAGE_SIZE,
		currentLimit: params.get('limit') ?? ''
	};
};
