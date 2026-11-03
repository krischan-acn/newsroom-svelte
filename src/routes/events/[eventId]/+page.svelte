<!--
  /events/<eventId> - ported from the Next app's app/events/[eventId]/page.tsx.
  The curated page is rendered here; the live branch is ./LiveEvent.svelte.
  Markup and classes are verbatim.
-->
<script lang="ts">
	import { SITE_URL, jsonLdScript } from '#lib/site.ts';
	import EventCountdown from '#lib/components/features/events/EventCountdown.svelte';
	import EventReleaseItem from '#lib/components/features/events/EventReleaseItem.svelte';
	import {
		eventDayCount,
		formatEventMoment,
		formatEventRange
	} from '#lib/components/features/events/event-date.ts';
	import Rail from '#lib/components/shared/Rail.svelte';
	import RailRow from '#lib/components/shared/RailRow.svelte';
	import RailSection from '#lib/components/shared/RailSection.svelte';
	import LiveEvent from './LiveEvent.svelte';

	let { data } = $props();

	// Next's generateMetadata, both branches.
	//
	// Differs from Next in one respect: Next's titles were written as
	// "<name> | ACN Newswire" AND run through the root layout's
	// "%s | ACN Newswire" template, so the tab read "BEX Asia 2026 | ACN Newswire
	// | ACN Newswire". The suffix appears once here.
	//
	// The twitter tags are not in Next's generateMetadata either: Next inherited
	// twitter:card from the root layout and filled twitter:title and
	// twitter:description from openGraph. They are spelled out because this
	// port has no metadata merging.
	const meta = $derived.by(() => {
		if (data.kind === 'live') {
			const live = data.event;
			const liveDates = formatEventRange(live.startDate, live.endDate);
			const liveDescription = live.location
				? `${live.description}. ${liveDates}, ${live.location}.`
				: `${live.description}. ${liveDates}.`;
			return {
				title: live.description,
				description: liveDescription,
				url: `${SITE_URL}/events/${live.id}`
			};
		}
		const event = data.event;
		const dates = formatEventRange(event.startDate, event.endDate);
		return {
			title: event.name,
			description: `${event.subtitle}. ${dates}, ${event.venue}, ${event.city}. ${data.releases.length} press releases from the show.`,
			url: `${SITE_URL}/events/${event.slug}`
		};
	});

	const curatedJsonLd = $derived(
		data.kind === 'curated'
			? jsonLdScript({
					'@context': 'https://schema.org',
					'@type': 'Event',
					name: data.event.name,
					description: data.event.about[0],
					startDate: data.event.startDate,
					endDate: data.event.endDate,
					eventStatus: 'https://schema.org/EventScheduled',
					eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
					url: `${SITE_URL}/events/${data.event.slug}`,
					location: {
						'@type': 'Place',
						name: data.event.venue,
						address: {
							'@type': 'PostalAddress',
							addressLocality: data.event.city,
							addressCountry: data.event.country
						}
					},
					organizer: { '@type': 'Organization', name: data.event.organiser, url: data.event.website },
					// Every industry tag, not the trimmed set the block displays (see the load).
					keywords: data.keywords
				})
			: null
	);
</script>

