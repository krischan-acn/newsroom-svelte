<!--
  The error page, for both "not found" and "the newswire did not answer".

  Same voice and page shell as the Next app's not-found.tsx and error.tsx. A
  404 offers the newsroom and search; anything else offers a retry, which is
  genuine - failed API responses are never cached, so trying again re-asks.
-->
<script lang="ts">
	import { page } from '$app/state';

	const notFound = $derived(page.status === 404);
</script>

<svelte:head>
	<title>{notFound ? 'Page not found' : 'This page didn’t load'} | ACN Newswire</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="container mx-auto min-h-125 max-w-7xl px-4 py-6">
	<div class="max-w-xl py-16">
		{#if notFound}
			<h1 class="mb-4 text-3xl tracking-tight text-black">We couldn’t find that page</h1>
			<p class="mb-8 text-[15px] leading-relaxed text-gray-600">
				The link may be out of date, or the release may have moved. The newsroom and the search page are both good
				places to pick the thread back up.
			</p>
			<div class="flex flex-wrap items-center gap-3">
				<a href="/" class="button inline-flex items-center">Back to the newsroom</a>
				<a href="/search" class="button alt inline-flex items-center">Search releases</a>
			</div>
		{:else}
			<h1 class="mb-4 text-3xl tracking-tight text-black">This page didn’t load</h1>
			<p class="mb-8 text-[15px] leading-relaxed text-gray-600">
				Something went wrong while fetching this page. It is usually temporary — trying again is worth a shot.
			</p>
			<div class="flex flex-wrap items-center gap-3">
				<button type="button" onclick={() => location.reload()} class="button">Try again</button>
				<a href="/" class="button alt inline-flex items-center">Back to the newsroom</a>
			</div>
		{/if}
	</div>
</div>
