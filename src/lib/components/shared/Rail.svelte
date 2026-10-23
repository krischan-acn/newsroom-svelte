<!--
  shared/Rail.svelte - the right-hand rail shell, shared by every page that has
  one. The two flags are the only differences that ever existed between them:

    <Rail sticky>          company - pins the rail, which there IS the page
    <Rail sticky bordered> article - pins it and rules it off from the release
    <Rail>                 events  - scrolls with the page, no rule
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { RAIL_WIDTH } from './rail';

	interface Props {
		/** Pins the rail alongside a scrolling main column. */
		sticky?: boolean;
		/** Vertical rule separating the rail from the column to its left. */
		bordered?: boolean;
		children: Snippet;
	}

	let { sticky = false, bordered = false, children }: Props = $props();

	const inner = $derived(
		[sticky && 'lg:sticky lg:top-6', bordered && 'lg:border-l lg:border-gray-200 lg:pl-6']
			.filter(Boolean)
			.join(' ')
	);
</script>

<aside class={RAIL_WIDTH}>
	{#if inner}
		<div class={inner}>{@render children()}</div>
	{:else}
		{@render children()}
	{/if}
</aside>
