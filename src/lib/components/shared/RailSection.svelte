<!-- shared/RailSection.svelte - one titled block in a rail; `boxed` wraps it in the company rail's card. -->
<script lang="ts">
	import type { Snippet } from 'svelte';

	let { title, boxed = false, children }: { title?: string; boxed?: boolean; children: Snippet } = $props();
</script>

<section class={boxed ? 'mb-6' : 'mt-4 border-t border-gray-200 pt-4 first:mt-0 first:border-t-0 first:pt-0'}>
	{#if title}
		<h2 class="mb-2 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">{title}</h2>
	{/if}
	{#if boxed}
		<div class="rounded-md border border-gray-200 bg-gray-50/60 px-3.5 py-2.5">{@render children()}</div>
	{:else}
		{@render children()}
	{/if}
</section>
