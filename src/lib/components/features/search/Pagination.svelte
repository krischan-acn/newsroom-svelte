<!--
  features/search/Pagination.svelte - ported from the Next app's
  components/features/search/Pagination.tsx. Markup and classes are verbatim,
  less the pending spinner (see below).

  Two consumers (SearchResults, CompanyResults), both in features/search, so it
  stays feature-local (BIBLE.md, the tier rule).
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	interface Props {
		currentPage: number;
		totalPages: number;
	}

	let { currentPage, totalPages }: Props = $props();

	// Next's note: router.push() into the same segment shows no loading.tsx
	// fallback - only the query string changed - and sector browse behind it is
	// a live call to /api/Articles/by-industry per selected sector. Without
	// feedback the buttons sat inert for the whole round trip and readers clicked
	// them again. Next answered that with useTransition: aria-busy, both buttons
	// disabled and a spinner beside "Page N of M".
	//
	// Port: the layout's progress bar is the feedback a pager click gets here
	// (it shows for every client navigation, this one included), so the
	// useTransition spinner, its fixed-width slot and the pending-disabled state
	// are not ported - the same call /news made for Next's NavPending.

	function handlePageChange(p: number) {
		const params = new URLSearchParams(page.url.searchParams.toString());
		params.set('page', p.toString());
		// Plain goto: Next's router.push scrolled the page back to the top here (no
		// scroll: false). SvelteKit 3 folds keepFocus/noScroll into one `reset`
		// option, so the default also resets focus to <body>, which Next did not.
		goto(`/search?${params.toString()}`);
	}
</script>

{#if totalPages > 1}
	<div class="flex justify-center items-center gap-2 mt-8 pt-4 border-t border-gray-200">
		<button
			onclick={() => handlePageChange(currentPage - 1)}
			disabled={currentPage === 1}
			class="px-3 py-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
		>
			Previous
		</button>

		<span class="inline-flex items-center gap-2 text-sm text-gray-600">
			Page {currentPage} of {totalPages}
		</span>

		<button
			onclick={() => handlePageChange(currentPage + 1)}
			disabled={currentPage === totalPages}
			class="px-3 py-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
		>
			Next
		</button>
	</div>
{/if}
