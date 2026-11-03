// /events - the curated showcase events plus the live archive.
//
// Ported from the Next app's app/events/page.tsx. The markup lives in
// +page.svelte; this does what the server component did before rendering:
// split the live list into upcoming and past, cap the past list, and split the
// curated events by date.
//
// Both splits use the server's clock, as Next's did. The page is held at the
// edge for up to a day (lib/server/cache.ts), so a show can sit on the wrong
// side of the line for that long - the same staleness Next's revalidated
// render had, and the listing rows say nothing time-sensitive themselves (the
// status pills compute their label from the reader's clock after mount).

import { fetchEvents, type Event } from '#lib/server/events.ts';
import { NO_STORE, PAGE_CACHE } from '#lib/server/cache.ts';
import { listMockEvents, type MockEvent } from '#lib/data/mock-events.ts';
import type { EventListCardData } from '#lib/components/features/events/EventListCard.svelte';
import type { PageServerLoad } from './$types';

/** How many past events the listing renders. See the note in the load below. */
const PAST_LIMIT = 60;

/** What a live row draws - not the organiser list or the unused press-release URL. */
type EventRow = Pick<Event, 'id' | 'startDate' | 'endDate' | 'description' | 'location' | 'url' | 'photo'>;

function toRow(e: Event): EventRow {
	return {
		id: e.id,
		startDate: e.startDate,
		endDate: e.endDate,
		description: e.description,
		location: e.location,
		url: e.url,
		photo: e.photo
	};
}

function toCard(e: MockEvent): EventListCardData {
	return {
		slug: e.slug,
		name: e.name,
		subtitle: e.subtitle,
		startDate: e.startDate,
		endDate: e.endDate,
		venue: e.venue,
		city: e.city,
		heroGradient: e.heroGradient,
		pressReleaseCount: e.pressReleases.length
	};
}

export const load: PageServerLoad = async ({ setHeaders }) => {
	const events = await fetchEvents();
	const featured = listMockEvents(Date.now());

	const today = new Date().toISOString().slice(0, 10);

	const upcoming = events
		.filter((e) => e.startDate >= today)
		.sort((a, b) => a.startDate.localeCompare(b.startDate));

	// The archive runs to 800+ shows. Rendering every one produced a 2.4MB page,
	// so the past list is capped while upcoming is always shown in full - that is
	// the half a visitor came for. Raise PAST_LIMIT or add a pager if the whole
	// archive needs to be browsable.
	const allPast = events
		.filter((e) => e.startDate < today)
		.sort((a, b) => b.startDate.localeCompare(a.startDate));
	const past = allPast.slice(0, PAST_LIMIT);
	const pastHidden = allPast.length - past.length;

	// fetchEvents degrades to [] on any API failure, and the archive is never
	// genuinely empty - so an empty list is an outage, not worth pinning at the
	// edge for an hour.
	setHeaders(events.length > 0 ? PAGE_CACHE : NO_STORE);

	return {
		hasEvents: events.length > 0,
		upcoming: upcoming.map(toRow),
		past: past.map(toRow),
		pastHidden,
		featured: {
			upcoming: featured.upcoming.map(toCard),
			past: featured.past.map(toCard)
		}
	};
};
