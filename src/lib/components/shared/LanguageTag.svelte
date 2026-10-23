<!--
  shared/LanguageTag.svelte

  Language badge with an explanatory tooltip (hover + keyboard focus) and a
  details menu (click, Enter, right-click, Shift+F10).

  A <span role="button"> rather than a <button> because list rows wrap their
  whole body in a link, and a nested <button> is invalid HTML. Every pointer
  handler stops propagation so using the tag never follows the surrounding link.

  Same behaviour as the React version. The tooltip and menu only exist in the
  DOM while open, so a feed of fifty rows costs fifty spans, not fifty widgets.
-->
<script lang="ts">
	import { tick } from 'svelte';
	import { resolveLanguage, searchHrefFor } from '#lib/languages.ts';
	import { portal } from '#lib/actions/portal.ts';

	interface Props {
		/** Any known spelling of a language. Unknown values render verbatim. */
		value: string | null | undefined;
		variant?: 'badge' | 'inline';
		/** Show the English name beside the badge. */
		withLabel?: boolean;
		class?: string;
	}

	let { value, variant = 'badge', withLabel = false, class: className = '' }: Props = $props();

	const MENU_MARGIN = 8;
	const uid = $props.id();
	const tooltipId = `${uid}-tip`;
	const menuId = `${uid}-menu`;

	const language = $derived(resolveLanguage(value));
	const label = $derived(language?.label ?? value ?? '');
	const badge = $derived(language?.badge ?? (value ?? '').toUpperCase().slice(0, 6));
	const description = $derived(
		language?.description ??
			`“${value}” is not a language tag this site recognises. It is shown exactly as the newswire supplied it.`
	);

	let anchor = $state<HTMLSpanElement>();
	let menu = $state<HTMLDivElement>();
	let tip = $state<HTMLDivElement>();

	let tooltipOpen = $state(false);
	let tipPos = $state<{ left: number; top: number } | null>(null);
	let menuAt = $state<{ x: number; y: number } | null>(null);
	let menuPos = $state<{ left: number; top: number } | null>(null);

	// Place the tooltip above the anchor, or below it when there is no room, and
	// keep it inside the viewport horizontally.
	$effect(() => {
		if (!tooltipOpen || menuAt || !anchor || !tip) {
			tipPos = null;
			return;
		}
		const a = anchor.getBoundingClientRect();
		const t = tip.getBoundingClientRect();
		let left = a.left + a.width / 2 - t.width / 2;
		left = Math.max(MENU_MARGIN, Math.min(left, window.innerWidth - t.width - MENU_MARGIN));
		const above = a.top - t.height - 6;
		tipPos = { left, top: above >= MENU_MARGIN ? above : a.bottom + 6 };
	});

	// Measure the open menu, flip it away from the viewport edges, then focus it.
	$effect(() => {
		if (!menuAt || !menu) return;
		const { width, height } = menu.getBoundingClientRect();
		let { x: left, y: top } = menuAt;
		if (left + width + MENU_MARGIN > window.innerWidth) left = Math.max(MENU_MARGIN, menuAt.x - width);
		if (top + height + MENU_MARGIN > window.innerHeight) top = Math.max(MENU_MARGIN, menuAt.y - height - 8);
		menuPos = { left, top };
		// focus() is a no-op on a visibility:hidden element, so wait for the
		// position to land before moving focus into the menu.
		tick().then(() => menu?.focus());
	});

	function openMenuAt(x: number, y: number) {
		tooltipOpen = false;
		menuPos = null;
		menuAt = { x, y };
	}

	function openMenuFromAnchor() {
		const rect = anchor?.getBoundingClientRect();
		if (rect) openMenuAt(rect.left, rect.bottom + 4);
	}

	function dismiss() {
		menuAt = null;
		menuPos = null;
	}

	function closeMenu() {
		dismiss();
		anchor?.focus();
	}

	function onContextMenu(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		openMenuAt(e.clientX, e.clientY);
	}

	function onClick(e: MouseEvent) {
		// The tag frequently sits inside a row-wide link; never navigate.
		e.preventDefault();
		e.stopPropagation();
		if (menuAt) closeMenu();
		else openMenuFromAnchor();
	}

	function onKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ' || e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) {
			e.preventDefault();
			e.stopPropagation();
			openMenuFromAnchor();
		}
	}

	// Roving focus across the menu items.
	function onMenuKeyDown(e: KeyboardEvent) {
		if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
		e.preventDefault();
		const items = Array.from(menu?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
		if (items.length === 0) return;
		const current = items.indexOf(document.activeElement as HTMLElement);
		let next: number;
		if (e.key === 'Home') next = 0;
		else if (e.key === 'End') next = items.length - 1;
		else if (e.key === 'ArrowDown') next = current < 0 ? 0 : (current + 1) % items.length;
		else next = current <= 0 ? items.length - 1 : current - 1;
		items[next]?.focus();
	}

	// Dismiss on Escape, Tab, an outside pointer, scroll or resize. Listening
	// only while a menu is open: a feed renders dozens of these tags.
	$effect(() => {
		if (!menuAt) return;

		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				e.preventDefault();
				closeMenu();
			} else if (e.key === 'Tab') {
				closeMenu();
			}
		};
		const onPointerDown = (e: PointerEvent) => {
			const target = e.target as Node;
			if (menu?.contains(target) || anchor?.contains(target)) return;
			dismiss();
		};

		document.addEventListener('keydown', onKeyDown);
		document.addEventListener('pointerdown', onPointerDown, true);
		window.addEventListener('scroll', dismiss, true);
		window.addEventListener('resize', dismiss);
		return () => {
			document.removeEventListener('keydown', onKeyDown);
			document.removeEventListener('pointerdown', onPointerDown, true);
			window.removeEventListener('scroll', dismiss, true);
			window.removeEventListener('resize', dismiss);
		};
	});

	function copyTag() {
		navigator.clipboard?.writeText(language?.bcp47 ?? value ?? '').catch(() => {});
		closeMenu();
	}

	const baseStyles = $derived(
		variant === 'badge'
			? 'inline-flex items-center gap-1 rounded border border-gray-300 bg-gray-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-none tracking-wide text-gray-600'
			: 'inline-flex items-center gap-1 text-xs text-gray-600 underline decoration-dotted underline-offset-2'
	);
