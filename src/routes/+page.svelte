<script lang="ts">
	import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '#lib/site.ts';
	import HomeHero from '#lib/components/features/home/HomeHero.svelte';
	import EventsRow from '#lib/components/features/home/EventsRow.svelte';
	import FeaturedReleases from '#lib/components/features/home/FeaturedReleases.svelte';
	import CategoryRow from '#lib/components/features/home/CategoryRow.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>{SITE_NAME}</title>
	<meta name="description" content={SITE_DESCRIPTION} />
	<link rel="canonical" href="{SITE_URL}/" />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={SITE_NAME} />
	<meta property="og:description" content={SITE_DESCRIPTION} />
	<meta property="og:url" content="{SITE_URL}/" />
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<main>
	<h1 class="sr-only">ACN Newswire Newsroom</h1>

	<HomeHero slides={data.hero} />

	<EventsRow events={data.events} />

	{#if data.featured}
		<FeaturedReleases
			featuredArticle={data.featured.lead}
			featuredImageUrl="/images/sector/environment/1.avif"
			articles={data.featured.rest}
		/>
	{/if}

	{#each data.categories as category (category.slug)}
		<CategoryRow title={category.title} exploreLabel={category.exploreLabel} items={category.items} />
	{/each}
</main>
