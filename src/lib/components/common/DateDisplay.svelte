<!--
  common/DateDisplay.svelte - today's date, filled in on mount for the same reason as the clocks.

  Refreshes once at the next midnight, as the Next component did, so a tab left
  open overnight does not show yesterday. The boundary is midnight UTC, not
  local, because that is what the Next version computed (Date.now() % 86400000);
  kept for parity.
-->
<script lang="ts">
	let label = $state('');

	const format = () => new Date().toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

	$effect(() => {
		label = format();
		const timeout = setTimeout(() => (label = format()), 86_400_000 - (Date.now() % 86_400_000));
		return () => clearTimeout(timeout);
	});
</script>

{#if label}
	<p class="m-0 text-xs text-gray-400">{label}</p>
{/if}
