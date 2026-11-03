<!-- /news - ported from the Next app's app/news/page.tsx. Markup and classes are verbatim. -->
<script lang="ts">
	import { SITE_URL } from '#lib/site.ts';
	import PressReleaseItem from '#lib/components/shared/PressReleaseItem.svelte';

	let { data } = $props();

	const TITLE = 'All Press Releases';
	const DESCRIPTION = 'The latest press releases and news from companies across Asia on ACN Newswire.';

	function buildHref(p: number): string {
		const qs = new URLSearchParams({ page: String(p) });
		if (data.limitParam) qs.set('limit', data.limitParam);
		return `/news?${qs}`;
	}

	const pagerClass = (disabled: boolean) =>
		`inline-flex items-center gap-2 px-4 py-2 text-sm rounded border ${
			disabled ? 'text-gray-300 border-gray-200 pointer-events-none' : 'text-gray-700 border-gray-300 hover:bg-gray-50'
		}`;
</script>

<svelte:head>
	<title>{TITLE} | ACN Newswire</title>
	<meta name="description" content={DESCRIPTION} />
	<link rel="canonical" href="{SITE_URL}/news" />
	<meta property="og:title" content={TITLE} />
	<meta property="og:description" content={DESCRIPTION} />
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={TITLE} />
	<meta name="twitter:description" content={DESCRIPTION} />
</svelte:head>

<div class="container mx-auto max-w-7xl px-4 py-6">
	<h1 class="mb-8 text-3xl tracking-tight text-black">All Press Releases</h1>

	{#if data.articles.length === 0}
		<p class="py-8 text-gray-500">No news found.</p>
	{:else}
		<div class="divide-y divide-gray-100">
			{#each data.articles as article (article.id)}
				<!-- language is deliberately not passed: the Next page did not pass it, so its rows had no language tag. -->
				<PressReleaseItem
					article={{
						id: article.id,
						headline: article.headline,
						dateTime: article.dateTime,
						thumbImage: article.thumbImage,
						description: article.description ?? null
					}}
					companyName={article.companyName}
					logoSrc={article.logoSrc}
					sectors={article.sector ? [article.sector] : null}
					showMeta
				/>
			{/each}
		</div>

		{#if data.page > 1 || data.hasNext}
			<div class="mt-8 flex items-center justify-between">
				<!-- The layout's progress bar is the feedback a pager click gets (Next used NavPending). -->
				<a
					href={data.page > 1 ? buildHref(data.page - 1) : '#'}
					aria-disabled={data.page <= 1}
					class={pagerClass(data.page <= 1)}>Previous</a
				>
				<span class="text-sm text-gray-600">Page {data.page}</span>
				<a href={data.hasNext ? buildHref(data.page + 1) : '#'} aria-disabled={!data.hasNext} class={pagerClass(!data.hasNext)}
					>Next</a
				>
			</div>
		{/if}
	{/if}
</div>
