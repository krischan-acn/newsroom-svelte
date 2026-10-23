<!--
  features/home/CategoryRow.svelte - one horizontal shelf of a sector's latest
  releases. A card shows the press photo when there is one, otherwise the
  issuer's logo on a white mat, otherwise an empty box of the same size.
-->
<script lang="ts">
	import type { NewsListItem } from '#lib/server/news-list.ts';
	import { formatDateTime } from '#lib/format.ts';
	import { imagesLoaded } from '#lib/actions/image.ts';
	import ShelfScrollBar from './ShelfScrollBar.svelte';

	type Card = Omit<NewsListItem, 'description'>;

	let { title, exploreLabel, items }: { title: string; exploreLabel: string; items: Card[] } = $props();

	let shelf: HTMLDivElement | undefined = $state();

	/** Per-card width, keyed by id: portrait photos pin height, not width. */
	let widths: Record<number, string> = $state({});

	function onPhotoLoad(img: HTMLImageElement) {
		const id = Number(img.dataset.photoFor);
		if (!id) return;
		const { naturalWidth: w, naturalHeight: h } = img;
		widths[id] = w >= h ? '200px' : `${Math.round((w / h) * 200)}px`;
	}
</script>

{#if items.length > 0}
	<section class="mx-auto max-w-[1920px] px-12 py-16">
		<div class="mb-8 flex items-center justify-between">
			<h2 class="text-3xl tracking-tight text-black">{title}</h2>
			<a href="/search?sec={encodeURIComponent(title)}" class="button alt inline-flex items-center px-6 py-2.5">
				{exploreLabel}
			</a>
		</div>

		<!-- Focusable so keyboard readers can scroll the shelf with the arrow keys. -->
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<div
			bind:this={shelf}
			use:imagesLoaded={onPhotoLoad}
			role="region"
			aria-label="{title} news"
			tabindex="0"
			class="scrollbar-hide -mx-6 flex items-center gap-6 overflow-x-auto px-6 pb-2"
		>
			{#each items as pr (pr.id)}
				{@const width = pr.thumbImage ? (widths[pr.id] ?? '200px') : '160px'}
				<a href="/article/{pr.id}" class="shrink-0 self-start">
					<article class="flex flex-col">
						{#if pr.thumbImage}
							<div class="mb-4 flex items-end overflow-hidden" style:height="200px" style:width={width}>
								<img
									src={pr.thumbImage}
									alt={pr.companyName}
									loading="lazy"
									data-photo-for={pr.id}
									style:width={widths[pr.id] && widths[pr.id] !== '200px' ? 'auto' : '200px'}
									style:height={widths[pr.id] && widths[pr.id] !== '200px' ? '200px' : 'auto'}
									class="block"
								/>
							</div>
						{:else if pr.logoSrc}
							<div class="mb-4 flex items-start justify-center overflow-hidden p-6" style="width: 160px; height: 200px">
								<div class="flex items-center justify-center bg-white" style="width: 200px; height: 200px">
									<img
										src={pr.logoSrc}
										alt={pr.companyName}
										loading="lazy"
										style="max-width: 120px; max-height: 120px; width: auto; height: auto"
										class="block"
									/>
								</div>
							</div>
						{:else}
							<div class="mb-4" style="width: 200px; height: 200px"></div>
						{/if}

						<div class="overflow-hidden" style:height="250px" style:width={width}>
							<h3 class="mb-3 line-clamp-4 text-base leading-snug text-black">{pr.headline}</h3>
							<p class="mb-1 text-sm font-semibold text-[#2088c9]">{pr.companyName}</p>
							<p class="text-[10px] text-gray-400">{formatDateTime(pr.dateTime)}</p>
						</div>
					</article>
				</a>
			{/each}
		</div>

		<ShelfScrollBar target={shelf} />
	</section>
{/if}
