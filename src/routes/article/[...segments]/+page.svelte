<script lang="ts">
	import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL, jsonLdScript } from '#lib/site.ts';
	import PressRelease from '#lib/components/features/article/PressRelease.svelte';
	import InfiniteArticleFeed from '#lib/components/features/article/InfiniteArticleFeed.svelte';

	let { data } = $props();

	const release = $derived(data.data);
	const description = $derived((release.bodyText ?? '').slice(0, 160) || release.headline);
	// The Next app pointed og:image at a card it generated per release
	// (/api/og/article/{id}). That route is not ported - rendering images on a
	// Worker needs a WASM renderer and more CPU than the free plan allows (see
	// docs/parity.md). Instead: the release's photo, else the issuer's logo, else
	// one fixed ACN card, so a shared link always carries an image.
	const ownImage = $derived(release.photo?.[0] ?? release.companies?.[0]?.logofilename ?? null);
	const image = $derived(ownImage ?? DEFAULT_OG_IMAGE.url);
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
			image,
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
	{#if release.source}
		<meta property="article:author" content={release.source} />
	{/if}
	{#each release.sector ?? [] as tag, i (i)}
		<meta property="article:tag" content={tag} />
	{/each}
	<meta property="og:image" content={image} />
	{#if !ownImage}
		<meta property="og:image:width" content={String(DEFAULT_OG_IMAGE.width)} />
		<meta property="og:image:height" content={String(DEFAULT_OG_IMAGE.height)} />
	{/if}
	<meta property="og:image:alt" content={release.headline} />
	<meta name="twitter:image" content={image} />
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
