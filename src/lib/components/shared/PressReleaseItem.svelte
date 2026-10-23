<!--
  shared/PressReleaseItem.svelte - one row of a press release feed.

  The React version was a client component so that it could backfill a missing
  logo: each logoless row fetched /api/press-release/{id} - a full release,
  which also waited on the dead legacy host - to read one filename off it. That
  is gone. A row shows the logo its feed supplied, or none, and costs nothing
  after the page arrives.
-->
<script lang="ts" module>
	export interface PressReleaseRow {
		id: number;
		headline: string;
		dateTime: string;
		thumbImage: string | null;
		description: string | null;
		language?: string | null;
	}
</script>

<script lang="ts">
	import { formatDateTime } from '#lib/format.ts';
	import LanguageTag from './LanguageTag.svelte';

	interface Props {
		article: PressReleaseRow;
		companyName: string;
		logoSrc: string | null;
		sectors?: string[] | null;
		showMeta?: boolean;
		hideLogo?: boolean;
	}

	let { article, companyName, logoSrc, sectors, showMeta = false, hideLogo = false }: Props = $props();
</script>

<a href="/article/{article.id}" class="group flex items-stretch gap-0 py-3">
	{#if !hideLogo && logoSrc}
		<div class="flex w-28 shrink-0 items-center justify-center p-3">
			<img src={logoSrc} alt={companyName} loading="lazy" class="h-auto max-h-16 w-auto max-w-full object-contain" />
		</div>
		<!-- Divider - only meaningful when it separates a logo from the text. -->
		<div class="mx-1 w-px shrink-0 self-stretch bg-gray-200"></div>
	{/if}

	<div class="flex min-w-0 flex-1 flex-col justify-center gap-2 px-4 py-2">
		<h3 class="text-md line-clamp-1 leading-snug font-medium text-gray-800 transition-colors group-hover:text-[#2088c9]">
			{article.headline}
		</h3>
		<div class="mt-0.5 flex flex-row flex-wrap items-center gap-2">
			{#if showMeta && companyName}
				<p class="text-xs font-medium text-gray-600">{companyName}</p>
				<p class="text-xs text-gray-400">•</p>
			{/if}
			<p class="text-xs text-gray-400">{formatDateTime(article.dateTime, article.language)}</p>
			{#if article.language}
				<span class="text-xs text-gray-400">•</span>
				<LanguageTag value={article.language} />
			{/if}
		</div>

		{#if showMeta && sectors && sectors.length > 0}
			<span class="-mt-[8px] mb-0.5 text-xs font-medium text-gray-600">{sectors[0]}</span>
		{/if}

		{#if article.description}
			<p class="line-clamp-2 text-xs text-gray-500">{article.description}</p>
		{/if}
	</div>

	{#if article.thumbImage}
		<div class="ml-4 shrink-0 self-center">
			<img src={article.thumbImage} alt={article.headline} loading="lazy" class="h-20 w-20 object-cover" />
		</div>
	{/if}
</a>
