<!--
  features/article/PressRelease.svelte - one whole release: hero, share bar,
  body, issuer block, sign-off, more from the issuer, and the rail.

  Rendered once by the article page and again for every release the infinite
  scroll appends, from the same server-shaped data in both cases.

  The page shell (no `container`, sm:px-6) differs from every other page's.
  That is a known, deliberately unfixed divergence (BIBLE section 5); it is
  carried over as-is rather than silently changed.
-->
<script lang="ts">
	import type { PressReleaseData } from '#lib/types.ts';
	import type { CompanyArticle } from '#lib/server/company-articles.ts';
	import type { ReleaseVersion } from '#lib/server/release-versions.ts';
	import Hero from './Hero.svelte';
	import ShareBar from './ShareBar.svelte';
	import Body from './Body.svelte';
	import Company from './Company.svelte';
	import ArticleFooterLink from './ArticleFooterLink.svelte';
	import MoreFromCompany from './MoreFromCompany.svelte';
	import ArticleSidebar from './ArticleSidebar.svelte';

	interface Props {
		data: PressReleaseData;
		/** Absolute canonical URL - what the share buttons hand out. */
		canonicalUrl: string;
		relatedArticles?: CompanyArticle[];
		versions?: ReleaseVersion[];
	}

	let { data, canonicalUrl, relatedArticles = [], versions = [] }: Props = $props();

	const company = $derived(data.companies?.[0]);
</script>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<div class="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
		<article class="min-w-0 flex-1">
			<Hero
				headline={data.headline}
				subHeadline={data.subHeadline}
				source={data.source}
				dateTime={data.dateTime}
				language={data.language}
			/>

			<ShareBar headline={data.headline} url={canonicalUrl} />

			<Body content={data.bodyHtml} />

			{#if company}
				<Company {company} />
			{/if}

			<ArticleFooterLink views={data.views} />

			{#if company}
				<MoreFromCompany
					articles={relatedArticles}
					companyName={company.company_Name}
					companyId={company.comp_ID}
					logoSrc={company.logofilename || null}
					currentId={data.id}
				/>
			{/if}
		</article>

		<!-- Below the release on mobile: the text is what the reader came for. -->
		<ArticleSidebar {data} {versions} />
	</div>
</div>
