<!--
  features/home/FeaturedReleases.svelte - "Today's Featured Stories": one lead
  release with a large image, and up to four more in two columns beside it.
-->
<script lang="ts" module>
	export interface FeaturedItem {
		id: number;
		headline: string;
		dateTime: string;
		companyName?: string;
		sector?: string[];
		photo?: string[];
		language?: string | null;
	}
</script>

<script lang="ts">
	import { formatDateTime } from '#lib/format.ts';
	import Img from '../../shared/Img.svelte';

	interface Props {
		featuredArticle: FeaturedItem;
		featuredImageUrl: string;
		articles: FeaturedItem[];
	}

	let { featuredArticle, featuredImageUrl, articles }: Props = $props();

	const columns = $derived([articles.slice(0, 2), articles.slice(2, 4)]);
</script>

{#snippet meta(article: FeaturedItem)}
	{@const sector = article.sector?.[0]}
	{#if sector || article.companyName}
		<div class="mb-1 flex min-w-0 items-center gap-1.5">
			{#if sector}<span class="min-w-0 truncate text-xs font-semibold text-gray-500">{sector}</span>{/if}
			{#if sector && article.companyName}<span class="shrink-0 text-xs text-gray-400">•</span>{/if}
			{#if article.companyName}
				<span class="min-w-0 truncate text-xs font-semibold text-gray-500">{article.companyName}</span>
			{/if}
		</div>
	{/if}
{/snippet}

<section class="mx-auto max-w-[1920px] px-12 py-16">
	<div class="mb-8 flex items-center justify-between">
		<h2 class="text-3xl tracking-tight text-black">Today's Featured Stories</h2>
		<a href="/news" class="button alt inline-flex items-center px-6 py-2.5">Explore Latest</a>
	</div>

	<div style="display: grid; grid-template-columns: 0.6fr 0.2fr 0.2fr; gap: 24px">
		<a href="/article/{featuredArticle.id}" class="block min-w-0">
			<Img src={featuredImageUrl} alt={featuredArticle.headline} style="width: 100%; height: auto" />
			<h3 class="mt-3 mb-2 text-[30px] leading-snug text-black">{featuredArticle.headline}</h3>
			{@render meta(featuredArticle)}
			<p class="text-xs text-gray-400">{formatDateTime(featuredArticle.dateTime, featuredArticle.language)}</p>
		</a>

		{#each columns as column, c (c)}
			<div class="flex min-w-0 flex-col">
				{#each column as article, i (article.id)}
					{#if i > 0}<hr class="my-4 border-gray-200" />{/if}
					<a href="/article/{article.id}" class="block">
						{#if article.photo?.[0]}
							<Img src={article.photo[0]} alt={article.headline} style="width: 100%; height: auto" class="mb-3" />
						{/if}
						<h3 class="mb-2 text-base leading-snug text-black">{article.headline}</h3>
						{@render meta(article)}
						<p class="text-xs text-gray-400">{formatDateTime(article.dateTime, article.language)}</p>
					</a>
				{/each}
			</div>
		{/each}
	</div>
</section>
