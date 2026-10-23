// lib/server/press-release.ts
import type { PressReleaseData } from '#lib/types.ts';
import type { NewApiPressRelease, LegacyApiArticle } from './acn-api.types';
import { adaptNewApiPressRelease } from './acn-adapter';
import { API_BASE, apiFetch, apiInit } from './api';

// The current API's press-release endpoint omits language, location, views,
// supplier and the origin URL — all of which the legacy endpoint still returns.
// We read both and merge rather than switch: the new API has the better body,
// images, summary and a proper sectors array, but only the legacy record knows
// the language, and without it every article canonicalises to /article/english/…
// regardless of what it is written in.
//
// Drop this second call once those fields land on /api/Articles/press-release.
const LEGACY_API_BASE = 'https://www.acnnewswire.com/acnnewswireapi';

// Enrichment only, so it gets a short leash rather than the page's time.
const LEGACY_TIMEOUT_MS = 2000;

// This host has been 503 since 2026-08-27. A failure is not cached, so without
// a breaker every uncached article render re-asked the dead host and waited on
// it. After one failure the legacy call is skipped for this long, per instance.
const LEGACY_COOLDOWN_MS = 10 * 60 * 1000;
let legacyDownUntil = 0;

async function fetchLegacyArticle(id: number): Promise<LegacyApiArticle | null> {
	if (Date.now() < legacyDownUntil) return null;
	try {
		const res = await apiFetch(`${LEGACY_API_BASE}/api/v1/News/GetArticleById/${id}`, {
			next: { revalidate: 3600 },
			signal: AbortSignal.timeout(LEGACY_TIMEOUT_MS)
		});
		if (res.status >= 500) legacyDownUntil = Date.now() + LEGACY_COOLDOWN_MS;
		if (!res.ok) return null;
		return (await res.json()) as LegacyApiArticle;
	} catch {
		legacyDownUntil = Date.now() + LEGACY_COOLDOWN_MS;
		return null;
	}
}

/**
 * The API answered 404: the release does not exist. Kept distinct from every
 * other failure because a 404 page is safe to cache at the CDN, while a timeout
 * or a 5xx rendered as "not found" would pin a real article as missing.
 */
export class PressReleaseNotFoundError extends Error {}

export async function fetchPressRelease(id: number): Promise<PressReleaseData> {
	const [res, legacy] = await Promise.all([
		apiFetch(`${API_BASE}/api/Articles/press-release/${id}`, apiInit({ next: { revalidate: 3600 } })),
		fetchLegacyArticle(id)
	]);

	if (res.status === 404) {
		throw new PressReleaseNotFoundError(`Press release ${id} not found`);
	}
	if (!res.ok) {
		throw new Error(`API error ${res.status} for press release ${id}`);
	}

	const raw: NewApiPressRelease = await res.json();
	return adaptNewApiPressRelease(raw, legacy);
}
