<!-- common/menus/SectorMenu.svelte - the nine broad sectors. -->
<script lang="ts">
	import { SECTOR_TYPES } from '#lib/sectors.ts';

	let { onclose }: { onclose: () => void } = $props();
</script>

<div class="grid grid-cols-9 gap-6">
	{#each SECTOR_TYPES as sector (sector)}
		<p>
			<a href="/search?sec={encodeURIComponent(sector)}" class="dropdown-link" onclick={onclose}>{sector}</a>
		</p>
	{/each}
</div>
