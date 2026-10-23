<!--
  shared/SocialLinks.svelte - social profile links for the company and article rails.

  The glyphs are flat grey artwork served from /social, so hover is expressed
  with opacity rather than colour. A destination with no glyph (a blog, an RSS
  feed, a Japanese-language site) falls back to its text label. Every URL comes
  from the API, so it goes through safeUrl; one that fails is dropped.
-->
<script lang="ts" module>
	export interface SocialLink {
		label: string;
		url: string;
	}
</script>

<script lang="ts">
	import { safeUrl } from '#lib/site.ts';
	import { RAIL_LINK } from './rail';

	interface Props {
		links: SocialLink[];
		/** Show the platform name beside the glyph. */
		withLabels?: boolean;
		class?: string;
	}

	let { links, withLabels = false, class: className = '' }: Props = $props();

	/** Keyed on the lowercased label the services use; value is the file in /social. */
	const ICONS: Record<string, string> = {
		facebook: 'facebook',
		instagram: 'instagram',
		linkedin: 'linkedin',
		pinterest: 'pinterest',
		reddit: 'reddit',
		telegram: 'telegram',
		tumblr: 'tumblr',
		x: 'x',
		twitter: 'x',
		youtube: 'youtube'
	};

	const items = $derived(
		links.flatMap(({ label, url }) => {
			const href = safeUrl(url);
			if (!href) return [];
			const icon = ICONS[label.trim().toLowerCase()];
			return [{ label, href, icon: icon ? `/social/${icon}.svg` : null }];
		})
	);
</script>

{#if items.length > 0}
	<div class="flex flex-wrap items-center gap-x-3 gap-y-2 {className}">
		{#each items as item (item.label)}
			{#if item.icon}
				<a
					href={item.href}
					target="_blank"
					rel="noopener noreferrer"
					title={item.label}
					aria-label={item.label}
					class="inline-flex items-center gap-1.5 text-xs text-gray-500 opacity-70 transition-opacity hover:text-gray-800 hover:opacity-100"
				>
					<img src={item.icon} alt="" aria-hidden="true" class="h-4 w-4 shrink-0" />
					{#if withLabels}<span>{item.label}</span>{/if}
				</a>
			{:else}
				<a href={item.href} target="_blank" rel="noopener noreferrer" class="text-xs {RAIL_LINK}">{item.label}</a>
			{/if}
		{/each}
	</div>
{/if}
