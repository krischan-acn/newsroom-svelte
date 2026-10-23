<!--
  The site shell: top bar, main nav, page, footer.

  Inter is self-hosted as ONE variable font file, preloaded so the first paint
  does not wait to discover it in the CSS. The Next app loaded Inter twice - a
  render-blocking Google Fonts @import of all nine weights, plus next/font's
  self-hosted copy.

  The thin bar at the top shows while a client-side navigation is loading. It
  stands in for the old loading.tsx skeletons: a click always gets visible
  feedback, without a skeleton flashing on navigations that finish instantly.
-->
<script lang="ts">
	import '@fontsource-variable/inter/wght.css';
	import interLatin from '@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url';
	import '../app.css';
	import { navigating } from '$app/state';
	import { SITE_NAME } from '#lib/site.ts';
	import TopNav from '#lib/components/common/TopNav.svelte';
	import MainNav from '#lib/components/common/MainNav.svelte';
	import Footer from '#lib/components/common/Footer.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="preload" href={interLatin} as="font" type="font/woff2" crossorigin="anonymous" />
	<meta property="og:site_name" content={SITE_NAME} />
</svelte:head>

{#if navigating.to}
	<div class="nav-progress fixed inset-x-0 top-0 z-[1000] h-0.5 bg-[#2088c9]" role="progressbar" aria-label="Loading page"></div>
{/if}

<TopNav />
<MainNav />
{@render children()}
<Footer />

<style>
	.nav-progress {
		transform-origin: left;
		animation: nav-progress 8s cubic-bezier(0.1, 0.7, 0.2, 1) forwards;
	}

	@keyframes nav-progress {
		from {
			transform: scaleX(0.05);
		}
		to {
			transform: scaleX(0.9);
		}
	}
</style>
