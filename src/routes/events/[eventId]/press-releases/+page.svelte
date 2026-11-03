<!--
  /events/<eventId>/press-releases - ported as-is from the Next app's
  app/events/[eventId]/press-releases/page.tsx. Markup and classes are verbatim.
-->
<script lang="ts">
	import { SITE_DESCRIPTION } from '#lib/site.ts';
	import PressReleaseItem from '#lib/components/shared/PressReleaseItem.svelte';

	let { data } = $props();
</script>

<!--
  Next's generateMetadata set only the title. Everything else it inherited from
  the root layout - the site description, og:type and twitter:card - so those
  are spelled out here. The title differs from Next: there it carried
  "| ACN Newswire" twice, once written and once from the layout's
  "%s | ACN Newswire" template.
-->
<svelte:head>
	<title>Press Releases for {data.eventName} | ACN Newswire</title>
	<meta name="description" content={SITE_DESCRIPTION} />
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<div class="container mx-auto px-4 py-6 max-w-7xl">
	<h1 class="text-3xl tracking-tight text-black mb-8">
		Press Releases for {data.eventName}
	</h1>

	{#if !data.hasMappedIds}
		<p class="text-gray-500 py-8">No press releases linked to this event yet.</p>
	{:else if data.articles.length === 0}
		<p class="text-gray-500 py-8">No press releases found.</p>
	{:else}
		<div class="divide-y divide-gray-200">
			{#each data.articles as item (item.article.id)}
				<PressReleaseItem
					article={item.article}
					companyName={item.companyName}
					logoSrc={item.logoSrc}
					sectors={item.sectors}
					showMeta
				/>
			{/each}
		</div>
	{/if}
</div>
