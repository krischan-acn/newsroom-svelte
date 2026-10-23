<!-- common/menus/LanguageMenu.svelte - the five languages, each with its native name and tag. -->
<script lang="ts">
	import { LANGUAGES, searchHrefFor } from '#lib/languages.ts';
	import LanguageTag from '../../shared/LanguageTag.svelte';

	let { onclose }: { onclose: () => void } = $props();
</script>

<div class="flex flex-wrap justify-between gap-x-8 gap-y-4">
	{#each LANGUAGES as language (language.id)}
		<p class="flex items-center gap-2">
			<a href={searchHrefFor(language)} class="dropdown-link" onclick={onclose} hreflang={language.bcp47}>
				{language.label}
				<span class="mx-1 text-gray-400">•</span>
				<span lang={language.bcp47}>{language.endonym}</span>
			</a>
			<LanguageTag value={language.id} />
		</p>
	{/each}
</div>
