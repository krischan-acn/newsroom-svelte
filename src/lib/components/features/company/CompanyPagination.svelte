<!--
  features/company/CompanyPagination.svelte - ported from the Next app. Classes are verbatim.

  Prev/Next rather than numbered pages: the feed endpoint returns no total
  count, so the last page number is unknowable without walking the archive.

  The Next version put a NavPending spinner inside each link; it is not ported.
  The layout's progress bar is the feedback for a client-side navigation here.
-->
<script lang="ts">
	interface Props {
		basePath: string;
		page: number;
		hasNext: boolean;
		hasPrevious: boolean;
	}

	let { basePath, page, hasNext, hasPrevious }: Props = $props();

	// inline-flex + gap kept verbatim from Next, where they laid out the spinner beside the label.
	const BUTTON = 'inline-flex items-center gap-2 px-4 py-2 text-sm rounded border transition-colors';
	const ENABLED = 'text-gray-700 border-gray-300 hover:bg-gray-50';
	const DISABLED = 'text-gray-300 border-gray-200 pointer-events-none';

	const hrefFor = (target: number) => (target <= 1 ? basePath : `${basePath}?page=${target}`);
</script>

{#if hasNext || hasPrevious}
	<nav class="flex items-center justify-between mt-8" aria-label="Press release pages">
		<a
			href={hasPrevious ? hrefFor(page - 1) : '#'}
			aria-disabled={hasPrevious ? 'false' : 'true'}
			tabindex={hasPrevious ? undefined : -1}
			class="{BUTTON} {hasPrevious ? ENABLED : DISABLED}"
		>
			Previous
		</a>

		<span class="text-sm text-gray-600">Page {page}</span>

		<a
			href={hasNext ? hrefFor(page + 1) : '#'}
			aria-disabled={hasNext ? 'false' : 'true'}
			tabindex={hasNext ? undefined : -1}
			class="{BUTTON} {hasNext ? ENABLED : DISABLED}"
		>
			Next
		</a>
	</nav>
{/if}
