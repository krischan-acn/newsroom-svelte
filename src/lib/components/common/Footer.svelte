<!--
  common/Footer.svelte

  Markup unchanged from the React footer, including the two Webflow breakpoints
  (991px and 479px), kept as arbitrary variants rather than rounded to lg:/sm:,
  which would move the layout.

  Changed: the logo is the site's own /logo.svg instead of a PNG hotlinked from
  a Webflow CDN bucket - one less third-party origin, and the footer no longer
  loses its logo if that bucket goes away.

  Still true: every link is "#top". None of these pages exist yet.
-->
<script lang="ts">
	const LINK = 'inline-block p-1 text-sm text-[#666] no-underline hover:text-[#2088c9]';
	const COLUMN_HEADER = 'mb-1 py-1 pr-2 pl-0.5 font-medium text-black no-underline';

	/** The two stacked link columns, left group then middle group. */
	const COLUMN_GROUPS: { header: string; links: string[] }[][] = [
		[
			{ header: 'About', links: ['Corporate', 'Services', 'Partners', 'Contact', 'Media Kit'] },
			{ header: 'Terms', links: ['Privacy Policy', 'Terms of Use', 'Cookies Policy', 'Disclaimer'] }
		],
		[
			{ header: 'Research', links: ['Company', 'Region', 'Sector', 'Industry', 'Language'] },
			{ header: 'Participate', links: ['Register', 'Login', 'FAQ', 'Support', 'ACN RSS'] }
		]
	];

	const SOCIALS = [
		{ platform: 'facebook', label: 'Facebook' },
		{ platform: 'linkedin', label: 'LinkedIn' },
		{ platform: 'x', label: 'X (Twitter)' },
		{ platform: 'stocktwits', label: 'Stock Twits' },
		{ platform: 'pinterest', label: 'Pinterest' },
		{ platform: 'reddit', label: 'Reddit' },
		{ platform: 'instagram', label: 'Instagram' },
		{ platform: 'telegram', label: 'Telegram' },
		{ platform: 'tumblr', label: 'Tumblr' }
	];

	const year = new Date().getFullYear();
</script>

<footer class="w-full min-w-[300px] bg-white text-black">
	<div class="h-px w-full bg-[#d9d9d9]"></div>

	<div class="mx-auto max-w-[1920px] p-6 pt-12 min-[992px]:px-[60px] min-[992px]:py-16">
		<div class="flex flex-col gap-8 min-[992px]:flex-row min-[992px]:justify-between">
			<a href="/" class="mb-8 inline-block w-[clamp(150px,100%,250px)]">
				<img src="/logo.svg" loading="lazy" alt="ACN Newswire logo" width="250" height="25" class="h-auto w-full" />
			</a>

			<div class="grid w-full grid-cols-1 gap-6 min-[480px]:grid-cols-2 min-[480px]:gap-8 min-[992px]:w-3/5 min-[992px]:grid-cols-3">
				{#each COLUMN_GROUPS as group, i (i)}
					<div class="flex flex-col gap-6">
						{#each group as column (column.header)}
							<div class="flex flex-col items-start">
								<a href="#top" class={COLUMN_HEADER}>{column.header}</a>
								<div class="flex w-full flex-col text-sm">
									{#each column.links as label (label)}
										<a href="#top" class={LINK}>{label}</a>
									{/each}
								</div>
							</div>
						{/each}
					</div>
				{/each}

				<div class="flex flex-col items-start">
					<a href="#top" class={COLUMN_HEADER}>Follow Us</a>
					<div class="flex w-full flex-col text-sm">
						{#each SOCIALS as { platform, label } (platform)}
							<div class="flex flex-row items-center gap-0">
								<img src="/social/{platform}.svg" alt="{platform} icon" class="h-5 w-5" loading="lazy" />
								<a href="#top" class="{LINK} pt-1.5 pr-1.5 pl-2">{label}</a>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</div>

	<div class="h-px w-full bg-[#2088c9]"></div>

	<div class="mx-auto w-full max-w-[1920px] px-8 py-6 text-left">
		<div class="inline-block p-1 text-xs text-[#666]">Copyright © {year} ACN Newswire. All rights reserved.</div>
	</div>
</footer>
