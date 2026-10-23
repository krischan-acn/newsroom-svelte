<!--
  features/article/Hero.svelte - the release's headline block: headline,
  sub-headline, then "SOURCE • DATE • LANGUAGE".

  Was a client component in React for an unused logo fallback; here it is plain
  markup.
-->
<script lang="ts">
	import LanguageTag from '../../shared/LanguageTag.svelte';

	interface Props {
		headline: string;
		subHeadline?: string | null;
		source?: string;
		dateTime?: string | null;
		language?: string | null;
	}

	let { headline, subHeadline, source, dateTime, language }: Props = $props();

	/**
	 * "June 5, 2026". Read from the string's own date part: the wire sends
	 * offsetless timestamps, and parsing them as a Date would move the day
	 * depending on the clock of whoever rendered the page.
	 */
	function formatDate(raw: string): string | null {
		const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
		const date = m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : new Date(raw);
		if (isNaN(date.getTime())) return null;
		return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
	}

	const date = $derived(dateTime ? formatDate(dateTime) : null);
</script>

<header class="mb-8">
	<h1 class="mb-8 text-3xl leading-tight tracking-tight text-black md:text-4xl lg:text-5xl">{headline}</h1>

	{#if subHeadline}
		<p class="mt-4 mb-8 text-lg leading-relaxed text-gray-400 md:text-xl">{subHeadline}</p>
	{/if}

	{#if source || date || language}
		<div class="mt-6 flex flex-wrap items-center gap-y-2 text-xs text-gray-400 uppercase md:text-sm">
			{#if source}<span>Source: {source}</span>{/if}
			{#if date}
				{#if source}<span class="mx-2 text-gray-400">•</span>{/if}
				<span class="font-semibold text-gray-500">{date}</span>
			{/if}
			{#if language}
				{#if source || date}<span class="mx-2 text-gray-400">•</span>{/if}
				<LanguageTag value={language} />
			{/if}
		</div>
	{/if}

	<hr class="mt-6 border-gray-200" />
</header>
