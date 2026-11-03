<!--
  features/search/SearchSidebar.svelte - ported from the Next app's
  components/features/search/SearchSidebar.tsx. Markup and classes are verbatim.

  The facet rail for sector browse. Language and region are read back from the
  URL to keep their boxes ticked, but the page does not apply them (see
  routes/search/+page.server.ts).
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { navigating } from '$app/state';
	import NestedCheckbox from './NestedCheckbox.svelte';
	import {
		INDUSTRY_HIERARCHY,
		REGION_HIERARCHY,
		getAllDescendantIds,
		findItemInHierarchy,
		getAncestorIds,
		getLeafIds
	} from '#lib/filter-data.ts';
	import { LANGUAGES as LANGUAGE_REGISTRY } from '#lib/languages.ts';
	import LanguageTag from '#lib/components/shared/LanguageTag.svelte';

	// Derived from the language registry so the filter codes, the labels and the
	// tags rendered on results can never drift apart.
	const LANGUAGES = LANGUAGE_REGISTRY.map((l) => ({
		code: l.searchCode,
		label: l.label,
		id: l.id
	}));

	interface Props {
		activeSectors: string[];
		activeLanguages: string[];
		activeRegions: string[];
		currentQ: string;
		currentLimit: string;
	}

	let { activeSectors, activeLanguages, activeRegions, currentQ, currentLimit }: Props = $props();

	let mobileOpen = $state(false);

	// Every facet here navigates, and sector browse behind it is a LIVE call to
	// /api/Articles/by-industry per selected sector. Two things were wrong with
	// ticking a box before this:
	//
	//   1. Nothing on screen changed for the whole round trip. /search?sec=... is
	//      the same route segment, so search/loading.tsx never fires.
	//   2. The checkbox itself did not even tick. Its checked state is derived
	//      from the URL via props, and the URL does not change until the server
	//      has answered - so the one control the reader just clicked appeared to
	//      ignore them, which is what makes people click it again.
	//
	// useOptimistic fixes (2): the box ticks on click and reverts only if the
	// navigation resolves to something else. useTransition fixes (1): isPending
	// dims the panel so it is visibly working rather than visibly ignoring you.
	//
	// Port: useOptimistic becomes a writable $derived - it follows the props, a
	// click overwrites it, and the next props (the server's answer) replace the
	// overwrite. useTransition's isPending becomes a count of this panel's own
	// navigations still in flight, checked against SvelteKit's `navigating` so
	// it cannot stick on if a navigation ends without settling its promise.
	let inFlight = $state(0);
	const isPending = $derived(inFlight > 0 && navigating.to !== null);
	let optimisticSectors = $derived(activeSectors);
	let optimisticLanguages = $derived(activeLanguages);
	let optimisticRegions = $derived(activeRegions);

	function navigate(url: string) {
		inFlight++;
		// Plain goto: Next's router.push scrolled the page back to the top here (no
		// scroll: false). SvelteKit 3 folds keepFocus/noScroll into one `reset`
		// option, so the default also resets focus to <body>, which Next did not.
		goto(url).finally(() => {
			inFlight--;
			// Once nothing is pending, the props are the truth again - the server's
			// answer if the navigation landed, the old selection if it was abandoned.
			if (inFlight === 0) {
				optimisticSectors = activeSectors;
				optimisticLanguages = activeLanguages;
				optimisticRegions = activeRegions;
			}
		});
	}

	const buildUrl = (sectors: string[], languages: string[], regions: string[]) => {
		const params = new URLSearchParams();
		if (currentQ) params.set('q', currentQ);
		sectors.forEach((s) => params.append('sec', s));
		languages.forEach((l) => params.append('lang', l));
		regions.forEach((r) => params.append('reg', r));
		if (currentLimit && currentLimit !== '20') params.set('limit', currentLimit);
		return `/search?${params.toString()}`;
	};

	// Sector toggle: parent IDs are never stored in the URL.
	// ON  + parent → expand to all leaf children (exact sector names for precise filtering).
	// ON  + leaf   → strip ancestors, add leaf.
	// OFF + parent → remove all leaf descendants.
	// OFF + leaf   → remove leaf; if an ancestor was in URL expand it minus this leaf.
	function applySectorToggle(current: string[], id: string, checked: boolean): string[] {
		const item = findItemInHierarchy(INDUSTRY_HIERARCHY, id);
		const descendantIds = item ? getAllDescendantIds(item) : [];
		const ancestorIds = getAncestorIds(id, INDUSTRY_HIERARCHY);
		const idsToAdd = item?.children?.length ? getLeafIds(item) : [id];

		let next = [...current];
		if (checked) {
			next = next.filter((v) => !descendantIds.includes(v) && !ancestorIds.includes(v));
			idsToAdd.forEach((leafId) => {
				if (!next.includes(leafId)) next.push(leafId);
			});
		} else {
			const idsToRemove = new Set([id, ...descendantIds]);
			next = next.filter((v) => !idsToRemove.has(v));
			// Expand any ancestor that was in the URL (legacy ?sec=Communications support)
			const closestFirst = [...ancestorIds].reverse();
			for (const ancestorId of closestFirst) {
				if (next.includes(ancestorId)) {
					const ancestorItem = findItemInHierarchy(INDUSTRY_HIERARCHY, ancestorId);
					if (ancestorItem) {
						next = next.filter((v) => v !== ancestorId);
						getLeafIds(ancestorItem).forEach((leafId) => {
							if (!idsToRemove.has(leafId) && !next.includes(leafId)) next.push(leafId);
						});
					}
					break;
				}
			}
		}
		return next;
	}

	// Region toggle: parent IDs ARE stored (compact representation: ?reg=Asia vs many countries).
	// ON  → strip ancestors and descendants, add item.
	// OFF → strip item and descendants; expand closest ancestor in URL minus this branch.
	function applyRegionToggle(current: string[], id: string, checked: boolean): string[] {
		const item = findItemInHierarchy(REGION_HIERARCHY, id);
		const descendantIds = item ? getAllDescendantIds(item) : [];
		const ancestorIds = getAncestorIds(id, REGION_HIERARCHY);

		let next = [...current];
		if (checked) {
			next = next.filter((v) => !descendantIds.includes(v) && !ancestorIds.includes(v));
			if (!next.includes(id)) next.push(id);
		} else {
			const idsToRemove = new Set([id, ...descendantIds]);
			next = next.filter((v) => !idsToRemove.has(v));
			const closestFirst = [...ancestorIds].reverse();
			for (const ancestorId of closestFirst) {
				if (next.includes(ancestorId)) {
					const ancestorItem = findItemInHierarchy(REGION_HIERARCHY, ancestorId);
					if (ancestorItem) {
						next = next.filter((v) => v !== ancestorId);
						getLeafIds(ancestorItem).forEach((leafId) => {
							if (!idsToRemove.has(leafId) && !next.includes(leafId)) next.push(leafId);
						});
					}
					break;
				}
			}
		}
		return next;
	}

	// Differs from Next: the handlers below build on the optimistic selections,
	// where Next built on the props (activeSectors etc.). Those do not change
	// until the server answers, so a second tick queued during a pending
	// navigation - which the dimming note below says is allowed - computed its
	// URL from the stale selection and silently dropped the first tick.

	const handleSectorToggle = (id: string, checked: boolean) => {
		const next = applySectorToggle(optimisticSectors, id, checked);
		optimisticSectors = next;
		navigate(buildUrl(next, optimisticLanguages, optimisticRegions));
	};

	const handleLanguageChange = (code: string, checked: boolean) => {
		const next = checked ? [...optimisticLanguages, code] : optimisticLanguages.filter((l) => l !== code);
		optimisticLanguages = next;
		navigate(buildUrl(optimisticSectors, next, optimisticRegions));
	};

	const handleRegionToggle = (id: string, checked: boolean) => {
		const next = applyRegionToggle(optimisticRegions, id, checked);
		optimisticRegions = next;
		navigate(buildUrl(optimisticSectors, optimisticLanguages, next));
	};

	// React's checkbox is controlled: after a click it shows `checked`, not what
	// the browser toggled it to. Svelte's is not, so the click is put back here
	// and the box changes only when the new selection reaches `checked`.
	function onLanguageInput(e: Event & { currentTarget: HTMLInputElement }, code: string) {
		const checked = e.currentTarget.checked;
		e.currentTarget.checked = !checked;
		handleLanguageChange(code, checked);
	}
