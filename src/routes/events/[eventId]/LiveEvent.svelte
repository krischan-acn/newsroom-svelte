<!--
  routes/events/[eventId]/LiveEvent.svelte - ported from the Next app's
  app/events/[eventId]/LiveEvent.tsx. Not a route file: SvelteKit ignores
  anything here without a + prefix, so it sits beside the route it is the
  second half of, as it did in Next.

  The API-backed event detail page.

  This renders alongside - not instead of - the curated pages in
  lib/data/mock-events.ts. +page.server.ts resolves a mock slug first and only
  falls through to here for the numeric ids the live /events listing links to,
  so the four hand-written showcase events keep their full-fat design while
  every other event on the newswire now has a real page instead of a 404.

  The API carries roughly a third of what the curated pages render: it has
  dates, description, location, url, image and the organiser company, but no
  subtitle, venue, city, organiser blurb, admission, opening hours, about-copy
  or attendance stats. Rather than invent them, every card here is built on the
  Rail primitives and self-omits when its value is missing (see the
  self_omitting_cards convention), so this page is thinner than a curated one
  but nothing on it is fabricated.
-->
<script lang="ts">
	// Types only: lib/server cannot be imported by a component, so the load
	// hands over EVENT_TZ_LABEL as `tzLabel`.
	import type { Event, EventRelease } from '#lib/server/events.ts';
	import { SITE_URL, jsonLdScript, safeUrl } from '#lib/site.ts';
	import EventCountdown from '#lib/components/features/events/EventCountdown.svelte';
	import { eventDayCount, formatEventRange, type EventPhase } from '#lib/components/features/events/event-date.ts';
	import PressReleaseItem, { type PressReleaseRow } from '#lib/components/shared/PressReleaseItem.svelte';
	import Rail from '#lib/components/shared/Rail.svelte';
	import RailRow from '#lib/components/shared/RailRow.svelte';
	import RailSection from '#lib/components/shared/RailSection.svelte';

	interface Props {
		event: Event;
		releases: EventRelease[];
		/** Computed in the load, where Next computed it in this component - both at render time. */
		phase: EventPhase;
		/** EVENT_TZ_LABEL from lib/server/events.ts. */
		tzLabel: string;
	}

	let { event, releases, phase, tzLabel }: Props = $props();

	/** Neutral stand-in for the per-event gradient the curated pages carry. */
	const HERO_GRADIENT = 'from-slate-800 to-slate-600';

	function toCompanyArticle(release: EventRelease): PressReleaseRow {
		return {
			id: release.id,
			headline: release.headline,
			dateTime: release.dateTime,
			thumbImage: null,
			description: release.summary
		};
	}

	const days = $derived(eventDayCount(event.startDate, event.endDate));
	const organiser = $derived(event.companies[0] ?? null);
	const website = $derived(safeUrl(event.url));

	// Newest first, matching the curated pages.
	const sorted = $derived([...releases].sort((a, b) => b.dateTime.localeCompare(a.dateTime)));

	const jsonLd = $derived(
		jsonLdScript({
			'@context': 'https://schema.org',
			'@type': 'Event',
			name: event.description,
			startDate: event.startDate,
			endDate: event.endDate,
			eventStatus: 'https://schema.org/EventScheduled',
			eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
			url: `${SITE_URL}/events/${event.id}`,
			// The API gives one free-text location string with no structured parts, so
			// this is a bare Place name rather than an invented PostalAddress.
			...(event.location ? { location: { '@type': 'Place', name: event.location } } : {}),
			...(organiser
				? {
						organizer: {
							'@type': 'Organization',
							name: organiser.name,
							...(organiser.url ? { url: organiser.url } : {})
						}
					}
				: {})
		})
	);
</script>

<svelte:head>
	<!-- Escaped by jsonLdScript: API values cannot close this tag. -->
	{@html jsonLd}
</svelte:head>

