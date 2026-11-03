# Parity with the Next newsroom

**Reference:** `krischan-acn/newsroom` `main` at `6ccfbab` (2026-10-23). Its last code change is `02d770f` (2026-10-22); only docs changed after that.
**Rule:** every difference between this site and the Next site is listed here with its reason. If `npm run parity` (bench/parity.mjs) shows a difference that is not on this page, it's a bug.

Each Next file is one of:
- **Ported:** same markup, class strings, copy, behaviour and metadata.
- **Superseded:** replaced on purpose by something else here.
- **Dead:** nothing in the Next app imports it; checked, not assumed.
- **Left out:** a decision, recorded below.

## Routes

| Next route | Here | Status |
| --- | --- | --- |
| `/` | `src/routes/+page.*` | Ported |
| `/article/[...segments]` | `src/routes/article/[...segments]/` | Ported |
| `/news` | `src/routes/news/` | Ported |
| `/company/[id]` | `src/routes/company/[id]/` | Ported |
| `/search` | `src/routes/search/` | Ported |
| `/events` | `src/routes/events/` | Ported |
| `/events/[eventId]` | `src/routes/events/[eventId]/` | Ported |
| `/events/[eventId]/press-releases` | `src/routes/events/[eventId]/press-releases/` | Ported as-is (an orphan route: nothing links to it, as in Next) |
| `next.config.ts` redirects | `_redirects` | Ported (served by Cloudflare's static layer, before the Worker runs) |
| `/api/press-release/[id]`, `/api/company-articles/[compID]` | `/api/article/[id]/next` | Superseded: the infinite scroll's lookup moved server-side. The browser version could not work in production (the API sends no CORS headers) and only saw the latest 20 releases. |
| `/api/og/article/[id]` | none | Left out: see "Share images" |
| `/admin`, `/api/ab/*` | none | Left out: see "The A/B tool" |

## Intentional differences, and why

### Platform (the conscious decision to leave Next)

- **Images are served at their original size.** next/image resized and converted them. On Cloudflare that needs Image Transformations on a custom domain; not set up.
- **No loading skeletons.** `loading.tsx`, `Skeleton`, `NavPending` and `HomeSkeletons` are replaced by a thin progress bar during client navigation (`src/routes/+layout.svelte`). Pages arrive as complete HTML, because SvelteKit fills streamed data in on the client, so crawlers would have seen skeletons.
- **Caching:** ISR is replaced by the edge cache in `src/hooks.server.ts` + `worker/index.ts`. Pages are fresh for 1 h and served stale for up to 24 h while refreshing. API responses are also kept in memory with stale-if-error (`src/lib/server/api.ts`).
- **Prefetching:** next/link's viewport prefetch is replaced by SvelteKit's hover preload (`data-sveltekit-preload-data="hover"`).
- **Fonts:** one self-hosted variable Inter, preloaded. Next loaded Inter twice: a render-blocking Google Fonts `@import` plus next/font.
- **The stylesheet is inlined into the HTML** (`inlineStyleThreshold`), because SvelteKit linked it after its script preloads.

### Correctness and security (better than Next; reader-visible only in edge cases)

- **A missing press release returns a real 404** (cached). Next returned 200 + `noindex` (a soft 404, decision 0008's trade-off). API failures return an uncached 503 instead of caching an error.
- **A missing company or event, and a page number past the end, return a 404**, as in Next. But when the API is *unreachable* and nothing local knows the id, the company page returns an uncached 503 where Next returned a 404, so a real company doesn't stay "missing" in the cache after the API recovers.
- **Outage pages are never cached:** an all-empty home page, a partial company profile, an unreachable company feed, an empty `/news` page, an empty events list, an empty sector search. Next cached them for up to an hour.
- **Security headers** on every page (CSP, HSTS, nosniff, frame and referrer policy), plus `_headers` for static files. Next sent none.
- **JSON-LD is escaped**, so API text cannot close the `<script>` tag. Next's was not escaped.
- **Article bodies are sanitised once, on the server**, with sanitize-html, using the same tag and attribute allow-list as Next. Differences:
  - `target=_blank` links get `rel="noopener noreferrer"`.
  - Body images get `loading="lazy"`.
  - Protocol-relative (`//host/...`) URLs are rewritten to `https:` (Next kept them as-is).
- **Every link built from API data goes through `safeUrl()`**, which drops `javascript:` and similar. React blocked those; Svelte does not. Affects event websites, company websites, contact emails and social links.
- **Non-canonical hosts send `X-Robots-Tag: noindex`**, so test deployments are never indexed.
- **Paging parameters are NaN-safe** (`?page=abc` → page 1) and `/news?limit` is clamped to the API's cap of 100. Next sent `Page=NaN` to the API and could never show "Next" above 100.
- **Search, empty state:** bare `/search` (or only unrecognised `?sec=` values) shows 0 results. Next's total heuristic claimed 21 ("Showing 0 of 21 results", "Page 1 of 2" over an empty list).
- **Search sidebar:** a second tick while the first is still loading builds on the first. Next rebuilt the URL from the not-yet-updated props and dropped the first tick. Applying a filter moves keyboard focus to the page (SvelteKit 3's `goto` has no keep-focus option); Next kept focus on the checkbox.
- **A null event photo renders no image**, not a broken one (Next asserted it non-null).
- **The share bar shares the canonical URL**, not whatever was in the address bar when it mounted. In the infinite feed, Next's could be the previous release's URL.
- **The infinite scroll updates the tab title**, finds the next release among the latest 100 releases and the company archive (Next: the latest 20, in the browser), and switches the URL when a release scrolls into view rather than when it is fetched. These are the fixes the 2026-10-22 research note asked for.

### Share images

- Next generated a 1200×630 card per release at `/api/og/article/{id}`.
- Here, a release's share image is its photo, else the issuer's logo, else one fixed card: `static/og-default.png`, which has the same navy and blue as Next's card.
- Generating cards on a Worker needs a WASM renderer (~1–2 MB) and more CPU than the free plan allows (10 ms per request).
- **Zero-cost upgrade, if wanted:** point `og:image` at the Next route on Netlify (`https://acnnewswire.netlify.app/api/og/article/{id}`). It keeps working for as long as that site stays deployed.
- The home page now also has the default card. Next declared a large-image card with no image.

### The A/B tool

- **Left out:** the employee voting overlay, `/admin` and `/api/ab/*`.
- It's inert in Next today: `EXPERIMENTS` is an empty array, no variant CSS exists, and nothing in the markup is tagged.
- On Workers it would need storage (KV or D1, since its file store can't work there) and a cache that varies by cookie (the edge cache is keyed on the URL only).
- Port it when there is an experiment to run.

### Small visual differences, accepted

- **Mega menu:**
  - The panel opens with a 150 ms height transition (Next: 75 ms).
  - Switching menus fades the new one in without fading the old one out first.
  - The open item keeps its blue underline while its panel is open. That goes with the added click and keyboard support (`aria-expanded`), which Next didn't have.
- **The footer logo is the local `/logo.svg`**, not Next's hotlinked Webflow PNG.
- **The error page's "Try again" reloads the page** (Next called React's `reset()`). The error digest line is gone.

## Not ported, because nothing uses it

**Dead in Next (zero importers):**
- `lib/azure.ts`, `lib/region-mapping.ts`, `lib/search-mock-data.ts`
- `services/index.ts` and `services/mock-press-release.ts` (the `USE_MOCK` switch can't be reached)
- `next-intl` (installed, never imported)
- the create-next-app SVGs in `public/`

**Superseded:**
- `services/reading-mode.ts`: replaced by the server-side next-release lookup.
- `lib/metadata.ts`: replaced by `<svelte:head>` in each page.
- `lib/api-timeout.ts`: folded into `api.ts`.
- `lib/utils.ts` `formatDateTime`: now `lib/format.ts`.

**Kept out of the bundle:**
- `services/search.ts` and `data/prefetched-articles.json` (3.6 MB). The search page hasn't read the snapshot since the 2026-09-09 company search. Its one used helper is `taxonomy.sectorLabel`.

**Tooling for the Next repo:**
- `scripts/prefetch-articles.*`, `probe-events-schema.mjs`, `gen-components.mjs`.
- `scripts/build-company-index.mjs` still builds `src/lib/server/data/company-index.json`. Copy the output across after running it in the newsroom repo.

## Carried over unchanged, on purpose (Chesterton's fence)

- **Search results use the legacy `sector-mapper`**, not `taxonomy` (PROJECT-CONTEXT blocker TAXONOMY-STEP3: "held back because it is a visible change").
- **The press release page shell's `sm:px-6` divergence**, and every class string BIBLE lists as known debt.
- **`?reg=`, `?country=` and `?lang=` searches land on the empty state**, exactly as in Next. Region and language are read only to keep checkboxes ticked. Applying them is a product change, not a port.
- **The curated demo events and the orphan event press-releases route** are ported as they are. All four demo events are now past, so "Featured Events" is empty, as it is on Next.
- **Mega menu links and footer links that go nowhere** (`#`, now `#top`) are kept, as in Next.
