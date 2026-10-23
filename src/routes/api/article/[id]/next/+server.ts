// GET /api/article/<id>/next?company=<companyId>
//
// The release the infinite scroll appends after <id>, ready to render: the
// release, its canonical path, and its "more from" list. 204 when there is no
// next release. See lib/server/next-article.ts for how "next" is chosen.

import { error, json } from '@sveltejs/kit';
import { getNextArticleId } from '#lib/server/next-article.ts';
import { fetchPressRelease } from '#lib/server/press-release.ts';
import { fetchCompanyArticles } from '#lib/server/company-articles.ts';
import { articlePath } from '#lib/server/acn-adapter.ts';
import { SITE_URL } from '#lib/site.ts';
import { NEXT_ARTICLE_CACHE } from '#lib/server/cache.ts';
import type { NextArticle } from '#lib/types.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, url, setHeaders }) => {
	if (!/^\d+$/.test(params.id)) error(400, 'Bad id');
	const company = url.searchParams.get('company');
	if (company !== null && !/^\d+$/.test(company)) error(400, 'Bad company');

	const nextId = await getNextArticleId(Number(params.id), company);
	if (nextId === null) return new Response(null, { status: 204 });

	try {
		const data = await fetchPressRelease(nextId);
		const related = await fetchCompanyArticles(data.companies?.[0]?.comp_ID);
		const urlPath = articlePath(data);

		// A short shared cache absorbs every reader scrolling the same release.
		setHeaders(NEXT_ARTICLE_CACHE);

		const body: NextArticle = { data, urlPath, canonicalUrl: `${SITE_URL}${urlPath}`, related };
		return json(body);
	} catch {
		return new Response(null, { status: 204 });
	}
};