</script>

{#if value}
	<span
		bind:this={anchor}
		role="button"
		tabindex="0"
		lang={language?.bcp47}
		aria-label="Language: {label}. Press Enter or right-click for details."
		aria-describedby={tooltipOpen ? tooltipId : undefined}
		aria-haspopup="menu"
		aria-expanded={menuAt ? true : false}
		aria-controls={menuAt ? menuId : undefined}
		oncontextmenu={onContextMenu}
		onclick={onClick}
		onkeydown={onKeyDown}
		onmouseenter={() => (tooltipOpen = true)}
		onmouseleave={() => (tooltipOpen = false)}
		onfocus={() => (tooltipOpen = true)}
		onblur={() => (tooltipOpen = false)}
		class="{baseStyles} cursor-help transition-colors hover:border-gray-400 hover:text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2088c9] focus-visible:ring-offset-1 {className}"
	>
		{badge}
		{#if withLabel}<span class="font-normal normal-case">{label}</span>{/if}
	</span>

	{#if tooltipOpen && !menuAt}
		<div
			use:portal
			bind:this={tip}
			id={tooltipId}
			role="tooltip"
			style:left="{tipPos?.left ?? 0}px"
			style:top="{tipPos?.top ?? 0}px"
			style:visibility={tipPos ? 'visible' : 'hidden'}
			class="pointer-events-none fixed z-[100] w-64 rounded-md bg-gray-900 px-3 py-2 text-xs leading-relaxed text-white shadow-lg"
		>
			<span class="font-semibold">{label}</span>
			{#if language && language.endonym !== language.label}
				<span lang={language.bcp47} class="ml-1 text-gray-300">{language.endonym}</span>
			{/if}
			<span class="mt-1 block text-gray-300">{description}</span>
			<span class="mt-1.5 block text-[10px] uppercase tracking-wide text-gray-400">Right-click for details</span>
		</div>
	{/if}

	{#if menuAt}
		<div
			use:portal
			bind:this={menu}
			id={menuId}
			role="menu"
			tabindex="-1"
			aria-label="{label} language details"
			onkeydown={onMenuKeyDown}
			style:left="{menuPos?.left ?? menuAt.x}px"
			style:top="{menuPos?.top ?? menuAt.y}px"
			style:visibility={menuPos ? 'visible' : 'hidden'}
			class="fixed z-[100] w-64 rounded-md border border-gray-200 bg-white py-1 text-sm shadow-lg focus:outline-none"
		>
			<div class="border-b border-gray-100 px-3 pt-1.5 pb-2">
				<p class="font-semibold text-gray-900">{label}</p>
				{#if language && language.endonym !== language.label}
					<p lang={language.bcp47} class="text-xs text-gray-500">{language.endonym}</p>
				{/if}
				<p class="mt-1 text-xs leading-relaxed text-gray-500">{description}</p>
			</div>

			{#if language}
				<dl class="border-b border-gray-100 px-3 py-2 text-xs">
					{#each [['Language tag', language.bcp47], ['Script', language.script], ['Times shown in', language.timezone], ['Edition', language.subdomain]] as [term, detail] (term)}
						{#if detail}
							<div class="flex justify-between gap-3 py-0.5">
								<dt class="text-gray-500">{term}</dt>
								<dd class="font-medium text-gray-800">{detail}</dd>
							</div>
						{/if}
					{/each}
				</dl>

				<a
					href={searchHrefFor(language)}
					role="menuitem"
					onclick={dismiss}
					class="block px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
				>
					Browse all {label} releases
				</a>
			{/if}

			<button
				type="button"
				role="menuitem"
				onclick={copyTag}
				class="block w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
			>
				Copy language tag
			</button>
		</div>
	{/if}
{/if}
