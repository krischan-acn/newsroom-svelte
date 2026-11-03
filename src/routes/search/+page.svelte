<!--
  /search - ported from the Next app's app/search/page.tsx. Markup and classes
  are verbatim. The metadata is generateListingMetadata('search', q) from the
  Next app's lib/metadata.ts; robots (noindex, follow) comes from the load and
  is emitted by the layout.

  Next's search/loading.tsx skeleton is not ported: the layout's progress bar
  stands in for it.
-->
<script lang="ts">
	import { SITE_URL } from '#lib/site.ts';
	import SearchSidebar from '#lib/components/features/search/SearchSidebar.svelte';
	import SearchResults from '#lib/components/features/search/SearchResults.svelte';
	import CompanyResults from '#lib/components/features/search/CompanyResults.svelte';

	let { data } = $props();

	const title = $derived(data.q ? `Search: "${data.q}"` : 'Search');
	const description = $derived(
		data.q
			? `Find press releases about "${data.q}" on ACN Newswire.`
			: 'Search ACN Newswire for press releases, company news, and events across Asia.'
	);
</script>

<svelte:head>
	<title>{title} | ACN Newswire</title>
	<meta name="description" content={description} />
	<link rel="canonical" href="{SITE_URL}/search" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
</svelte:head>

<div class="container mx-auto px-4 py-6 max-w-7xl">
	<h1 class="text-3xl tracking-tight text-black mb-8">{data.heading}</h1>

	{#if data.isCompanyMode}
		<!--
		  No facet rail in company mode: sector, language and region are article
		  facets and none of them filter a company list.
		-->
		<CompanyResults
			results={data.companies}
			totalResults={data.companyTotal}
			query={data.q}
			currentPage={data.page}
			limit={data.limit}
		/>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-[2.5fr_7.5fr] gap-8">
			<aside>
				<SearchSidebar
					activeSectors={data.sectors}
					activeLanguages={data.languages}
					activeRegions={data.regions}
					currentQ={data.q}
					currentLimit={data.currentLimit}
				/>
			</aside>
			<main>
				<SearchResults
					results={data.sectorArticles}
					totalResults={data.sectorTotal}
					query=""
					currentPage={data.page}
					limit={data.sectorPageSize}
				/>
			</main>
		</div>
	{/if}
</div>
