<!--
  /company/<id> - ported from the Next app's app/company/[id]/page.tsx. Markup and classes are verbatim.

  The head replaces generateCompanyMetadata (lib/metadata.ts in Next). The
  JSON-LD sits in the head rather than at the top of the body, as on the
  article route; crawlers read it from either.
-->
<script lang="ts">
	import { SITE_NAME, SITE_URL, jsonLdScript } from '#lib/site.ts';
	import PressReleaseItem from '#lib/components/shared/PressReleaseItem.svelte';
	import CompanySidebar from '#lib/components/features/company/CompanySidebar.svelte';
	import CompanyPagination from '#lib/components/features/company/CompanyPagination.svelte';
	import FeedUnavailable from '#lib/components/features/company/FeedUnavailable.svelte';

	let { data } = $props();

	const profile = $derived(data.profile);
	const feed = $derived(data.feed);

	// generateCompanyMetadata, field for field. Its `Company ${id}` fallback is
	// unreachable here because a missing profile never renders this page.
	const title = $derived(`${profile.name} Press Releases`);
	const description = $derived(
		profile.description[0]?.slice(0, 160) || `Browse the latest press releases from ${profile.name} on ACN Newswire.`
	);
	const canonical = $derived(`${SITE_URL}/company/${data.id}`);
	// logoSrc is already an absolute URL on CompanyProfile.
	const logoUrl = $derived(profile.logoSrc ?? null);

	const jsonLd = $derived(
		jsonLdScript({
			'@context': 'https://schema.org',
			'@type': 'Organization',
			name: profile.name,
			url: `${SITE_URL}/company/${profile.id}`,
			...(profile.logoSrc && {
				logo: { '@type': 'ImageObject', url: profile.logoSrc }
			}),
			...(profile.description.length > 0 && { description: profile.description[0] }),
			...(profile.website && { sameAs: [profile.website, ...profile.socials.map((s) => s.url)] }),
			...(profile.established && { foundingDate: profile.established }),
			...(profile.headquarters.length > 0 && {
				address: {
					'@type': 'PostalAddress',
					streetAddress: profile.headquarters.join(', '),
					...(profile.country && { addressCountry: profile.country })
				}
			}),
			...(profile.telephone && { telephone: profile.telephone }),
			publishingPrinciples: SITE_URL
		})
	);
</script>

<svelte:head>
	<title>{title} | {SITE_NAME}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:type" content="website" />
	{#if logoUrl}
		<meta property="og:image" content={logoUrl} />
		<meta property="og:image:alt" content="{profile.name} logo" />
	{/if}
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	{#if logoUrl}
		<meta name="twitter:image" content={logoUrl} />
	{/if}
	<!-- Escaped by jsonLdScript: API values cannot close this tag. -->
	{@html jsonLd}
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-7xl min-h-125 lg:px-8">
	<!--
	  The API was unreachable, so this page was assembled from the local
	  company index and curated file. Everything on it is real — it is just
	  not everything. Said once at the top rather than repeated per card,
	  because the cards already self-omit and a reader does not need to be
	  told six times that something is missing.
	-->
	{#if profile.isPartial}
		<div role="status" class="border border-amber-200 bg-amber-50 px-4 py-3 mb-6 text-[15px] text-amber-900">
			Some details for this company are temporarily unavailable. What is shown below is accurate; the rest will return
			shortly.
		</div>
	{/if}

	<div class="flex flex-col-reverse lg:flex-row lg:items-start gap-8 lg:gap-12">
		<!-- Main column: who they are, then everything they have published. -->
		<div class="flex-1 min-w-0">
			{#if profile.description.length > 0}
				<section class="mb-10">
					<h2 class="text-2xl tracking-tight text-black mb-4">Company Description</h2>
					<div class="space-y-4">
						{#each profile.description as paragraph, i (i)}
							<p class="text-[15px] text-gray-700 leading-relaxed">
								{paragraph}
							</p>
						{/each}
					</div>
				</section>
			{/if}

			<section>
				<h2 class="text-2xl tracking-tight text-black mb-4">
					{profile.description.length > 0 ? 'Press Releases' : `Press Releases from ${profile.name}`}
				</h2>

				{#if feed.unavailable}
					<FeedUnavailable companyName={profile.name} />
				{:else if feed.articles.length === 0}
					<p class="text-gray-500 py-8">No press releases found for this company.</p>
				{:else}
					<div class="divide-y divide-gray-200">
						{#each feed.articles as article (article.id)}
							<PressReleaseItem
								{article}
								companyName={profile.name}
								logoSrc={null}
								hideLogo
								sectors={null}
								showMeta={false}
							/>
						{/each}
					</div>

					<CompanyPagination
						basePath="/company/{profile.id}"
						page={feed.page}
						hasNext={feed.hasNext}
						hasPrevious={feed.hasPrevious}
					/>
				{/if}
			</section>
		</div>

		<CompanySidebar {profile} />
	</div>
</div>
