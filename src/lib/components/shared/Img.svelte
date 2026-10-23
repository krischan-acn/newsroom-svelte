<!--
  shared/Img.svelte - every content image goes through here.

  `priority` is for the one image that is the page's largest paint (the first
  hero slide): it is fetched eagerly and at high priority. Everything else is
  lazy and decoded off the main thread.

  Images are served at their original size. This app runs on Cloudflare
  Workers, and Cloudflare's resizer needs a custom domain with Image
  Transformations switched on; once that exists, resizing belongs here and
  nowhere else.

  Explicit attributes rather than a ...rest spread: a spread on <img> makes
  Svelte server-render inline onload/onerror handlers, which the CSP blocks.
-->
<script lang="ts">
	interface Props {
		src: string;
		alt: string;
		priority?: boolean;
		class?: string;
		style?: string;
	}

	let { src, alt, priority = false, class: className, style }: Props = $props();
</script>

<img
	class={className}
	{style}
	{src}
	{alt}
	loading={priority ? 'eager' : 'lazy'}
	fetchpriority={priority ? 'high' : undefined}
	decoding="async"
/>
