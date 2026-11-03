<!--
  features/search/NestedCheckbox.svelte - ported from the Next app's
  components/features/search/NestedCheckbox.tsx. Markup and classes are verbatim.

  One node of a facet tree (sector → industry, continent → sub-region →
  country), rendering its own children recursively.
-->
<script lang="ts">
	import { getAllDescendantIds, type NestedItem } from '#lib/filter-data.ts';
	import NestedCheckbox from './NestedCheckbox.svelte';

	interface Props {
		item: NestedItem;
		selectedIds: string[];
		onToggle: (id: string, checked: boolean) => void;
		level?: number;
		/** True when an ancestor's own ID is already in selectedIds — makes this node appear checked */
		parentSelected?: boolean;
	}

	let { item, selectedIds, onToggle, level = 0, parentSelected = false }: Props = $props();

	const hasChildren = $derived(!!item.children?.length);

	const allDescendantIds = $derived(hasChildren ? getAllDescendantIds(item) : []);

	// Checked when:
	//  - an ancestor is directly selected (parentSelected), OR
	//  - this node's own ID is in selectedIds, OR
	//  - every direct child is individually selected
	const allChildrenSelected = $derived(hasChildren && item.children!.every((c) => selectedIds.includes(c.id)));
	const isChecked = $derived(parentSelected || selectedIds.includes(item.id) || allChildrenSelected);

	// Indeterminate: some (not all) descendants are involved, and this node isn't fully checked
	const someDescendantsSelected = $derived(allDescendantIds.some((id) => selectedIds.includes(id)));
	const isIndeterminate = $derived(!isChecked && someDescendantsSelected);

	// Auto-open when a direct child becomes selected; start closed otherwise
	const hasSelectedDirectChild = $derived(hasChildren && item.children!.some((c) => selectedIds.includes(c.id)));
	// svelte-ignore state_referenced_locally
	let isOpen = $state(hasSelectedDirectChild);
	$effect(() => {
		if (hasSelectedDirectChild) isOpen = true;
	});

	// Sync indeterminate imperatively — React doesn't track this property
	// (Port: nor is it an attribute, so it cannot be server-rendered either; it
	// is set once the page hydrates, as in Next.)
	let checkbox: HTMLInputElement | undefined = $state();
	$effect(() => {
		if (checkbox) {
			checkbox.indeterminate = isIndeterminate;
		}
	});

	// React's checkbox is controlled: after a click it shows `checked`, not
	// what the browser toggled it to. Svelte's is not, so the click is put back
	// here and the box changes only when the new selection reaches isChecked.
	function onCheckboxChange(e: Event & { currentTarget: HTMLInputElement }) {
		e.currentTarget.checked = isChecked;
		onToggle(item.id, !isChecked);
	}

	// Whether children should inherit the "checked" visual state
	// True if this node's own ID is selected, or an ancestor already propagated it down
	const propagateSelected = $derived(parentSelected || selectedIds.includes(item.id));
</script>

<div style:margin-left="{level * 12}px">
	<div class="flex items-center gap-1.5 py-0.5">
		{#if hasChildren}
			<button
				onclick={() => (isOpen = !isOpen)}
				class="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600 shrink-0"
				aria-label={isOpen ? 'Collapse' : 'Expand'}
			>
				<svg
					class="w-2.5 h-2.5 transition-transform duration-100 {isOpen ? 'rotate-90' : ''}"
					fill="none"
					viewBox="0 0 8 12"
					stroke="currentColor"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2 2l4 4-4 4" />
				</svg>
			</button>
		{:else}
			<span class="w-4 shrink-0"></span>
		{/if}

		<input
			bind:this={checkbox}
			type="checkbox"
			checked={isChecked}
			onchange={onCheckboxChange}
			class="w-4 h-4 rounded border-gray-300 accent-[#2088c9] cursor-pointer shrink-0"
		/>

		<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions (a clickable span, as in Next: the checkbox beside it is the keyboard target, so the label text is a pointer convenience only) -->
		<span
			class="text-sm text-gray-700 cursor-pointer select-none hover:text-gray-900 leading-tight"
			onclick={() => onToggle(item.id, !isChecked)}
		>
			{item.name}
		</span>
	</div>

	{#if hasChildren && isOpen}
		<div>
			{#each item.children! as child (child.id)}
				<NestedCheckbox item={child} {selectedIds} {onToggle} level={level + 1} parentSelected={propagateSelected} />
			{/each}
		</div>
	{/if}
</div>
