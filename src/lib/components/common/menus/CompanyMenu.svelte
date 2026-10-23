<!--
  common/menus/CompanyMenu.svelte

  Placeholder content, carried over as-is: the API has no company directory to
  fill these columns from yet (gap CO-04), so every link is "#".
-->
<script lang="ts">
	let { onclose }: { onclose: () => void } = $props();

	const GROUPS = ['Recent', 'China', 'Hong Kong', 'Indonesia', 'Japan', 'Malaysia', 'Singapore'];
	const PLACEHOLDERS = ['One', 'Two', 'Three', 'Four', 'Five'];
	const ALPHABET = ['#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
</script>

<div class="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-4 xl:grid-cols-7">
	{#each GROUPS as group (group)}
		<div class="min-w-35">
			<p class="dropdown-link label mb-3">{group}</p>
			<div class="space-y-3">
				{#each PLACEHOLDERS as label (label)}
					<a href="#top" class="dropdown-link block" onclick={onclose}>{label}</a>
				{/each}
			</div>
		</div>
	{/each}
</div>

<div class="mt-6 border-t border-gray-200 pt-4">
	<p class="dropdown-link label">By Name:</p>
	<div class="inline-flex flex-wrap gap-1">
		{#each ALPHABET as letter (letter)}
			<a href="#top" class="dropdown-link" onclick={onclose}>{letter}</a>
		{/each}
	</div>
</div>