</script>

{#snippet filterContent()}
	<!--
	  Dimmed, not disabled, while a facet navigation is in flight: the reader
	  can still queue another tick (React coalesces the transitions), they just
	  get told the results behind them are stale.
	  (Port: SvelteKit cancels the earlier navigation in favour of the newer one.)
	-->
	<div aria-busy={isPending} class="space-y-6 mt-3 transition-opacity {isPending ? 'opacity-60' : 'opacity-100'}">
		<!-- Sectors -->
		<div>
			<h3 class="text-sm font-medium text-black">Sector / Industry</h3>
			<div class="mt-2 space-y-0.5">
				{#each INDUSTRY_HIERARCHY as item (item.id)}
					<NestedCheckbox {item} selectedIds={optimisticSectors} onToggle={handleSectorToggle} level={0} />
				{/each}
			</div>
		</div>

		<!-- Language -->
		<div>
			<h3 class="text-sm font-medium text-black">Language</h3>
			<ul class="space-y-2.5 mt-2">
				{#each LANGUAGES as { code, label, id } (code)}
					<li class="flex items-center justify-between gap-2">
						<label class="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer hover:text-gray-900 select-none">
							<input
								type="checkbox"
								checked={optimisticLanguages.includes(code)}
								onchange={(e) => onLanguageInput(e, code)}
								class="w-4 h-4 border-gray-300 accent-[#2088c9] cursor-pointer"
							/>
							{label}
						</label>
						<LanguageTag value={id} />
					</li>
				{/each}
			</ul>
		</div>

		<!-- Region -->
		<div>
			<h3 class="text-sm font-medium text-black">Region</h3>
			<div class="mt-2 space-y-0.5">
				{#each REGION_HIERARCHY as item (item.id)}
					<NestedCheckbox {item} selectedIds={optimisticRegions} onToggle={handleRegionToggle} level={0} />
				{/each}
			</div>
		</div>
	</div>
{/snippet}

<!-- Mobile: button + accordion, closed by default -->
<div class="md:hidden">
	<button
		onclick={() => (mobileOpen = !mobileOpen)}
		class="button alt flex items-center justify-between w-full gap-2 text-sm"
		aria-expanded={mobileOpen}
		aria-controls="search-filter-mobile"
	>
		<span>Filter Results</span>
		<svg
			class="w-4 h-4 transition-transform duration-150 {mobileOpen ? 'rotate-180' : ''}"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			aria-hidden="true"
		>
			<path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	{#if mobileOpen}
		<div id="search-filter-mobile" class="mt-2 p-4 border border-gray-200 rounded-md bg-white">
			{@render filterContent()}
		</div>
	{/if}
</div>

<!-- Desktop: always visible -->
<div class="hidden md:block">
	<h2 class="text-sm font-medium text-black">Filter Results</h2>
	{@render filterContent()}
</div>
