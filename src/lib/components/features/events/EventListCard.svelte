<!--
  features/events/EventListCard.svelte - ported from the Next app's
  components/features/events/EventListCard.tsx.

  Listing row for an event that has a page on this site. The live /events rows
  link straight out to the organiser's website because that is all the API
  gives us; these link inward, so the row advertises what is behind it - a
  countdown, the venue, and the release count.

  Takes the fields it draws rather than a whole MockEvent (the Next prop): page
  data is serialised into the HTML here, and the releases, about-copy and stats
  of every curated event have no business riding along on the listing. The
  release count is passed in instead of read off `pressReleases.length`.
-->
<script lang="ts" module>
	import type { MockEvent } from '#lib/data/mock-events.ts';

	export type EventListCardData = Pick<
		MockEvent,
		'slug' | 'name' | 'subtitle' | 'startDate' | 'endDate' | 'venue' | 'city' | 'heroGradient'
	> & { pressReleaseCount: number };
</script>

<script lang="ts">
	import { formatEventRange } from './event-date';
	import EventStatusPill from './EventStatusPill.svelte';

	let { event }: { event: EventListCardData } = $props();
</script>

<a href="/events/{event.slug}" class="group flex items-stretch py-4">
	<!-- Stands in for the photo the live rows carry. The gradient is the
	     event's own, so a row and its page read as the same thing. -->
	<div class="flex w-40 shrink-0 flex-col justify-end bg-gradient-to-br p-3 {event.heroGradient}" aria-hidden="true">
		<span class="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70">
			{event.city}
		</span>
		<span class="mt-0.5 text-sm leading-tight text-white">
			{event.startDate.slice(0, 4)}
		</span>
	</div>

	<div class="mx-1 w-px shrink-0 self-stretch bg-gray-200"></div>

	<div class="flex min-w-0 flex-1 flex-col justify-center gap-1.5 px-4">
		<h3 class="text-md leading-snug text-gray-900 transition-colors group-hover:text-[#2088c9]">
			{event.name}
		</h3>
		<p class="line-clamp-1 text-xs text-gray-500">{event.subtitle}</p>
		<p class="text-xs text-gray-400">
			{formatEventRange(event.startDate, event.endDate)} · {event.venue}
		</p>
		<div class="mt-1 flex flex-wrap items-center gap-2">
			<EventStatusPill startDate={event.startDate} endDate={event.endDate} />
			<span class="text-xs text-gray-400">
				{event.pressReleaseCount} press release{event.pressReleaseCount === 1 ? '' : 's'}
			</span>
		</div>
	</div>

	<div class="hidden shrink-0 flex-col justify-center pl-4 sm:flex">
		<span class="whitespace-nowrap rounded border border-gray-300 px-3 py-1.5 text-xs text-gray-700 group-hover:bg-gray-50">
			View event
		</span>
	</div>
</a>
