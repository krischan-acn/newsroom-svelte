<!-- common/menus/IndustryMenu.svelte - the 76 industries, one column per sector. -->
<script lang="ts">
	import { SECTORS } from '#lib/sectors.ts';

	let { onclose }: { onclose: () => void } = $props();

	const SECTIONS = Object.entries(
		SECTORS.reduce<Record<string, string[]>>((acc, sector) => {
			(acc[sector.sector_type] ??= []).push(sector.sector_name);
			return acc;
		}, {})
	).map(([category, items]) => ({ category, items }));
</script>

<div class="grid grid-cols-9 gap-6">
	{#each SECTIONS as section (section.category)}
		<div class="flex flex-col">
			<p class="dropdown-link label mb-3">{section.category}</p>
			<div class="space-y-3">
				{#each section.items as item (item)}
					<a href="/search?sec={encodeURIComponent(item)}" class="dropdown-link block" onclick={onclose}>{item}</a>
				{/each}
			</div>
		</div>
	{/each}
</div>
