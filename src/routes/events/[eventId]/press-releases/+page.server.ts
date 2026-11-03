// TODO: Replace with real event-article relation when API supports it
//
// /events/<eventId>/press-releases - ported as-is from the Next app's
// app/events/[eventId]/press-releases/page.tsx.
//
// An orphan route: nothing on the site links here any more (the /events rows
// and the detail page both point at /events/<id>, which renders the releases
// from the API). It is kept because Next still serves it. The article ids come
// from a hand-kept map, lib/server/data/event-article-mappings.json, with one
// entry.

import { fetchPressRelease, PressReleaseNotFoundError } from '#lib/server/press-release.ts';
import { fetchEvents } from '#lib/server/events.ts';
import { NO_STORE, PAGE_CACHE } from '#lib/server/cache.ts';
import type { PressReleaseRow } from '#lib/components/shared/PressReleaseItem.svelte';
import type { PressReleaseData } from '#lib/types.ts';
import mappings from '#lib/server/data/event-article-mappings.json';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, setHeaders }) => {
	const { eventId } = params;

	const articleIds: number[] = (mappings as Record<string, number[]>)[eventId] ?? [];

	const [events, results] = await Promise.all([
		fetchEvents(),
		Promise.allSettled(articleIds.map((id) => fetchPressRelease(id)))
	]);

	const event = events.find((e) => String(e.id) === eventId);
	const eventName = event?.description ?? `Event ${eventId}`;

	const articles: PressReleaseData[] = [];
	for (const result of results) {
		if (result.status === 'fulfilled') articles.push(result.value);
	}

	// Not in Next, which had ISR to lean on. A release the API says does not
	// exist is a real answer and safe to cache; any other failure, or an events
	// list that came back empty (fetchEvents degrades to [] on error, which
	// turns the heading into "Event <id>"), is an outage and must not be pinned
	// at the edge.
	const outage =
		events.length === 0 ||
		results.some((r) => r.status === 'rejected' && !(r.reason instanceof PressReleaseNotFoundError));
	setHeaders(outage ? NO_STORE : PAGE_CACHE);

	return {
		eventName,
		hasMappedIds: articleIds.length > 0,
		// Only what a row draws - not whole release bodies.
		articles: articles.map((data) => ({
			article: {
				id: data.id,
				headline: data.headline,
				dateTime: data.dateTime,
				thumbImage: data.photo?.[0] ?? null,
				description: data.bodyText ? data.bodyText.slice(0, 200) : null
			} satisfies PressReleaseRow,
			companyName: data.companies?.[0]?.company_Name ?? data.source,
			logoSrc: data.companies?.[0]?.logofilename ?? null,
			sectors: data.sector.length > 0 ? data.sector : null
		}))
	};
};
