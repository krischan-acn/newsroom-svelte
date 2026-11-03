// /events/<eventId> - event detail page, resolved in two steps.
//
// Ported from the Next app's app/events/[eventId]/page.tsx.
//
// A slug in lib/data/mock-events.ts renders the curated page - four
// hand-built showcase events, unchanged, kept for client demos. Anything else
// is looked up against the live events API and rendered by ./LiveEvent.svelte,
// which is where the numeric ids the /events listing links to now land.
//
// Curated first, deliberately: those four are the design reference, and a slug
// can never collide with a numeric API id. Only ids the API does not know
// fall through to a 404.
//
// Next prerendered the four curated slugs through generateStaticParams. They
// are rendered on request here and then held at the edge like every other
// page; nothing is prerendered.

import { error } from '@sveltejs/kit';
import { getMockEvent } from '#lib/data/mock-events.ts';
import { fetchEvent, fetchEvents, fetchEventReleases, eventYear, EVENT_TZ_LABEL } from '#lib/server/events.ts';
import { NO_STORE, PAGE_CACHE } from '#lib/server/cache.ts';
import { eventPhase } from '#lib/components/features/events/event-date.ts';
import { deriveEventIndustries, trimIndustries } from '#lib/components/features/events/event-industries.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, setHeaders }) => {
	const { eventId } = params;
	const event = getMockEvent(eventId);

	if (!event) {
		const live = await fetchEvent(eventId);
		if (!live) {
			// fetchEvent also answers null when the API is down (its list fallback
			// degrades to []), and Next's notFound() could not tell the two apart.
			// Here an empty events list is taken as the API being down: that page
			// is an uncached 503, so a real event does not stay "not found" at the
			// edge for a day after the API recovers. A real 404 is cached.
			// (The list is held in memory, so this costs nothing when it is warm.)
			if ((await fetchEvents()).length === 0) {
				setHeaders(NO_STORE);
				error(503, 'The newswire is not responding right now');
			}
			setHeaders(PAGE_CACHE);
			error(404, 'Event not found');
		}

		// There is still no event->release endpoint; the organiser company plus the
		// year the show ran is the relation the API exposes. See fetchEventReleases.
		//
		// fetchEventReleases returns [] on a failure as well as for an organiser
		// that filed nothing that year, so an outage here caches a page reading
		// "No press releases linked to this event yet" for the hour. Accepted: the
		// event itself loaded, and most events genuinely have no releases.
		const releases = await fetchEventReleases(live.compId, eventYear(live));
		setHeaders(PAGE_CACHE);

		return {
			kind: 'live' as const,
			event: live,
			releases,
			phase: eventPhase(live.startDate, live.endDate, Date.now()),
			tzLabel: EVENT_TZ_LABEL
		};
	}

	const phase = eventPhase(event.startDate, event.endDate, Date.now());

	// Newest first - for a live show the latest release off the floor is the one
	// worth reading, and for an archive the closing report leads.
	const releases = [...event.pressReleases].sort((a, b) => b.dateTime.localeCompare(a.dateTime));

	const industryGroups = deriveEventIndustries(event.pressReleases);
	const industries = trimIndustries(industryGroups);

	setHeaders(PAGE_CACHE);

	// Page data is serialised into the HTML. The releases already travel, sorted,
	// as `releases`, and themes, features and coLocated are never rendered (see
	// MockEventTheme), so they are left off the event.
	const { pressReleases: _releases, themes: _themes, features: _features, coLocated: _coLocated, ...shown } = event;

	return {
		kind: 'curated' as const,
		event: shown,
		phase,
		releases,
		industries,
		// Every industry tag, not the trimmed set the block displays - the visual
		// cut is about screen space, and there is no reason to hide tags from a
		// crawler. Still one derived list, so it cannot drift from the page.
		keywords: industryGroups.flatMap((g) => g.industries.map((i) => i.name)).join(', ')
	};
};
