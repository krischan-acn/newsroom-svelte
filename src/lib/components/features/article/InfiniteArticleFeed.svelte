<!--
  features/article/InfiniteArticleFeed.svelte - keeps reading: when the reader
  nears the end of a release, the next-older one is appended below it.

  Fixed against the React version:
    - The successor is chosen by the server (/api/article/[id]/next). The old
      lookup ran in the browser against the external API, which sends no CORS
      headers, so it was blocked; and it only knew the latest 20 releases.
    - The address bar changed the moment the next release was FETCHED, before
      the reader had scrolled to it. It now follows only the release actually
      in view, in both directions.
    - The tab title follows it too. It used to stay on the first release.
-->
<script lang="ts">
	import { replaceState } from '$app/navigation';
	import type { NextArticle } from '#lib/types.ts';
	import PressRelease from './PressRelease.svelte';

	interface Props {
		first: { id: number; companyId: string | null; urlPath: string; title: string };
	}

	let { first }: Props = $props();

	let loaded = $state<NextArticle[]>([]);
	let loading = $state(false);
	let exhausted = $state(false);
	let sentinel: HTMLDivElement | undefined = $state();

	const seen = new Set<number>();

	async function loadNext() {
		if (loading || exhausted) return;
		const last = loaded.at(-1);
		const id = last ? last.data.id : first.id;
		const companyId = last ? (last.data.companies?.[0]?.comp_ID ?? null) : first.companyId;

		loading = true;
		try {
			const query = companyId ? `?company=${encodeURIComponent(companyId)}` : '';
			const res = await fetch(`/api/article/${id}/next${query}`);
			if (res.status !== 200) {
				exhausted = true;
				return;
			}
			const next: NextArticle = await res.json();
			if (next.data.id === first.id || seen.has(next.data.id)) {
				exhausted = true;
				return;
			}
			seen.add(next.data.id);
			loaded.push(next);
		} catch {
			exhausted = true;
		} finally {
			loading = false;
		}
	}

	// Load the next release once the reader is within 400px of the end.
	$effect(() => {
		if (!sentinel || exhausted) return;
		const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && loadNext(), {
			rootMargin: '400px'
		});
		observer.observe(sentinel);
		return () => observer.disconnect();
	});

	// Point the address bar and the tab title at whichever release is in the top
	// half of the viewport.
	$effect(() => {
		const sections = [
			{ el: document.getElementById('article-first-wrapper'), path: first.urlPath, title: first.title },
			...loaded.map((a) => ({
				el: document.getElementById(`article-${a.data.id}`),
				path: a.urlPath,
				title: `${a.data.headline} | ACN Newswire`
			}))
		].filter((s): s is { el: HTMLElement; path: string; title: string } => s.el !== null);

		// Watch even when the first release is the only one. Readers arrive on the
		// bare /article/<id> (every home and list link uses it), and the Next app
		// moved the address bar onto the canonical path as soon as the page loaded
		// (decision 0008). Waiting for a second release left the short URL in place
		// - for good, when there was no next release.
		if (sections.length === 0) return;

		const visible = new Set<Element>();
		let current = '';

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) visible.add(entry.target);
					else visible.delete(entry.target);
				}
				// The section whose top is nearest below the viewport top wins;
				// failing that, the one scrolled furthest into view.
				let best: (typeof sections)[number] | null = null;
				let bestScore = Infinity;
				for (const section of sections) {
					if (!visible.has(section.el)) continue;
					const top = section.el.getBoundingClientRect().top;
					const score = top >= 0 ? top : top + 1e9;
					if (score < bestScore) {
						bestScore = score;
						best = section;
					}
				}
				if (best && best.path !== current) {
					current = best.path;
					replaceState(best.path, {});
					document.title = best.title;
				}
			},
			{ threshold: 0, rootMargin: '0px 0px -50% 0px' }
		);

		for (const section of sections) observer.observe(section.el);
		return () => observer.disconnect();
	});
</script>

{#each loaded as article (article.data.id)}
	<div id="article-{article.data.id}" class="mt-12 pt-12">
		<PressRelease data={article.data} canonicalUrl={article.canonicalUrl} relatedArticles={article.related} />
	</div>
{/each}

<div bind:this={sentinel} class="h-1"></div>

{#if loading}
	<div class="py-8 text-center text-sm text-gray-400">Loading next release...</div>
{/if}

{#if exhausted}
	<div class="py-8 text-center text-sm text-gray-400">You've reached the end.</div>
{/if}
