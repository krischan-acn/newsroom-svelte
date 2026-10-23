<!-- features/article/MoreFromCompany.svelte - up to three more releases from the same issuer. -->
<script lang="ts">
	import type { CompanyArticle } from '#lib/server/company-articles.ts';
	import PressReleaseItem from '../../shared/PressReleaseItem.svelte';

	interface Props {
		articles: CompanyArticle[];
		companyName: string;
		companyId: string | number;
		logoSrc: string | null;
		currentId: number;
	}

	let { articles, companyName, companyId, logoSrc, currentId }: Props = $props();

	const visible = $derived(articles.filter((a) => a.id !== currentId).slice(0, 3));
</script>

{#if visible.length > 0}
	<section class="mt-8 pt-6">
		<div class="mb-8 flex flex-row items-center justify-between">
			<h2 class="text-2xl tracking-tight text-black">More from {companyName}</h2>
			<a href="/company/{companyId}" class="button alt inline-flex items-center px-6 py-2.5">Read more</a>
		</div>
		<ul>
			{#each visible as article (article.id)}
				<li>
					<PressReleaseItem {article} {companyName} {logoSrc} />
				</li>
			{/each}
		</ul>
	</section>
{/if}
