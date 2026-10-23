<!--
  features/article/Company.svelte - "About <issuer>" under the release body:
  the logo, the boilerplate, and the issuer's website.

  A logo that fails to load falls back to the issuer's initials. The website
  comes from the API, so it goes through safeUrl; a value that is not an
  http(s) address shows as text instead of a link.
-->
<script lang="ts">
	import type { CompanyData } from '#lib/types.ts';
	import { safeUrl } from '#lib/site.ts';
	import { imagesFailed } from '#lib/actions/image.ts';

	let { company }: { company: CompanyData } = $props();

	let logoFailed = $state(false);
	const website = $derived(safeUrl(company.url));
</script>

<section class="mt-12">
	<div class="flex flex-col gap-6 md:flex-row md:gap-10">
		<div class="shrink-0" use:imagesFailed={() => (logoFailed = true)}>
			{#if company.logofilename && !logoFailed}
				<div class="relative h-28 w-28 md:h-24 md:w-24">
					<img
						src={company.logofilename}
						alt={company.company_Name}
						loading="lazy"
						class="absolute inset-0 h-full w-full object-contain"
					/>
				</div>
			{:else}
				<div class="flex h-28 w-28 items-center justify-center bg-gray-50 text-sm text-gray-500 md:h-36 md:w-36">
					{company.company_Name.substring(0, 3).toUpperCase()}
				</div>
			{/if}
		</div>

		<div class="flex-1 md:border-l md:border-gray-300 md:pl-10">
			<h3 class="mb-4 text-2xl tracking-tight text-black">About {company.company_Name}</h3>

			{#if company.description}
				<p class="mb-4 leading-relaxed text-gray-700">{company.description}</p>
			{/if}

			{#if company.url}
				<p class="text-gray-700">
					Find out more:
					{#if website}
						<a href={website} target="_blank" rel="noopener noreferrer" class="text-[#2088c9] hover:underline">{company.url}</a>
					{:else}
						{company.url}
					{/if}
				</p>
			{/if}
		</div>
	</div>
</section>
