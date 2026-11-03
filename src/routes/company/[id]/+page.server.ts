// /company/<id>?page=N - one company's profile and its press releases.
//
// Ported from the Next app's app/company/[id]/page.tsx. The profile and the feed
// are fetched in parallel, and each degrades on its own: an unreachable profile
// API renders the partial profile from the local index and curated file, and an
// unreachable feed renders FeedUnavailable. Neither is a 404.
//
// One difference from Next: when the profile API is unreachable AND no local
// source knows the id, Next 404'd. Here that is an uncached 503, the same rule
// the article route follows - a 404 is cached for an hour, and a real company
// would stay missing after the API recovered.

import { error } from '@sveltejs/kit';
import { fetchCompanyProfile } from '#lib/server/company-profile.ts';
import { fetchCompanyArticlesPage } from '#lib/server/company-articles.ts';
import { NO_STORE, PAGE_CACHE } from '#lib/server/cache.ts';
import type { PageServerLoad } from './$types';

const PAGE_SIZE = 15;

export const load: PageServerLoad = async ({ params, url, setHeaders }) => {
	const { id } = params;
	if (!/^\d+$/.test(id)) {
		setHeaders(PAGE_CACHE);
		error(404, 'Company not found');
	}

	const parsed = parseInt(url.searchParams.get('page') ?? '1', 10) || 1;
	// isFinite differs from Next: a 309+ digit ?page= parsed to Infinity and asked the API for pageNumber=Infinity.
	const requestedPage = Number.isFinite(parsed) ? Math.max(1, parsed) : 1;

	const [result, feed] = await Promise.all([
		fetchCompanyProfile(id),
		fetchCompanyArticlesPage(id, requestedPage, PAGE_SIZE)
	]);

	if (result.status === 'unreachable') {
		setHeaders(NO_STORE);
		error(503, 'The newswire is not responding right now');
	}

	if (result.status === 'missing') {
		setHeaders(PAGE_CACHE);
		error(404, 'Company not found');
	}

	const profile = result.profile;

	// Past the last page there is nothing to show and no way back but Previous,
	// so treat a too-high ?page= as a missing page rather than an empty feed.
	// An unreachable feed is excluded: we do not know that the page is past the
	// end, and 404ing a real page because the API blinked is the bug this whole
	// partial-render path exists to avoid.
	if (feed.articles.length === 0 && requestedPage > 1 && !feed.unavailable) {
		setHeaders(PAGE_CACHE);
		error(404, 'Page not found');
	}

	// A page assembled during an outage - partial profile or missing feed - must
	// not be pinned at the edge for an hour after the API recovers.
	setHeaders(profile.isPartial || feed.unavailable ? NO_STORE : PAGE_CACHE);

	return { id, profile, feed };
};
