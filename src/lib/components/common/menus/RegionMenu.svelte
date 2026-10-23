<!-- common/menus/RegionMenu.svelte - continents and their sub-regions, each a search filter. -->
<script lang="ts">
	import { REGIONS } from '#lib/regions.ts';

	let { onclose }: { onclose: () => void } = $props();
</script>

<div class="grid grid-cols-6 gap-6">
	{#each REGIONS as region (region.continent)}
		<div class="flex flex-col">
			<p class="dropdown-link label mb-3">{region.continent}</p>
			<div class="space-y-3">
				{#each region.subRegions as subRegion (subRegion.name)}
					<a href="/search?reg={encodeURIComponent(subRegion.name)}" class="dropdown-link block" onclick={onclose}>
						{subRegion.name}
					</a>
				{/each}
			</div>
		</div>
	{/each}
</div>
