<!--
  features/search/CompanyResults.svelte - ported from the Next app's
  components/features/search/CompanyResults.tsx. Markup and classes are verbatim.

  The company-search result list. Takes props only; the lookup happens in
  routes/search/+page.server.ts, per the fetch-in-pages convention.
-->
<script lang="ts">
	import type { CompanySearchResult } from '#lib/server/company-search.ts';
	import Pagination from './Pagination.svelte';

	interface Props {
		results: CompanySearchResult[];
		totalResults: number;
		query: string;
		currentPage: number;
		limit: number;
	}

	let { results, totalResults, query, currentPage, limit }: Props = $props();

	const totalPages = $derived(Math.ceil(totalResults / limit));
</script>

{#snippet companyRow(company: CompanySearchResult)}
	<a href="/company/{company.id}" class="flex items-center gap-4 py-4 group">
		<!--
		  Raw <img>: www.acnnewswire.com is not in next.config.ts remotePatterns,
		  the same constraint the event photos hit. A company with no logo gets the
		  initial rather than a broken frame or a layout shift.
		  (Port: kept as the same raw <img>, and no handlers on it - see the CSP
		  note in README.md.)
		-->
		<span class="flex-shrink-0 w-12 h-12 flex items-center justify-center border border-gray-200 bg-white overflow-hidden">
			{#if company.logoSrc}
				<img src={company.logoSrc} alt="" class="max-w-full max-h-full object-contain" loading="lazy" />
			{:else}
				<span class="text-lg text-gray-400">{company.name.charAt(0)}</span>
			{/if}
		</span>

		<span class="min-w-0">
			<span class="block text-base text-gray-900 group-hover:underline">
				{company.name}
			</span>
			{#if company.altNames.length > 0}
				<span class="block text-sm text-gray-500 truncate">
					{company.altNames.join(' · ')}
				</span>
			{/if}
		</span>
	</a>
{/snippet}

<div>
	<p class="text-sm text-gray-500 mb-2">
		Showing <span class="font-semibold text-gray-700">{results.length}</span> of <span class="font-semibold text-gray-700"
			>{totalResults}</span
		>
		compan{totalResults === 1 ? 'y' : 'ies'}{#if query}
			for &ldquo;<span class="font-semibold text-gray-800">{query}</span>&rdquo;{/if}
	</p>

	{#if results.length === 0}
		<div class="py-16 text-center">
			<p class="text-gray-400 text-base">
				No companies found{query ? ` for "${query}"` : ''}.
			</p>
			<p class="text-gray-400 text-sm mt-1">Search by company name — this looks up companies, not headlines.</p>
		</div>
	{:else}
		<ul class="divide-y divide-gray-200">
			{#each results as company (company.id)}
				<li>
					{@render companyRow(company)}
				</li>
			{/each}
		</ul>
		{#if totalPages > 1}
			<Pagination {currentPage} {totalPages} />
		{/if}
	{/if}
</div>
