<!--
  features/article/Body.svelte - the release body.

  `content` is already sanitised: the adapter runs every body through
  sanitize-html on the server (lib/server/sanitize.ts) before it leaves the
  service layer. This component does nothing to it, which is the point - the
  React version re-sanitised with DOMPurify after mount and swapped the markup
  in, repainting the largest element on the page. Do not pass anything here that
  did not come through fetchPressRelease.
-->
<script lang="ts">
	let { content }: { content: string } = $props();
</script>

{#if content}
	<div class="article-body prose prose-lg max-w-none">
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- sanitised server-side, see above -->
		{@html content}
	</div>
{/if}
