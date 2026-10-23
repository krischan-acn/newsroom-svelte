<!--
  features/article/ArticleSidebar.svelte - the release rail: issuer, summary,
  language editions, details, topics and the issuer's social links.

  Same dimensions as the company rail (both are built from shared/Rail), but
  borderless rather than boxed: the release headline is the page, and nothing
  here should compete with it.
-->
<script lang="ts">
	import { dev } from '$app/env';
	import type { PressReleaseData } from '#lib/types.ts';
	import type { ReleaseVersion } from '#lib/server/release-versions.ts';
	import { RELEASE_VERSIONS_SUPPORTED } from '#lib/release-versions.ts';
	import { formatDateTime } from '#lib/format.ts';
	import Rail from '../../shared/Rail.svelte';
	import RailSection from '../../shared/RailSection.svelte';
	import RailRow from '../../shared/RailRow.svelte';
	import LanguageTag from '../../shared/LanguageTag.svelte';
	import SocialLinks, { type SocialLink } from '../../shared/SocialLinks.svelte';
	import { RAIL_PILL } from '../../shared/rail';

	let { data, versions = [] }: { data: PressReleaseData; versions?: ReleaseVersion[] } = $props();

	const company = $derived(data.companies?.[0]);

	const socials = $derived<SocialLink[]>(
		company
			? ([
					{ label: 'Facebook', url: company.facebook },
					{ label: 'X', url: company.twitter },
					{ label: 'LinkedIn', url: company.linkedin },
					{ label: 'YouTube', url: company.youtube },
					{ label: 'Telegram', url: company.telegram }
				].filter((s) => Boolean(s.url)) as SocialLink[])
			: []
	);

	// sub_Location is the city, name the country: "TOKYO, Japan".
	const place = $derived([data.location?.sub_Location, data.location?.name].filter(Boolean).join(', '));
</script>

<Rail sticky bordered>
	{#if company}
		<RailSection title="Released by">
			{#if company.logofilename}
				<img
					src={company.logofilename}
					alt={company.company_Name}
					loading="lazy"
					class="mb-2 max-h-10 w-auto max-w-[140px] object-contain object-left"
				/>
			{/if}
			<a href="/company/{company.comp_ID}" class="text-xs font-semibold text-gray-900 transition-colors hover:text-[#2088c9]">
				{company.company_Name}
			</a>
		</RailSection>
	{/if}

	{#if data.summary}
		<RailSection title="Release summary">
			<p class="text-xs leading-relaxed text-gray-600">{data.summary}</p>
		</RailSection>
	{/if}

	{#if versions.length > 0}
		<RailSection title="Release versions">
			<div class="flex flex-wrap gap-1.5">
				{#each versions as version (version.articleId)}
					{#if version.href}
						<a href={version.href} class="{RAIL_PILL} border border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900">
							{version.label}
						</a>
					{:else}
						<span aria-current="true" class="{RAIL_PILL} bg-[#2088c9] text-white">{version.label}</span>
					{/if}
				{/each}
			</div>

			<!-- Development only: shows what this block becomes once the API can group translations. -->
			{#if dev && !RELEASE_VERSIONS_SUPPORTED}
				<div class="mt-2 rounded border border-dashed border-amber-300 bg-amber-50/50 p-2">
					<p class="text-[10px] leading-relaxed text-amber-800">
						<span class="font-semibold">Stub.</span> Only the current edition is listed — the API has no key linking a
						release to its translations. See <code class="font-mono">lib/server/release-versions.ts</code>.
					</p>
				</div>
			{/if}
		</RailSection>
	{/if}

	<RailSection title="Details">
		<dl>
			<RailRow label="Published" value={formatDateTime(data.dateTime, data.language)} />
			<RailRow label="Source" value={data.source} />
			<RailRow label="Location" value={place} />
			{#if data.language}
				<RailRow label="Language"><LanguageTag value={data.language} /></RailRow>
			{/if}
			<RailRow label="Topic" value={data.topic} />
			<RailRow label="Views" value={data.views !== '0' ? data.views : null} />
		</dl>
	</RailSection>

	{#if data.sector.length > 0}
		<RailSection title="Topics">
			<div class="flex flex-wrap gap-1.5">
				{#each data.sector as sector (sector)}
					<a
						href="/search?sector={encodeURIComponent(sector)}"
						class="{RAIL_PILL} bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
					>
						{sector}
					</a>
				{/each}
			</div>
		</RailSection>
	{/if}

	{#if socials.length > 0}
		<RailSection title="Follow">
			<SocialLinks links={socials} withLabels />
		</RailSection>
	{/if}
</Rail>
