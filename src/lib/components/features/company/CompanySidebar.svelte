<!--
  features/company/CompanySidebar.svelte - ported from the Next app. Markup and classes are verbatim.

  The wiki-style rail: identity, contact and stock, in that order. Each card
  omits itself entirely when it has nothing to show.

  Built on the shared Rail shell and its primitives so this and the article
  rail stay dimensionally identical. The only difference here is `boxed`, since
  on this page the rail carries the page rather than sitting beside it.

  Every href built from API data goes through safeUrl. The Next version's
  RailExternalLink has no Svelte twin in shared/, so its one call site is
  inlined below with the same class string.
-->
<script lang="ts" module>
	/** Strips the scheme and any trailing slash, for display. Unchanged from Next (services/company-profile.ts). */
	export function toDisplayUrl(url: string | null): string | null {
		if (!url) return null;
		return url.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '') || null;
	}
</script>

<script lang="ts">
	import type { CompanyProfile } from '#lib/server/company-profile.ts';
	import { safeUrl } from '#lib/site.ts';
	import Rail from '../../shared/Rail.svelte';
	import RailSection from '../../shared/RailSection.svelte';
	import RailRow from '../../shared/RailRow.svelte';
	import SocialLinks from '../../shared/SocialLinks.svelte';
	import { RAIL_LINK } from '../../shared/rail';

	let { profile }: { profile: CompanyProfile } = $props();

	const hasFacts = $derived(
		profile.country || profile.established || profile.listed || profile.industry || profile.employees
	);

	const websiteHref = $derived(safeUrl(profile.website));

	const hasContact = $derived(
		profile.headquarters.length > 0 ||
			profile.telephone ||
			profile.facsimile ||
			websiteHref ||
			profile.contacts.length > 0 ||
			profile.socials.length > 0
	);

	const hasStock = $derived(
		profile.tickers.length > 0 || profile.otc || profile.exchangeName || profile.quoteCodes.length > 0
	);
</script>

<!--
  The {#each} blocks below are unkeyed on purpose. Next keyed them on values that
  can repeat (every Bloomberg code shares the label "Bloomberg"; two contacts or
  address lines can be identical). React only warns on a duplicate key; Svelte
  throws. The lists are static server-rendered rows, so no key is needed.
-->

{#snippet identityCard()}
	<RailSection boxed>
		<!-- The company name is the page's subject, so it carries the h1 even
		     though it sits in the rail. "Company Description" is a section under it. -->
		<h1 class="text-xl font-semibold text-black text-center pt-1 pb-3">
			{profile.name}
		</h1>

		{#if profile.logoSrc}
			<div class="flex items-center justify-center pb-4">
				<img src={profile.logoSrc} alt="{profile.name} logo" class="max-h-20 w-auto max-w-[70%] object-contain" />
			</div>
		{/if}

		{#if hasFacts}
			<dl class="border-t border-gray-200 pt-1">
				<RailRow divided label="Country" value={profile.country} />
				<RailRow divided label="Established" value={profile.established} />
				<RailRow divided label="Listed" value={profile.listed} />
				<RailRow divided label="Industry" value={profile.industry} />
				<RailRow divided label="Employees" value={profile.employees} />
				<!-- Website lives in Contact Details, not here — one row, one place. -->
			</dl>
		{/if}
	</RailSection>
{/snippet}

<!--
  One row per named contact on the company record. The label is the person (or
  "Contact" where the API gives a phone and email but no name), and the value
  stacks whatever of phone and email exists — the API populates these
  inconsistently, so no combination is assumed.
-->
{#snippet contactRows()}
	{#each profile.contacts as contact}
		<RailRow divided block label={contact.name ?? 'Contact'}>
			{#if contact.phone}<div>{contact.phone}</div>{/if}
			{#if contact.email}
				<div>
					<a href={safeUrl(`mailto:${contact.email}`)} class="text-blue-700 hover:underline break-all">
						{contact.email}
					</a>
				</div>
			{/if}
		</RailRow>
	{/each}
{/snippet}

{#snippet contactCard()}
	{#if hasContact}
		<RailSection boxed title="Contact Details">
			<dl>
				{#if profile.headquarters.length > 0}
					<RailRow divided block label="Address">
						{#each profile.headquarters as line}
							<div>{line}</div>
						{/each}
					</RailRow>
				{/if}
				<RailRow divided label="Phone" value={profile.telephone} />
				<RailRow divided label="Fax" value={profile.facsimile} />
				{@render contactRows()}
				{#if websiteHref}
					<RailRow divided label="Website">
						<a href={websiteHref} target="_blank" rel="noopener noreferrer" class="text-xs {RAIL_LINK}">
							{toDisplayUrl(profile.website)}
						</a>
					</RailRow>
				{/if}
				{#if profile.socials.length > 0}
					<RailRow divided block label="Follow">
						<SocialLinks links={profile.socials} />
					</RailRow>
				{/if}
			</dl>
		</RailSection>
	{/if}
{/snippet}

{#snippet stockCard()}
	<!-- Unlisted entities — statutory bodies, private companies — never get this
	     card, even when the API hands back an exchange record for them. -->
	{#if profile.isListed && hasStock}
		<RailSection boxed title="Stock Details">
			<dl>
				{#each profile.tickers as ticker}
					<RailRow divided label={ticker.exchange}>
						<span class="font-semibold text-gray-900">{ticker.symbol}</span>
						<!-- Only API-sourced listings carry an ISIN; curated ones omit it. -->
						{#if ticker.isin}
							<span class="ml-2 text-gray-500">ISIN {ticker.isin}</span>
						{/if}
					</RailRow>
				{/each}
				<RailRow divided label="OTC" value={profile.otc} />
				<RailRow divided label="Exchange" value={profile.exchangeName} />
				{#each profile.quoteCodes as code}
					<RailRow divided label="{code.label} code" value={code.value} />
				{/each}
			</dl>
		</RailSection>
	{/if}
{/snippet}

<Rail sticky>
	{@render identityCard()}
	{@render contactCard()}
	{@render stockCard()}
</Rail>
