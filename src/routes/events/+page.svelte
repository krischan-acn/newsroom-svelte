<!-- /events - ported from the Next app's app/events/page.tsx. Markup and classes are verbatim. -->
<script lang="ts">
	import { SITE_URL, safeUrl } from '#lib/site.ts';
	import EventListCard, { type EventListCardData } from '#lib/components/features/events/EventListCard.svelte';
	import type { PageData } from './$types';

	let { data } = $props();

	type EventRow = PageData['upcoming'][number];

	// generateListingMetadata('events') in the Next app's lib/metadata.ts.
	const TITLE = 'Events';
	const DESCRIPTION = 'Browse upcoming and past events featured on ACN Newswire.';

	function formatEventDateRange(start: string, end: string): string {
		const parse = (iso: string) => {
			const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
			return new Date(y, m - 1, d);
		};
		const s = parse(start);
		const e = parse(end);
		if (start.slice(0, 10) === end.slice(0, 10)) {
			return s.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
		}
		if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
			return `${s.getDate()} - ${e.getDate()} ${s.toLocaleDateString('en-GB', { month: 'long' })} ${s.getFullYear()}`;
		}
		return `${s.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })} - ${e.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`;
	}
</script>

<svelte:head>
	<title>{TITLE} | ACN Newswire</title>
	<meta name="description" content={DESCRIPTION} />
	<link rel="canonical" href="{SITE_URL}/events" />
	<meta property="og:title" content={TITLE} />
	<meta property="og:description" content={DESCRIPTION} />
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={TITLE} />
	<meta name="twitter:description" content={DESCRIPTION} />
</svelte:head>

{#snippet eventItem(event: EventRow)}
	<!-- Points at this site's own event page rather than the organiser's site.
	     Until the live detail route existed these rows could only link outward;
	     /events/<id> now renders the show's releases from the API. -->
	<div class="flex items-stretch gap-0 py-4">
		<a href="/events/{event.id}" class="flex items-stretch flex-1 min-w-0 group">
			{#if event.photo}
				<img src={event.photo} alt={event.description} loading="lazy" class="w-40 shrink-0 object-cover" />
			{:else}
				<!-- Differs from Next: it rendered event.photo! unguarded, so an event
				     with no photo got a src-less <img> - a broken-image box. An empty
				     block of the same width keeps the row aligned with its neighbours. -->
				<div class="w-40 shrink-0 bg-neutral-100" aria-hidden="true"></div>
			{/if}

			<!-- Divider -->
			<div class="w-px bg-gray-200 shrink-0 self-stretch mx-1"></div>

			<!-- Content -->
			<div class="flex-1 min-w-0 px-4 flex flex-col justify-center gap-1">
				<h3 class="text-md text-gray-900 leading-snug line-clamp-1 group-hover:text-[#2088c9] transition-colors">
					{event.description}
				</h3>
				<div class="flex flex-row gap-2 mt-0.5">
					<p class="text-xs text-gray-400">
						{formatEventDateRange(event.startDate, event.endDate)}
					</p>
				</div>
				{#if event.location}
					<p class="text-xs text-gray-500 line-clamp-2">
						{event.location}
					</p>
				{/if}
			</div>
		</a>

		<!-- Action buttons. These rolled their own bordered pill until now -
		     .button.alt from globals.css is the site-wide button, and is what
		     both event detail pages already use. -->
		<div class="shrink-0 flex flex-col justify-center gap-2 pl-4">
			<a href="/events/{event.id}" class="button alt block text-center whitespace-nowrap">
				Event Press Releases
			</a>
			<a
				href={safeUrl(event.url)}
				target="_blank"
				rel="noopener noreferrer"
				class="button alt block text-center whitespace-nowrap"
			>
				Event Website
			</a>
		</div>
	</div>
{/snippet}

{#snippet eventSection(title: string, events: EventRow[], hiddenCount = 0)}
	{#if events.length > 0}
		<section class="mb-10">
			<h2 class="text-2xl tracking-tight text-black mb-4">{title}</h2>
			<div class="divide-y divide-gray-100">
				{#each events as event (event.id)}
					{@render eventItem(event)}
				{/each}
			</div>
			{#if hiddenCount > 0}
				<p class="mt-4 text-xs text-gray-400">
					Showing the {events.length} most recent of {events.length + hiddenCount} past events.
				</p>
			{/if}
		</section>
	{/if}
{/snippet}

<!--
  Events that have a full page on this site - countdown, details and the
  releases filed against them. Sample data for now; see lib/data/mock-events.ts.
-->
{#snippet featuredEventSection(title: string, events: EventListCardData[], note?: string)}
	{#if events.length > 0}
		<section class="mb-10">
			<div class="mb-4 flex flex-wrap items-baseline justify-between gap-2">
				<h2 class="text-2xl tracking-tight text-black">{title}</h2>
				{#if note}<p class="text-xs text-gray-400">{note}</p>{/if}
			</div>
			<div class="divide-y divide-gray-100 border-y border-gray-100">
				{#each events as event (event.slug)}
					<EventListCard {event} />
				{/each}
			</div>
		</section>
	{/if}
{/snippet}

<div class="container mx-auto px-4 py-6 max-w-7xl">
	<h1 class="text-3xl tracking-tight text-black mb-8">Events</h1>

	{@render featuredEventSection(
		'Featured Events',
		data.featured.upcoming,
		'Full event pages with live countdown and linked press releases'
	)}

	{#if !data.hasEvents}
		{#if data.featured.upcoming.length === 0 && data.featured.past.length === 0}
			<p class="text-gray-500 py-8">No events scheduled.</p>
		{/if}
	{:else}
		{@render eventSection('Upcoming Events', data.upcoming)}
		{@render eventSection('Past Events', data.past, data.pastHidden)}
	{/if}

	{@render featuredEventSection('Featured Archive', data.featured.past)}
</div>