<svelte:head>
	<title>{meta.title} | ACN Newswire</title>
	<meta name="description" content={meta.description} />
	<meta property="og:title" content={meta.title} />
	<meta property="og:description" content={meta.description} />
	<meta property="og:url" content={meta.url} />
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={meta.title} />
	<meta name="twitter:description" content={meta.description} />
	{#if curatedJsonLd}
		<!-- Escaped by jsonLdScript, though everything in it is the site's own sample data. -->
		{@html curatedJsonLd}
	{/if}
</svelte:head>

{#if data.kind === 'live'}
	<LiveEvent event={data.event} releases={data.releases} phase={data.phase} tzLabel={data.tzLabel} />
{:else}
	{@const event = data.event}
	{@const phase = data.phase}
	{@const releases = data.releases}
	{@const industries = data.industries}

	<!-- Hero -->
	<div class="bg-gradient-to-br {event.heroGradient}">
		<div class="container mx-auto max-w-7xl px-4 py-12 lg:px-8 lg:py-16">
			<nav aria-label="Breadcrumb" class="mb-6 text-xs text-white/70">
				<a href="/events" class="hover:text-white hover:underline">Events</a>
				<span class="mx-2">/</span>
				<span class="text-white/90">{event.name}</span>
			</nav>

			<!-- No tagline eyebrow here: an organiser's campaign slogan changes every
			     edition, is not in the events API, and would be one more field for
			     whoever maintains this data to chase. -->
			<h1 class="max-w-3xl text-3xl leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
				{event.name}
			</h1>

			<p class="mt-4 max-w-2xl text-base text-white/80 sm:text-lg">
				{event.subtitle}
			</p>

			<dl class="mt-8 flex flex-col gap-x-10 gap-y-4 text-sm text-white/90 sm:flex-row sm:flex-wrap">
				<div>
					<dt class="text-[10px] font-semibold uppercase tracking-wider text-white/60">Dates</dt>
					<dd class="mt-1">{formatEventRange(event.startDate, event.endDate)}</dd>
				</div>
				<div>
					<dt class="text-[10px] font-semibold uppercase tracking-wider text-white/60">Venue</dt>
					<dd class="mt-1">{event.venue}</dd>
				</div>
				<div>
					<dt class="text-[10px] font-semibold uppercase tracking-wider text-white/60">Duration</dt>
					<dd class="mt-1">{eventDayCount(event.startDate, event.endDate)} days</dd>
				</div>
			</dl>
		</div>
	</div>

	<!-- Stat band -->
	{#if event.stats.length > 0}
		<div class="border-y border-gray-200 bg-gray-50">
			<div class="container mx-auto max-w-7xl px-4 lg:px-8">
				<dl class="grid grid-cols-2 divide-gray-200 sm:grid-cols-4 sm:divide-x">
					{#each event.stats as stat (stat.label)}
						<div class="px-2 py-6 text-center sm:px-4">
							<dd class="text-2xl tracking-tight text-black sm:text-3xl">{stat.value}</dd>
							<dt class="mt-1 text-[11px] uppercase tracking-wider text-gray-500">
								{stat.label}
							</dt>
						</div>
					{/each}
				</dl>
			</div>
		</div>
	{/if}

	<div class="container mx-auto min-h-125 max-w-7xl px-4 py-8 lg:px-8">
		<div class="flex flex-col-reverse gap-8 lg:flex-row lg:items-start lg:gap-12">
			<!-- Main column -->
			<div class="min-w-0 flex-1">
				<section class="mb-10">
					<h2 class="mb-4 text-2xl tracking-tight text-black">About the Event</h2>
					<div class="space-y-4">
						{#each event.about as paragraph, i (i)}
							<p class="text-[15px] leading-relaxed text-gray-700">
								{paragraph}
							</p>
						{/each}
					</div>
				</section>

				<!-- Replaces the hand-written Programme Themes block: the same
				     industry tags the rest of the site filters on, counted across
				     this event's releases and ordered by weight.

				     Laid out as one column per sector so the whole block costs three
				     rows of height regardless of how many tags the releases carry. -->
				{#if industries.groups.length > 0}
					<section class="mb-10">
						<div class="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
							<h2 class="text-2xl tracking-tight text-black">Industries Covered</h2>
							<p class="text-xs text-gray-400">From this event&rsquo;s press release tags</p>
						</div>

						<div
							class="grid grid-cols-1 gap-x-8 border-y border-gray-200 py-3 sm:grid-cols-2 lg:grid-cols-3 lg:divide-x lg:divide-gray-200"
						>
							{#each industries.groups as group (group.category)}
								<div class="min-w-0 lg:px-4 lg:first:pl-0 lg:last:pr-0">
									<h3 class="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
										{group.category}
									</h3>
									<ul class="mt-1">
										{#each group.industries as industry (industry.name)}
											<li>
												<a
													href={industry.href}
													class="flex items-baseline justify-between gap-2 py-0.5 text-xs text-gray-700 transition-colors hover:text-[#2088c9]"
												>
													<span class="truncate">{industry.name}</span>
													<span class="shrink-0 tabular-nums text-[10px] text-gray-400">
														{industry.count}
													</span>
												</a>
											</li>
										{/each}
									</ul>
								</div>
							{/each}
						</div>

						{#if industries.hiddenCount > 0}
							<p class="mt-2 text-[11px] text-gray-400">
								+{industries.hiddenCount} more {industries.hiddenCount === 1
									? 'industry'
									: 'industries'}{industries.hiddenCategories.length > 0
									? `, including ${industries.hiddenCategories.join(' and ')}`
									: ''}
							</p>
						{/if}
					</section>
				{/if}

				<section class="mb-10">
					<div class="mb-4 flex flex-wrap items-baseline justify-between gap-2">
						<h2 class="text-2xl tracking-tight text-black">Press Releases</h2>
						<p class="text-xs text-gray-400">
							{releases.length} release{releases.length === 1 ? '' : 's'} from this event
						</p>
					</div>

					{#if releases.length === 0}
						<p class="py-8 text-gray-500">No press releases linked to this event yet.</p>
					{:else}
						<div class="divide-y divide-gray-200 border-t border-gray-200">
							{#each releases as release (release.id)}
								<EventReleaseItem {release} />
							{/each}
						</div>
					{/if}
				</section>
			</div>

			<!-- Rail: the countdown first, because on an upcoming event it is the
			     thing a visitor came for. -->
			<Rail>
				<div class="mb-6">
					<EventCountdown
						startDate={event.startDate}
						endDate={event.endDate}
						tzLabel={event.timezoneLabel}
						initialPhase={phase}
					/>
				</div>

				<RailSection boxed title="Event Details">
					<dl>
						<RailRow divided label="Dates" value={formatEventRange(event.startDate, event.endDate)} />
						<RailRow divided label="Opens" value={formatEventMoment(event.startDate, event.timezoneLabel)} />
						<RailRow divided label="Closes" value={formatEventMoment(event.endDate, event.timezoneLabel)} />
						<RailRow divided block label="Venue" value={event.venue} />
						<RailRow divided label="City" value={event.city} />
						<RailRow divided label="Organiser" value={event.organiser} />
						{#if event.strategicPartner}
							<RailRow divided block label="Strategic partner" value={event.strategicPartner} />
						{/if}
						<RailRow divided label="Admission" value={event.admission} />
						<RailRow divided block label="Opening hours">
							{#each event.openingHours as line (line)}
								<div>{line}</div>
							{/each}
						</RailRow>
					</dl>

					<a
						href={event.website}
						target="_blank"
						rel="noopener noreferrer"
						class="button alt mt-4 block text-center"
					>
						Visit event website
					</a>
				</RailSection>

				<!-- No "On the Floor" or "Co-located Events" cards: pavilions,
				     networking and what else runs at the venue are the organiser's
				     to keep current, and the event website is one click away in the
				     card above. This page aggregates the coverage instead. -->

				<p class="mt-2 text-[11px] leading-relaxed text-gray-400">
					{phase === 'ended'
						? 'Archived event page. Details reflect the show as it ran.'
						: 'Sample event page. Details are illustrative and not drawn from the newswire API.'}
				</p>
			</Rail>
		</div>
	</div>
{/if}
