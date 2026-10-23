<!-- common/menus/CountryMenu.svelte - every country, grouped by continent and sub-region. -->
<script lang="ts">
	import { REGIONS } from '#lib/regions.ts';

	let { onclose }: { onclose: () => void } = $props();
</script>

<div class="grid grid-cols-6 gap-6">
	{#each REGIONS as region (region.continent)}
		<div class="flex flex-col">
			<p class="dropdown-link label mb-3">{region.continent}</p>
			{#each region.subRegions as subRegion (subRegion.name)}
				<div class="mb-4">
					<p class="dropdown-link pointer-events-none mb-3 text-xs! font-semibold uppercase opacity-30">
						{subRegion.name}
					</p>
					<div class="space-y-3">
						{#each subRegion.countries as country (country)}
							<a href="/search?country={encodeURIComponent(country)}" class="dropdown-link block" onclick={onclose}>
								{country}
							</a>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/each}
</div>
