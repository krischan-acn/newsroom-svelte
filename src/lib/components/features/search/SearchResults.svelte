<!--
  features/search/SearchResults.svelte - ported from the Next app's
  components/features/search/SearchResults.tsx. Markup and classes are verbatim.

  Sector labels go through the legacy lib/sector-mapper.ts ON PURPOSE: moving
  search results onto taxonomy.ts is PROJECT-CONTEXT blocker TAXONOMY-STEP3 in
  the newsroom repo, held back because it is a visible change.

  Next imported getSectorDisplayName from services/search.ts, whose first line
  loads the 3.6 MB prefetched-articles.json snapshot. It is a one-line wrapper
  around taxonomy.sectorLabel, which is used directly here instead.
-->
<script lang="ts" module>
	/** Was services/search.ts SearchResult in the Next app. */
	export interface SearchResult {
		id: number;
		headline: string;
		dateTime: string;
		thumbImage: string | null;
		description: string | null;
		companyName: string;
		companyLogo: string | null;
		sectors: string[];
		/** Raw upstream spelling; normalised for display by <LanguageTag>. */
		language: string | null;
	}
</script>

<script lang="ts">
	import PressReleaseItem from '#lib/components/shared/PressReleaseItem.svelte';
	import { getArticleCategories } from '#lib/sector-mapper.ts';
	import { sectorLabel } from '#lib/taxonomy.ts';
	import Pagination from './Pagination.svelte';

	interface Props {
		results: SearchResult[];
		totalResults: number;
		query: string;
		currentPage: number;
		limit: number;
	}

	let { results, totalResults, query, currentPage, limit }: Props = $props();

	const totalPages = $derived(Math.ceil(totalResults / limit));
</script>

<div>
	<p class="text-sm text-gray-500 mb-2">
		Showing <span class="font-semibold text-gray-700">{results.length}</span> of <span class="font-semibold text-gray-700"
			>{totalResults}</span
		>
		result{totalResults !== 1 ? 's' : ''}{#if query}
			for &ldquo;<span class="font-semibold text-gray-800">{query}</span>&rdquo;{/if}
	</p>

	{#if results.length === 0}
		<div class="py-16 text-center">
			<p class="text-gray-400 text-base">
				No results found{query ? ` for "${query}"` : ''}.
			</p>
			<p class="text-gray-400 text-sm mt-1">Try a different keyword or select a sector from the sidebar.</p>
		</div>
	{:else}
		<ul class="divide-y divide-gray-200">
			{#each results as article (article.id)}
				{@const displayCategories = getArticleCategories(article.sectors).map((s) => sectorLabel(s))}
				<li>
					<PressReleaseItem
						{article}
						companyName={article.companyName}
						logoSrc={article.companyLogo}
						sectors={displayCategories.length > 0 ? displayCategories : null}
						showMeta
					/>
				</li>
			{/each}
		</ul>
	{/if}

	<Pagination {currentPage} {totalPages} />
</div>
