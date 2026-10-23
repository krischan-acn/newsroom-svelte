<script lang="ts">
	import { SITE_NAME, SITE_URL, jsonLdScript } from '#lib/site.ts';
	import PressRelease from '#lib/components/features/article/PressRelease.svelte';
	import InfiniteArticleFeed from '#lib/components/features/article/InfiniteArticleFeed.svelte';

	let { data } = $props();

	const release = $derived(data.data);
	const description = $derived((release.bodyText ?? '').slice(0, 160) || release.headline);
	const image = $derived(release.photo?.[0] ?? null);
	const title = $derived(`${release.headline} | ${SITE_NAME}`);

	const jsonLd = $derived(
		jsonLdScript({
			'@context': 'https://schema.org',
			'@type': 'NewsArticle',
			headline: release.headline,
			description: (release.bodyText ?? '').slice(0, 200) || release.headline,
			datePublished: release.dateTime,
			author: [{ '@type': 'Organization', name: release.source }],
			publisher: {
				'@type': 'Organization',
				name: SITE_NAME,
				logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.svg` }
			},
			...(image ? { image } : {}),
			mainEntityOfPage: { '@type': 'WebPage', '@id': data.canonicalUrl }
		})
	);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={data.canonicalUrl} />
	<meta property="og:type" content="article" />
	<meta property="og:title" content={release.headline} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={data.canonicalUrl} />
	<meta property="article:published_time" content={release.dateTime} />
	{#if image}
		<meta property="og:image" content={image} />
		<meta name="twitter:image" content={image} />
	{/if}
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={release.headline} />
	<meta name="twitter:description" content={description} />
	<!-- Escaped by jsonLdScript: API values cannot close this tag. -->
	{@html jsonLd}
</svelte:head>

<main>
	<div id="article-first-wrapper">
		<PressRelease
			data={release}
			canonicalUrl={data.canonicalUrl}
			relatedArticles={data.relatedArticles}
			versions={data.versions}
		/>
	</div>

	{#key release.id}
		<InfiniteArticleFeed
			first={{
				id: release.id,
				companyId: release.companies?.[0]?.comp_ID ?? null,
				urlPath: data.urlPath,
				title
			}}
		/>
	{/key}
</main>
