<!--
  shared/RailRow.svelte - a label/value row in a rail.

  Renders nothing when there is no value, which is how rail cards drop missing
  fields instead of printing blank labels. Pass either `value` (text) or a
  `children` snippet (markup); a row with neither is omitted.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		label: string;
		value?: string | null;
		/** Stacks the value under the label - for addresses and other long values. */
		block?: boolean;
		/** Hairline rule under the row. Used inside boxed sections. */
		divided?: boolean;
		children?: Snippet;
	}

	let { label, value, block = false, divided = false, children }: Props = $props();

	const divider = $derived(divided ? 'border-b border-gray-200 last:border-b-0' : '');
	const present = $derived(Boolean(children) || (value !== null && value !== undefined && value !== ''));
</script>

{#snippet content()}
	{#if children}{@render children()}{:else}{value}{/if}
{/snippet}

{#if present}
	{#if block}
		<div class="py-1.5 {divider}">
			<dt class="mb-1 text-xs text-gray-500">{label}</dt>
			<dd class="text-xs leading-relaxed text-gray-800">{@render content()}</dd>
		</div>
	{:else}
		<div class="flex items-start justify-between gap-3 py-1.5 {divider}">
			<dt class="shrink-0 text-xs text-gray-500">{label}</dt>
			<dd class="min-w-0 text-right text-xs break-words text-gray-800">{@render content()}</dd>
		</div>
	{/if}
{/if}
