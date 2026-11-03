# ACN Newsroom on SvelteKit

A rewrite of the ACN Newswire newsroom (portal.acnnewswire.com) in SvelteKit 3 and Svelte 5, for **Cloudflare Workers**.

- **Status (2026-11-03):** every page of the Next app is ported: home, press release, news, company, search and events. [docs/parity.md](docs/parity.md) lists every intentional difference from the Next site, and why. It's not live yet. Moving `portal` over follows [docs/cutover.md](docs/cutover.md).
- **Left out on purpose:** the employee A/B tool (inert in Next, and it would need storage on Workers) and the generated per-release share images (a static card instead). Both are explained in the parity doc.
- **History:** built as a one-day experiment and parked on 2026-10-23 ([evaluation](docs/evaluation-2026-10-23.md), including the 2026-11-03 update).

## Run it

```bash
npm install
npm run dev        # http://localhost:5173, plain Vite, no edge cache
npm run check      # type check: must be 0 errors
npm run preview    # production build on the real Workers runtime (workerd), http://localhost:8787
npm run deploy     # build and deploy to Cloudflare (needs `npx wrangler login` once)
npm run bench      # benchmark every deployment in bench/targets.json
npm run parity     # diff status, metadata and JSON-LD against the Next site (bench/parity.json); --shots for screenshots
```

No `.env` is needed; both variables have defaults (see `.env.example` and `src/env.ts`). To run against a different API, for example a local mock while the real one is down, set `ACN_API_BASE` (for `npm run preview`, use `npx wrangler dev --var ACN_API_BASE:http://...`).

## Deploying to Cloudflare

Connect this repo under **Workers & Pages → Create → Import a repository**, with:

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Production branch: `main`

Everything else comes from `wrangler.jsonc`: one Worker plus static assets, and nothing else to provision.

Node 22.17 or newer is required (`.nvmrc`); set `NODE_VERSION=22` in the build settings if the default is older. `_redirects` (the old Next redirects) and `_headers` (security headers for static files) sit in the project root; the adapter copies them into the build.

**The edge cache needs a custom domain.** Pages are cached through Cloudflare's Cache API (`src/hooks.server.ts`), and it does nothing on `*.workers.dev`. Every host except the canonical one (`PUBLIC_SITE_URL`) sends `X-Robots-Tag: noindex`, so a test domain is never indexed. Every response carries `x-edge-cache: HIT | STALE | MISS | BYPASS`. If the deployed site only ever reports MISS, add a custom domain such as `svelte.acnnewswire.com` under the Worker's **Settings → Domains & Routes** (the zone is already on Cloudflare).

## Benchmarking

`bench/bench.mjs` hits every deployment in `bench/targets.json` with the same pages. It reports cached and uncached response times, what each host's cache did, where the response was served from, and HTML and JavaScript weight. Add `--psi` for Lighthouse scores from Google PageSpeed Insights (mobile, run from Google's servers). Read the header of that file before trusting a number. Results go to `bench/results/` (gitignored).

Benchmark when the newswire API is up. A cache miss on any deployment is mostly time spent waiting on the API.

## How it differs from the Next app

- **SvelteKit 3:** config lives in `vite.config.ts` (no `svelte.config.js`). Shared code is imported as `#lib/...ts` (not `$lib`). Environment variables are declared in `src/env.ts` and read from `$app/env/private` or `$app/env/public`.
- **Caching:** there is no ISR. Routes state their policy in `CDN-Cache-Control` (`lib/server/cache.ts`). `src/hooks.server.ts` serves it from the edge, with stale-while-revalidate. The key rules are in `lib/server/edge-cache.ts`: the raw URL (navigation data never shares a page's entry), tracking parameters dropped, and the build version included (a deploy starts with a fresh cache). Pages rendered during an API outage are never cached. API responses are also kept in memory (`lib/server/api.ts`), with stale-if-error.
- **Article bodies** are sanitised once, on the server, by `sanitize-html` (`lib/server/sanitize.ts`).
- **Links built from API data** go through `safeUrl()` (`lib/site.ts`): unlike React, Svelte does not block `javascript:` links.
- **Security headers:** a strict Content-Security-Policy is set in `vite.config.ts`, and the rest in `src/hooks.server.ts`. Never put an `onload`/`onerror` handler, a `use:` action or a `{...spread}` directly on an `<img>`. Svelte renders those as inline handlers, which the CSP blocks. Use the container actions in `lib/actions/image.ts`.
- **Images** are served at original size (`lib/components/shared/Img.svelte`). Resizing on Cloudflare needs a custom domain with Image Transformations enabled.
- **Folders:** components follow the newsroom's `common/` → `shared/` → `features/` tiers (see `BIBLE.md` in the newsroom repo).