<div class="bg-gradient-to-br {HERO_GRADIENT}">
	<div class="container mx-auto max-w-7xl px-4 py-12 lg:px-8 lg:py-16">
		<nav aria-label="Breadcrumb" class="mb-6 text-xs text-white/70">
			<a href="/events" class="hover:text-white hover:underline">Events</a>
			<span class="mx-2">/</span>
			<span class="text-white/90">{event.description}</span>
		</nav>

		<h1 class="max-w-3xl text-3xl leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
			{event.description}
		</h1>

		<dl class="mt-8 flex flex-col gap-x-10 gap-y-4 text-sm text-white/90 sm:flex-row sm:flex-wrap">
			<div>
				<dt class="text-[10px] font-semibold uppercase tracking-wider text-white/60">Dates</dt>
				<dd class="mt-1">{formatEventRange(event.startDate, event.endDate)}</dd>
			</div>
			{#if event.location}
				<div>
					<dt class="text-[10px] font-semibold uppercase tracking-wider text-white/60">Location</dt>
					<dd class="mt-1">{event.location}</dd>
				</div>
			{/if}
			<div>
				<dt class="text-[10px] font-semibold uppercase tracking-wider text-white/60">Duration</dt>
				<dd class="mt-1">
					{days}
					{days === 1 ? 'day' : 'days'}
				</dd>
			</div>
		</dl>
	</div>
</div>

<div class="container mx-auto min-h-125 max-w-7xl px-4 py-8 lg:px-8">
	<div class="flex flex-col-reverse gap-8 lg:flex-row lg:items-start lg:gap-12">
		<!-- Main column -->
		<div class="min-w-0 flex-1">
			{#if event.photo}
				<div class="mb-8 overflow-hidden border border-gray-200">
					<!-- A plain img, as everywhere in this port (Next needed a raw img
					     here because the eventimages host is not in its
					     remotePatterns). -->
					<img src={event.photo} alt={event.description} loading="lazy" class="w-full object-cover" />
				</div>
			{/if}

			<section class="mb-10">
				<div class="mb-4 flex flex-wrap items-baseline justify-between gap-2">
					<h2 class="text-2xl tracking-tight text-black">Press Releases</h2>
					<p class="text-xs text-gray-400">
						{sorted.length}
						{sorted.length === 1 ? 'release' : 'releases'} from this event
					</p>
				</div>

				{#if sorted.length === 0}
					<p class="py-8 text-gray-500">No press releases linked to this event yet.</p>
				{:else}
					<div class="divide-y divide-gray-200 border-t border-gray-200">
						{#each sorted as release (release.id)}
							<PressReleaseItem
								article={toCompanyArticle(release)}
								companyName={organiser?.name ?? ''}
								logoSrc={organiser?.logo ?? null}
								hideLogo
							/>
						{/each}
					</div>
				{/if}
			</section>
		</div>

		<Rail>
			<div class="mb-6">
				<EventCountdown
					startDate={event.startDate}
					endDate={event.endDate}
					{tzLabel}
					initialPhase={phase}
				/>
			</div>

			<RailSection boxed title="Event Details">
				<dl>
					<RailRow divided label="Dates" value={formatEventRange(event.startDate, event.endDate)} />
					<RailRow divided block label="Location" value={event.location} />
					<RailRow divided label="Organiser" value={organiser?.name ?? ''} />
				</dl>

				{#if website}
					<a href={website} target="_blank" rel="noopener noreferrer" class="button alt mt-4 block text-center">
						Visit event website
					</a>
				{/if}
			</RailSection>

			<!-- No opening hours, admission or venue card: gap EVT-02 - the API
			     has no time, price or venue field to fill them from. -->

			<p class="mt-2 text-[11px] leading-relaxed text-gray-400">
				{phase === 'ended'
					? 'Archived event page. Details reflect the show as it ran.'
					: 'Event details are drawn from the ACN Newswire events feed.'}
			</p>
		</Rail>
	</div>
</div>
