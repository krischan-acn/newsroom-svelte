<!--
  common/DateTimeDisplay.svelte - the four Asian wall clocks in the top bar.

  Renders placeholder dots on the server: the server's clock is the time the
  page was CACHED, not the time it is read. The real times arrive on mount and
  tick on the minute boundary.
-->
<script lang="ts">
	const ZONES = [
		{ codes: ['IST'], timeZone: 'Asia/Kolkata' },
		{ codes: ['CST'], timeZone: 'Asia/Shanghai' },
		{ codes: ['SGT', 'HKT'], timeZone: 'Asia/Singapore' },
		{ codes: ['KST', 'JST'], timeZone: 'Asia/Tokyo' }
	];

	let now = $state<Date | null>(null);

	$effect(() => {
		now = new Date();
		let interval: ReturnType<typeof setInterval>;
		const timeout = setTimeout(() => {
			now = new Date();
			interval = setInterval(() => (now = new Date()), 60_000);
		}, 60_000 - (Date.now() % 60_000));
		return () => {
			clearTimeout(timeout);
			clearInterval(interval);
		};
	});

	function zoneInfo(timeZone: string, at: Date) {
		return {
			day: at.toLocaleString('en-US', { weekday: 'short', timeZone }),
			time: at.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone })
		};
	}
</script>

<p class="m-0 flex flex-row items-center gap-3 text-xs text-gray-400">
	{#each ZONES as zone, index (zone.timeZone)}
		{@const info = now ? zoneInfo(zone.timeZone, now) : { day: '···', time: '··:··' }}
		<span class="flex items-center gap-1">
			<span>{zone.codes.join('/')}</span>
			<span>{info.day}</span>
			<span>{info.time}</span>
		</span>
		{#if index < ZONES.length - 1}
			<span class="text-gray-300" aria-hidden="true">|</span>
		{/if}
	{/each}
</p>
