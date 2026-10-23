// A press release page, at any of the URL shapes the site has ever linked:
//   /article/<id>
//   /article/<id>/<slug>
//   /article/<lang>/<id>/<slug>   <- canonical
//
// There is no redirect to the canonical path. Every home and list link is the
// bare /article/<id>; the page renders wherever it was asked for, points search
// engines at the canonical address, and the infinite scroll moves the address
// bar onto it as the reader goes.

import { error } from '@sveltejs/kit';
import { fetchPressRelease, PressReleaseNotFoundError } from '#lib/server/press-release.ts';
import { fetchCompanyArticles } from '#lib/server/company-articles.ts';
import { fetchReleaseVersions } from '#lib/server/release-versions.ts';
import { articlePath } from '#lib/server/acn-adapter.ts';
import { NO_STORE, PAGE_CACHE } from '#lib/server/cache.ts';
import { SITE_URL } from '#lib/site.ts';
import type { PageServerLoad } from './$types';

/** The numeric id in any of the shapes above. */
function extractId(segments: string[]): number | null {
	const id = segments.find((s) => /^\d+$/.test(s));
	return id ? Number(id) : null;
}

export const load: PageServerLoad = async ({ params, setHeaders }) => {
	const id = extractId(params.segments.split('/').filter(Boolean));
	if (id === null) error(404, 'Not found');

	try {
		const data = await fetchPressRelease(id);

		const [relatedArticles, versions] = await Promise.all([
			fetchCompanyArticles(data.companies?.[0]?.comp_ID),
			fetchReleaseVersions({ id: data.id, headline: data.headline, language: data.language })
		]);

		const urlPath = articlePath(data);
		setHeaders(PAGE_CACHE);

		return {
			data,
			relatedArticles,
			versions,
			urlPath,
			canonicalUrl: `${SITE_URL}${urlPath}`
		};
	} catch (e) {
		// Only the API saying "no such release" is a 404, and a 404 is safe to
		// cache. A timeout or a 5xx is an error page that must not be stored, or
		// a real release would stay missing after the API recovers.
		if (e instanceof PressReleaseNotFoundError) {
			setHeaders(PAGE_CACHE);
			error(404, 'Press release not found');
		}
		setHeaders(NO_STORE);
		error(503, 'The newswire is not responding right now');
	}
};
