<!--
  common/TopNav.svelte - the thin grey bar above the main nav: edition switcher,
  the Asian wall clocks, today's date.

  The hidden A/B trigger that used to sit at the right is gone with the A/B tool.
  The Clients / Journalists / Publishers links stay out: none of those routes exist.
-->
<script lang="ts">
	import LanguageSelector from './LanguageSelector.svelte';
	import DateTimeDisplay from './DateTimeDisplay.svelte';
	import DateDisplay from './DateDisplay.svelte';
</script>

<section class="top-nav relative z-[888]">
	<div class="flex min-h-7 flex-row items-center justify-between pt-0.5">
		<div class="nav-left flex">
			<LanguageSelector />
		</div>

		<div class="absolute left-1/2 hidden -translate-x-1/2 whitespace-nowrap md:block">
			<DateTimeDisplay />
		</div>

		<div class="nav-right ml-auto flex items-center">
			<DateDisplay />
		</div>
	</div>
</section>
