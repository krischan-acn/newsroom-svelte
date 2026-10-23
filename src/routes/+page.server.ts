// The home page.
//
// Every band is fetched in parallel and the page is sent as complete HTML. The
// Next app streamed each band behind its own Suspense boundary instead; here
// that would mean crawlers and no-JS readers get skeletons, because SvelteKit
// fills streamed data in on the client. Complete HTML is affordable because the
// page is cached at the CDN (lib/server/cache.ts) - nearly every reader gets a copy
// served in milliseconds, and only the background refresh pays for the fetches.
//
// Each band still fails on its own: a dead endpoint empties its band, never the
// page.

import { CATEGORIES } from '#lib/categories.ts';
import { NO_STORE, PAGE_CACHE } from '#lib/server/cache.ts';
import { fetchArticlesByIndustry, fetchHeroSlides, type NewsListItem } from '#lib/server/news-list.ts';
import { fetchEvents, type Event } from '#lib/server/events.ts';
import { fetchPressRelease } from '#lib/server/press-release.ts';
import type { PressReleaseData } from '#lib/types.ts';
import type { FeaturedItem } from '#lib/components/features/home/FeaturedReleases.svelte';
import type { PageServerLoad } from './$types';

/** Upcoming events the row can show. The shelf scrolls, but nobody scrolls past this. */
const EVENTS_ROW_LIMIT = 20;

/** The ids the featured band is curated from. Hand-picked, in display order. */
const FEATURED_LEAD_ID = 85791;
const FEATURED_IDS = [107246, 107300, 107292, 107230] as const;

/** Per-release art direction for the curated band, keyed by id. */
const FEATURED_PHOTO_OVERRIDES: Record<number, string[]> = {
	107300: ['/images/city/tokyo.avif'],
	107292: ['/images/city/hong-kong.avif']
};

async function heroBand(): Promise<NewsListItem[]> {
	return fetchHeroSlides(5).catch(() => []);
}

// The events archive runs back to 2007. Only the upcoming handful is drawn, so
// only that handful goes into the page.
async function eventsBand(): Promise<Event[]> {
	const events = await fetchEvents().catch((): Event[] => []);
	const today = new Date().toISOString().slice(0, 10);
	return events
		.filter((e) => e.startDate >= today)
		.sort((a, b) => a.startDate.localeCompare(b.startDate))
		.slice(0, EVENTS_ROW_LIMIT);
}

async function featuredBand(): Promise<{ lead: FeaturedItem; rest: FeaturedItem[] } | null> {
	const [lead, ...rest] = await Promise.all(
		[FEATURED_LEAD_ID, ...FEATURED_IDS].map((id) =>
			fetchPressRelease(id).catch((): PressReleaseData | null => null)
		)
	);
	if (!lead) return null;

	// Only the fields the band draws - not five whole release bodies.
	const toItem = (pr: PressReleaseData): FeaturedItem => ({
		id: pr.id,
		headline: pr.headline,
		dateTime: pr.dateTime,
		companyName: pr.companies?.[0]?.company_Name,
		sector: pr.sector,
		photo: FEATURED_PHOTO_OVERRIDES[pr.id] ?? pr.photo,
		language: pr.language ?? null
	});

	return {
		lead: toItem(lead),
		rest: rest.filter((pr): pr is PressReleaseData => pr !== null).map(toItem)
	};
}

async function categoryBand(apiIndustry: string) {
	const rows = await fetchArticlesByIndustry(apiIndustry).catch((): NewsListItem[] => []);
	// The shelf never shows the summary, so it is not sent.
	return rows.map(({ description: _description, ...card }) => card);
}

export const load: PageServerLoad = async ({ setHeaders }) => {
	const [hero, events, featured, ...rows] = await Promise.all([
		heroBand(),
		eventsBand(),
		featuredBand(),
		...CATEGORIES.map((c) => categoryBand(c.apiIndustry))
	]);

	// A page rendered during an API outage is all empty bands. Caching it would
	// pin that emptiness at the CDN for an hour after the API recovers.
	const anything = hero.length > 0 || events.length > 0 || featured !== null || rows.some((r) => r.length > 0);
	setHeaders(anything ? PAGE_CACHE : NO_STORE);

	return {
		hero,
		events,
		featured,
		categories: CATEGORIES.map((category, i) => ({
			slug: category.slug,
			title: category.title,
			exploreLabel: category.exploreLabel,
			items: rows[i]
		}))
	};
};
