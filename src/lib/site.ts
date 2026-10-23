// lib/site.ts
import { PUBLIC_SITE_URL } from '$app/env/public';

/**
 * Canonical origin for <link rel="canonical">, Open Graph and JSON-LD.
 *
 * The Next app defaulted this to www.acnnewswire.com, where /article paths 404 -
 * so every canonical link pointed search engines at a dead page unless the env
 * var happened to be set. The default (src/env.ts) is now the site that
 * actually serves them.
 */
export const SITE_URL = PUBLIC_SITE_URL;
export const SITE_NAME = 'ACN Newswire';
export const SITE_DESCRIPTION = 'The top Asian News Network for 20 years and counting.';

/**
 * A JSON-LD <script> block, safe to drop into {@html}.
 *
 * JSON.stringify does not escape `<`, so a value containing `</script>` would
 * close the tag and let the rest of the string run as markup. Several of the
 * fields that go in here (dates, image filenames) arrive from the API
 * unsanitised. Escaping `<` as \u003c is invisible to a JSON parser and closes
 * that hole for every field at once.
 */
export function jsonLdScript(data: unknown): string {
	const json = JSON.stringify(data).replace(/</g, '\u003c');
	return `<script type="application/ld+json">${json}</script>`;
}

/**
 * An API-supplied URL that is safe to put in an href, or undefined.
 *
 * React 19 quietly refused `javascript:` URLs in href. Svelte does not, so every
 * link built from API data - event sites, company websites, social profiles -
 * goes through here. Bare hostnames ("www.example.com") get https:// prepended,
 * which is what the old Company component did by hand.
 */
export function safeUrl(raw: string | null | undefined): string | undefined {
	const value = raw?.trim();
	if (!value) return undefined;
	const candidate = /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value.replace(/^\/+/, '')}`;
	try {
		const url = new URL(candidate);
		return url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'mailto:'
			? url.href
			: undefined;
	} catch {
		return undefined;
	}
}
