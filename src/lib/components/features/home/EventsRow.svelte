<!--
  features/home/EventsRow.svelte - the shelf of upcoming events.

  The server already narrowed this to upcoming events, but the cached page can
  be up to a day old, so it is filtered again against the reader's clock once
  the page is running: an event that has started since the page was cached
  drops out instead of being shown as upcoming.
-->
<script lang="ts">
	import type { Event } from '#lib/server/events.ts';
	import { safeUrl } from '#lib/site.ts';
	import ShelfScrollBar from './ShelfScrollBar.svelte';

	let { events }: { events: Event[] } = $props();

	let shelf: HTMLDivElement | undefined = $state();
	let today = $state<string | null>(null);

	$effect(() => {
		today = new Date().toISOString().slice(0, 10);
	});

	const upcoming = $derived(today ? events.filter((e) => e.startDate >= today!) : events);

	const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

	function formatEventDate(startDate: string, endDate: string): string {
		const start = new Date(startDate);
		const end = new Date(endDate);
		const sm = MONTHS[start.getUTCMonth()];
		const sd = start.getUTCDate();
		const em = MONTHS[end.getUTCMonth()];
		const ed = end.getUTCDate();
		if (sm === em && sd === ed) return `${sm} ${sd}`;
		if (sm === em) return `${sm} ${sd}–${ed}`;
		return `${sm} ${sd} – ${em} ${ed}`;
	}
</script>

{#if upcoming.length > 0}
	<section class="mx-auto max-w-[1920px] px-12 py-16">
		<div class="mb-8 flex items-center justify-between">
			<h2 class="text-3xl tracking-tight text-black">Events</h2>
			<a href="/events" class="button alt inline-flex items-center px-6 py-2.5">Explore Events</a>
		</div>

		<!-- Focusable so keyboard readers can scroll the shelf with the arrow keys. -->
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<div
			bind:this={shelf}
			role="region"
			aria-label="Events"
			tabindex="0"
			class="scrollbar-hide -mx-6 flex items-center gap-6 overflow-x-auto px-6 pb-2"
		>
			{#each upcoming as event (event.id)}
				<a href={safeUrl(event.url) ?? '/events'} target="_blank" rel="noopener noreferrer" class="shrink-0 self-start">
					<article class="flex w-[clamp(18rem,calc(25vw-2rem),28rem)] flex-col">
						<div class="mb-4 aspect-16/7 overflow-hidden bg-neutral-100">
							{#if event.photo}
								<img src={event.photo} alt={event.description} loading="lazy" class="h-full w-full object-cover" />
							{/if}
						</div>
						<div class="overflow-hidden" style="height: 120px">
							<h3 class="mb-2 text-base leading-snug text-black">{event.description}</h3>
							{#if event.location}
								<p class="mb-1 text-sm font-semibold text-gray-500">{event.location}</p>
							{/if}
							<p class="text-[10px] text-gray-400">{formatEventDate(event.startDate, event.endDate)}</p>
						</div>
					</article>
				</a>
			{/each}
		</div>

		<ShelfScrollBar target={shelf} />
	</section>
{/if}
