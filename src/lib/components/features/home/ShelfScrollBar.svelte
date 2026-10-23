<!--
  features/home/ShelfScrollBar.svelte - the thin draggable scrollbar under a
  horizontal card shelf (the native one is hidden with .scrollbar-hide).

  Dragging the thumb scrolls the shelf; clicking the track jumps there. It
  measures on mount, on resize, on scroll, and again after a back/forward cache
  restore, when the browser hands back a frozen layout.
-->
<script lang="ts">
	let { target }: { target: HTMLElement | undefined } = $props();

	let scrollLeft = $state(0);
	let scrollWidth = $state(0);
	let clientWidth = $state(0);
	let dragging = $state(false);
	let track: HTMLDivElement | undefined = $state();
	let drag: { startX: number; startScroll: number; trackPx: number } | null = null;

	function measure() {
		if (!target) return;
		scrollLeft = target.scrollLeft;
		scrollWidth = target.scrollWidth;
		clientWidth = target.clientWidth;
	}

	$effect(() => {
		const el = target;
		if (!el) return;
		measure();
		const frame = requestAnimationFrame(measure);
		const observer = new ResizeObserver(measure);
		observer.observe(el);
		el.addEventListener('scroll', measure, { passive: true });
		return () => {
			cancelAnimationFrame(frame);
			observer.disconnect();
			el.removeEventListener('scroll', measure);
		};
	});

	const maxScroll = $derived(Math.max(0, scrollWidth - clientWidth));
	const hasOverflow = $derived(maxScroll > 0);
	const thumbWidthPct = $derived(hasOverflow ? Math.max(10, (clientWidth / scrollWidth) * 100) : 100);
	const thumbLeftPct = $derived(hasOverflow ? (scrollLeft / maxScroll) * (100 - thumbWidthPct) : 0);
	const percent = $derived(maxScroll > 0 ? Math.round((scrollLeft / maxScroll) * 100) : 0);

	function onPointerDown(e: PointerEvent) {
		if (!track || !target) return;
		e.preventDefault();
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		drag = { startX: e.clientX, startScroll: target.scrollLeft, trackPx: track.clientWidth };
		dragging = true;
	}

	function onPointerMove(e: PointerEvent) {
		if (!drag || !target) return;
		const usable = drag.trackPx * (1 - thumbWidthPct / 100);
		if (usable <= 0) return;
		target.scrollLeft = drag.startScroll + ((e.clientX - drag.startX) / usable) * maxScroll;
	}

	function onPointerUp(e: PointerEvent) {
		if (!drag) return;
		(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
		drag = null;
		dragging = false;
	}

	function onTrackClick(e: MouseEvent) {
		if ((e.target as HTMLElement).closest('[data-thumb]') || !track || !target) return;
		const rect = track.getBoundingClientRect();
		const ratio = (e.clientX - rect.left) / rect.width;
		target.scrollTo({ left: Math.max(0, Math.min(maxScroll, ratio * maxScroll)), behavior: 'smooth' });
	}
</script>

<svelte:window onpageshow={(e) => e.persisted && requestAnimationFrame(measure)} />

{#if hasOverflow}
	<div
		style="padding: 12px 0; margin: -12px -12px"
		class="group relative mt-4 h-4 origin-center cursor-grab items-center justify-center active:cursor-grabbing"
		role="presentation"
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
		onpointercancel={onPointerUp}
	>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			bind:this={track}
			role="scrollbar"
			aria-controls={target?.id}
			aria-orientation="horizontal"
			aria-valuemin={0}
			aria-valuemax={100}
			aria-valuenow={percent}
			tabindex="-1"
			onclick={onTrackClick}
			class="relative h-0.5 origin-center bg-neutral-200 transition-[height] duration-150 group-hover:h-1"
		>
			<div
				data-thumb
				style:width="{thumbWidthPct}%"
				style:left="{thumbLeftPct}%"
				style:transition={dragging ? 'none' : 'left 120ms ease-out'}
				class="absolute inset-y-0 touch-none bg-black"
			></div>
		</div>
	</div>
{/if}
