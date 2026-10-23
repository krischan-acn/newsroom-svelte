<!--
  common/LanguageSelector.svelte - the "Global" edition switcher in the top bar.
  Opens on hover (with a short grace period to reach the menu) or on click.
-->
<script lang="ts">
	const EDITIONS = [
		{ code: 'en', label: 'English', href: 'https://www.acnnewswire.com' },
		{ code: 'zh-CN', label: '简体中文', href: 'https://ch.acnnewswire.com' },
		{ code: 'zh-CHT', label: '繁體中文', href: 'https://ct.acnnewswire.com' },
		{ code: 'ko-KR', label: '한국어', href: 'https://kr.acnnewswire.com' },
		{ code: 'ja-JP', label: '日本語', href: 'https://jcnnewswire.com' }
	];

	let { activeLocale = 'en' }: { activeLocale?: string } = $props();

	let open = $state(false);
	let root: HTMLDivElement;
	let hoverTimeout: ReturnType<typeof setTimeout> | undefined;

	function enter() {
		clearTimeout(hoverTimeout);
		open = true;
	}

	function leave() {
		hoverTimeout = setTimeout(() => (open = false), 100);
	}

	function onWindowPointerDown(event: PointerEvent) {
		if (open && !root.contains(event.target as Node)) open = false;
	}
</script>

<svelte:window onpointerdown={onWindowPointerDown} />

<div
	class="global-dropdown relative"
	bind:this={root}
	onmouseenter={enter}
	onmouseleave={leave}
	role="presentation"
>
	<button
		type="button"
		onclick={() => (open = !open)}
		class="flex flex-row items-center gap-2 border-0 bg-transparent text-xs leading-0.5 hover:text-gray-900"
		aria-expanded={open}
		aria-haspopup="true"
	>
		<svg width="12" height="13" viewBox="0 0 12 13" fill="none" aria-hidden="true">
			<path fill-rule="evenodd" clip-rule="evenodd" d="M6 0.5C9.31371 0.5 12 3.18629 12 6.5C12 9.81371 9.31371 12.5 6 12.5C2.68629 12.5 0 9.81371 0 6.5C0 3.18629 2.68629 0.5 6 0.5ZM6 11.4091C6.06227 11.4091 6.4751 11.3038 6.93535 10.2912C7.13742 9.84666 7.30876 9.30149 7.43145 8.68182H4.56855C4.69125 9.30149 4.86258 9.84666 5.06465 10.2912C5.5249 11.3038 5.93773 11.4091 6 11.4091ZM4.41274 7.59091H7.58726C7.61923 7.2414 7.63636 6.87665 7.63636 6.5C7.63636 6.12335 7.61923 5.7586 7.58726 5.40909H4.41274C4.38077 5.7586 4.36364 6.12335 4.36364 6.5C4.36364 6.87665 4.38077 7.2414 4.41274 7.59091ZM4.56855 4.31818C4.69125 3.69851 4.86258 3.15334 5.06465 2.70878C5.5249 1.69624 5.93773 1.59091 6 1.59091C6.06227 1.59091 6.4751 1.69624 6.93535 2.70878C7.13742 3.15334 7.30876 3.69851 7.43145 4.31818H4.56855ZM8.6823 5.40909C8.71184 5.76285 8.72727 6.12746 8.72727 6.5C8.72727 6.87254 8.71184 7.23715 8.6823 7.59091H10.7874C10.8671 7.24006 10.9091 6.87494 10.9091 6.5C10.9091 6.12506 10.8671 5.75994 10.7874 5.40909H8.6823ZM10.3988 4.31818H8.54135C8.37469 3.37933 8.10365 2.55548 7.7596 1.91568C8.91125 2.358 9.85395 3.22179 10.3988 4.31818ZM3.45865 4.31818H1.60119C2.14605 3.22179 3.08875 2.358 4.2404 1.91568C3.89635 2.55548 3.62531 3.37933 3.45865 4.31818ZM1.21255 5.40909H3.3177C3.28816 5.76285 3.27273 6.12746 3.27273 6.5C3.27273 6.87254 3.28816 7.23715 3.3177 7.59091H1.21255C1.13294 7.24006 1.09091 6.87494 1.09091 6.5C1.09091 6.12506 1.13294 5.75994 1.21255 5.40909ZM7.7596 11.0843C8.10365 10.4445 8.37469 9.62067 8.54135 8.68182H10.3988C9.85395 9.77821 8.91125 10.642 7.7596 11.0843ZM4.2404 11.0843C3.08875 10.642 2.14605 9.77821 1.60119 8.68182H3.45865C3.62531 9.62067 3.89635 10.4445 4.2404 11.0843Z" fill="#999999" />
		</svg>
		<span>Global</span>
		<svg class="h-4 w-4 transition-transform {open ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	{#if open}
		<div class="absolute z-50 mt-[7.5px] w-48 border border-gray-300 bg-white py-1 shadow-lg">
			{#each EDITIONS as edition (edition.code)}
				<a
					href={edition.href}
					class="block px-4 py-2 text-sm {edition.code === activeLocale ? '' : 'text-gray-700 hover:bg-gray-100'}"
				>
					{edition.label} ({edition.code})
				</a>
			{/each}
		</div>
	{/if}
</div>
