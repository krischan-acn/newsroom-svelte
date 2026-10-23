<!-- features/article/ArticleFooterLink.svelte - the newswire sign-off under a release, with its view count. -->
<script lang="ts">
	let { views }: { views?: string } = $props();
</script>

<footer class="mt-8 border-t border-gray-200 pt-6">
	<div class="flex items-end justify-between gap-4">
		<div>
			<a
				href="https://www.acnnewswire.com"
				target="_blank"
				rel="noopener noreferrer"
				class="block font-bold text-[#2088c9] hover:underline"
			>
				https://www.acnnewswire.com
			</a>
			<p class="mt-1 text-sm text-gray-600">From the Asia Corporate News Network</p>
		</div>

		{#if views}
			<p class="shrink-0 text-xs text-gray-500">{views} views</p>
		{/if}
	</div>
</footer>
