<!--
  common/MainNav.svelte - logo, company search, and the mega-menu bar.

  Same behaviour as the React MainNav + MegaMenuNav pair: hovering a menu item
  opens its panel, hovering another switches it, and it closes when the pointer
  goes back up to the logo row, on a click outside, or from the floating Close
  button. The panel height animates with a grid-rows transition, so there is no
  ResizeObserver measuring it on every frame.

  No About / Contact / Login / Register items: none of those routes exist, and
  the only sign-in this site ever had was the employee A/B tool, now removed.
-->
<script lang="ts">
	import { fade } from 'svelte/transition';
	import CompanyMenu from './menus/CompanyMenu.svelte';
	import RegionMenu from './menus/RegionMenu.svelte';
	import CountryMenu from './menus/CountryMenu.svelte';
	import SectorMenu from './menus/SectorMenu.svelte';
	import IndustryMenu from './menus/IndustryMenu.svelte';
	import LanguageMenu from './menus/LanguageMenu.svelte';

	type MenuKey = 'company' | 'region' | 'country' | 'sector' | 'industry' | 'language';

	const ITEMS: { label: string; href: string; menu?: MenuKey }[] = [
		{ label: 'Company', href: '#top', menu: 'company' },
		{ label: 'Region', href: '#top', menu: 'region' },
		{ label: 'Country', href: '#top', menu: 'country' },
		{ label: 'Exchange', href: '#top' },
		{ label: 'Stock Codes', href: '#top' },
		{ label: 'Sector', href: '#top', menu: 'sector' },
		{ label: 'Industry', href: '#top', menu: 'industry' },
		{ label: 'Language', href: '#top', menu: 'language' },
		{ label: 'Events', href: '/events' }
	];

	const MENUS = {
		company: CompanyMenu,
		region: RegionMenu,
		country: CountryMenu,
		sector: SectorMenu,
		industry: IndustryMenu,
		language: LanguageMenu
	};

	let mobileOpen = $state(false);
	let scrolled = $state(false);
	/** The menu whose content is rendered. Stays set while the panel animates shut. */
	let rendered = $state<MenuKey | null>(null);
	/** Whether the panel is expanded. */
	let expanded = $state(false);
	let megaRoot: HTMLDivElement;
	let closeTimer: ReturnType<typeof setTimeout> | undefined;

	const Menu = $derived(rendered ? MENUS[rendered] : null);

	function open(menu: MenuKey) {
		clearTimeout(closeTimer);
		rendered = menu;
		expanded = true;
	}

	function close() {
		if (!expanded) return;
		expanded = false;
		closeTimer = setTimeout(() => (rendered = null), 150);
	}

	function onWindowPointerDown(event: PointerEvent) {
		if (expanded && !megaRoot.contains(event.target as Node)) close();
	}
</script>

<svelte:window onscroll={() => (scrolled = window.scrollY > 16)} onpointerdown={onWindowPointerDown} />

<nav class="sticky top-0 z-[99] border-b border-gray-200 bg-white">
	<div class="mx-auto w-full max-w-[1920px] transition-[padding] duration-200 {scrolled ? 'px-4' : 'px-[60px]'}">
		<div class="flex h-16 flex-row items-center lg:h-auto lg:flex-col">
			<div class="flex w-full flex-row justify-between gap-4 py-3" role="presentation" onmouseenter={close}>
				<a href="/" class="flex-shrink-0" aria-label="ACN Newswire homepage">
					<img src="/logo.svg" alt="" width="250" height="25" class="h-8 w-[250px] lg:h-10" />
				</a>

				<!-- Searches COMPANIES, not headlines - hence the placeholder. -->
				<div class="mx-6 hidden flex-1 justify-center self-center lg:flex">
					<form action="/search" method="GET" class="relative w-full max-w-xl xl:max-w-2xl">
						<input
							type="search"
							name="q"
							placeholder="Search for a company"
							aria-label="Search for a company"
							class="w-full rounded-md border border-gray-300 px-4 py-2 pr-10 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
						/>
						<button
							type="submit"
							class="absolute top-1/2 right-2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
							aria-label="Submit search"
						>
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
							</svg>
						</button>
					</form>
				</div>

				<!-- Spacer matching the logo's width, so the search box sits in the true centre. -->
				<div class="hidden w-[250px] flex-shrink-0 lg:block" aria-hidden="true"></div>
			</div>

			<div bind:this={megaRoot} class="hidden w-full border-t border-gray-200 lg:block">
				<div class="flex items-center gap-1">
					{#each ITEMS as item, index (item.label)}
						<a
							href={item.href}
							class="nav-link mega {index === 0 ? 'pl-0!' : ''} {item.menu && rendered === item.menu && expanded ? 'open' : ''}"
							onmouseenter={() => (item.menu ? open(item.menu) : close())}
							onclick={(e) => {
								if (item.menu) {
									e.preventDefault();
									if (expanded && rendered === item.menu) close();
									else open(item.menu);
								}
							}}
							aria-expanded={item.menu ? expanded && rendered === item.menu : undefined}
						>
							{item.label}
						</a>
					{/each}
				</div>

				{#if Menu}
					<div
						class="absolute top-full right-0 left-0 z-40 grid border-t border-gray-200 bg-white shadow-lg transition-[grid-template-rows] duration-150 ease-in-out"
						style:grid-template-rows={expanded ? '1fr' : '0fr'}
					>
						<div class="overflow-hidden">
							<div class="relative mx-auto min-h-[300px] w-full max-w-[1920px] px-[60px] py-6">
								{#key rendered}
									<div in:fade={{ duration: 75 }}>
										<Menu onclose={close} />
									</div>
								{/key}
							</div>
						</div>
					</div>
				{/if}
			</div>

			<button
				onclick={() => (mobileOpen = !mobileOpen)}
				class="-mr-2 rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-600 lg:hidden"
				aria-expanded={mobileOpen}
				aria-label="Menu"
			>
				<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
					{#if mobileOpen}
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					{:else}
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
					{/if}
				</svg>
			</button>
		</div>

		{#if mobileOpen}
			<div class="fixed inset-0 z-[999] mt-9 overflow-y-auto bg-white lg:hidden">
				<div class="p-4">
					<div class="mb-4 flex justify-end">
						<button
							onclick={() => (mobileOpen = false)}
							class="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
							aria-label="Close menu"
						>
							<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>

					<form action="/search" method="GET" class="relative mb-6" onsubmit={() => (mobileOpen = false)}>
						<!-- svelte-ignore a11y_autofocus -->
						<input
							type="search"
							name="q"
							placeholder="Search for a company"
							aria-label="Search for a company"
							class="w-full rounded-md border border-gray-300 px-4 py-3 pr-12 focus:ring-2 focus:ring-blue-500 focus:outline-none"
							autofocus
						/>
						<button type="submit" class="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400" aria-label="Submit search">
							<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
							</svg>
						</button>
					</form>

					<div class="mt-8 border-t border-gray-200 pt-6">
						<p class="text-center text-sm text-gray-500">© {new Date().getFullYear()} ACN Newswire</p>
					</div>
				</div>
			</div>
		{/if}

		{#if expanded}
			<div class="fixed bottom-9 left-1/2 z-[100] -translate-x-1/2" transition:fade={{ duration: 150 }}>
				<button onclick={close} class="button alt flex gap-3"><span class="font-bold">✕</span> Close Menu</button>
			</div>
		{/if}
	</div>
</nav>
