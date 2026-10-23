<!--
  features/home/HomeHero.svelte - the home page carousel.

  Advances every 8s, pauses with the tab hidden, and loops seamlessly: the
  first slide is repeated at the end of the track, and when the transition onto
  that copy finishes the track snaps back to the real first slide with the
  transition switched off for one frame.

  Only the first slide's image is fetched eagerly and at high priority - it is
  the page's largest paint. The others are lazy.
-->
<script lang="ts">
	import type { NewsListItem } from '#lib/server/news-list.ts';
	import Img from '../../shared/Img.svelte';

	let { slides }: { slides: NewsListItem[] } = $props();

	const INTERVAL_MS = 8000;
	const SLIDE_DURATION_MS = 700;

	let active = $state(0);
	let animate = $state(true);
	let paused = $state(false);

	const count = $derived(slides.length);
	const displayActive = $derived(count > 0 ? active % count : 0);
	const track = $derived(count > 0 ? [...slides, slides[0]] : []);

	$effect(() => {
		if (count <= 1) return;

		const advance = () => {
			if (paused) return;
			animate = true;
			active += 1;
		};

		let id = setInterval(advance, INTERVAL_MS);
		const onVisibility = () => {
			clearInterval(id);
			if (!document.hidden) id = setInterval(advance, INTERVAL_MS);
		};

		document.addEventListener('visibilitychange', onVisibility);
		return () => {
			clearInterval(id);
			document.removeEventListener('visibilitychange', onVisibility);
		};
	});

	function onTransitionEnd() {
		if (active !== count) return;
		animate = false;
		active = 0;
		requestAnimationFrame(() => requestAnimationFrame(() => (animate = true)));
	}

	function jumpTo(i: number) {
		animate = true;
		active = i;
	}
</script>

{#if count > 0}
	<section aria-roledescription="carousel" aria-label="Featured news" class="relative overflow-hidden">
		<div
			class="flex"
			style:transform="translateX(-{active * 100}%)"
			style:transition={animate ? `transform ${SLIDE_DURATION_MS}ms cubic-bezier(0.4, 0, 0.2, 1)` : 'none'}
			ontransitionend={onTransitionEnd}
		>
			{#each track as slide, i (i)}
				{@const hidden = i !== active}
				<div aria-hidden={hidden} class="grid min-w-full grid-cols-1 md:grid-cols-[1fr_1fr]">
					<div class="relative aspect-[16/10] bg-neutral-200 md:aspect-auto md:h-[560px]">
						{#if slide.thumbImage}
							<Img
								src={slide.thumbImage}
								alt={slide.headline}
								priority={i === 0}
								class="absolute inset-0 h-full w-full object-cover"
							/>
						{/if}
					</div>
					<div class="flex flex-col justify-center bg-[#fafafa] px-8 py-12 md:px-16">
						<div class="text-2xl leading-[1.2] font-normal tracking-tight text-black lg:text-4xl">{slide.headline}</div>
						{#if slide.description}
							<p class="mt-6 mb-10 line-clamp-3 text-base text-gray-500 md:text-lg">{slide.description}</p>
						{/if}
						<!-- Same tab: a new tab stranded readers who did not notice it open. -->
						<a href="/article/{slide.id}" class="button alt inline-flex w-fit items-center px-3" tabindex={hidden ? -1 : 0}>
							Read more
						</a>
					</div>
				</div>
			{/each}
		</div>

		<div class="flex items-center gap-8 px-16 py-8">
			{#each slides as _, i (i)}
				<button
					type="button"
					onclick={() => jumpTo(i)}
					aria-label="Go to slide {i + 1}"
					aria-current={i === displayActive ? 'true' : undefined}
					class="relative flex-1 cursor-pointer overflow-visible bg-transparent transition-opacity hover:opacity-50"
					style="padding: 20px 0; margin: -20px 0"
				>
					<span class="relative block h-0.5 w-full overflow-hidden bg-neutral-200">
						{#if i < displayActive}
							<span class="absolute inset-0 bg-black"></span>
						{:else if i === displayActive}
							{#key displayActive}
								<span
									class="hero-fill absolute inset-0 origin-left bg-black"
									style:animation-duration="{INTERVAL_MS}ms"
									style:animation-play-state={paused ? 'paused' : 'running'}
								></span>
							{/key}
						{/if}
					</span>
				</button>
			{/each}

			<button
				type="button"
				onclick={() => (paused = !paused)}
				aria-label={paused ? 'Play slideshow' : 'Pause slideshow'}
				class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-neutral-300 bg-white text-black transition-all hover:border-neutral-500 hover:bg-neutral-100 focus-visible:outline focus-visible:outline-black active:border-black"
			>
				{#if paused}
					<svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
						<polygon points="2,1 9,5 2,9" />
					</svg>
				{:else}
					<svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
						<rect x="2" y="1" width="2.5" height="8" />
						<rect x="5.5" y="1" width="2.5" height="8" />
					</svg>
				{/if}
			</button>
		</div>
	</section>
{/if}

<style>
	.hero-fill {
		animation-name: hero-fill-bar;
		animation-timing-function: linear;
		animation-fill-mode: forwards;
	}

	@keyframes hero-fill-bar {
		from {
			transform: scaleX(0);
		}
		to {
			transform: scaleX(1);
		}
	}
</style>
