<!-- common/DateDisplay.svelte - today's date, filled in on mount for the same reason as the clocks. -->
<script lang="ts">
	let label = $state('');

	$effect(() => {
		label = new Date().toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
	});
</script>

{#if label}
	<p class="m-0 text-xs text-gray-400">{label}</p>
{/if}
