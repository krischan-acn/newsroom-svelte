# ACN Newsroom on SvelteKit (experiment)

A rewrite of the ACN Newswire newsroom (portal.acnnewswire.com) in SvelteKit 3 and Svelte 5, deployed to **Cloudflare Workers**. It exists to be measured against the live Next.js newsroom on Vercel and Netlify. It is not the production site.

**Ported:** the site shell (top bar, main nav and mega menus, footer), the home page, and the press release page, including the infinite scroll. **Not ported:** company, events, news and search pages, so links to those 404 here. The employee A/B tool was deliberately left out.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173, plain Vite, no edge cache
npm run check      # type check: must be 0 errors
npm run preview    # production build on the real Workers runtime (workerd), http://localhost:8787
npm run deploy     # build and deploy to Cloudflare (needs `npx wrangler login` once)
npm run bench      # benchmark every deployment in bench/targets.json
```

No `.env` is needed; both variables have defaults (see `.env.example` and `src/env.ts`). To run against a different API, for example a local mock while the real one is down, set `ACN_API_BASE` (for `npm run preview`, use `npx wrangler dev --var ACN_API_BASE:http://...`).

## Deploying to Cloudflare

Connect this repo under **Workers & Pages → Create → Import a repository**, with:

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Production branch: `main`

Everything else comes from `wrangler.jsonc`: one Worker plus static assets, and nothing else to provision.

**The edge cache may need a custom domain.** Pages are cached through Cloudflare's Cache API (`src/hooks.server.ts`), and community reports say it does nothing on `*.workers.dev`. Every response carries `x-edge-cache: HIT | STALE | MISS | BYPASS`. If the deployed site only ever reports MISS, add a custom domain such as `svelte.acnnewswire.com` under the Worker's **Settings → Domains & Routes** (the zone is already on Cloudflare).

## Benchmarking

`bench/bench.mjs` hits every deployment in `bench/targets.json` with the same pages. It reports cached and uncached response times, what each host's cache did, where the response was served from, and HTML and JavaScript weight. Add `--psi` for Lighthouse scores from Google PageSpeed Insights (mobile, run from Google's servers). Read the header of that file before trusting a number. Results go to `bench/results/` (gitignored).

Benchmark when the newswire API is up. A cache miss on any deployment is mostly time spent waiting on the API.

## How it differs from the Next app

- **SvelteKit 3:** config lives in `vite.config.ts` (no `svelte.config.js`). Shared code is imported as `#lib/...ts` (not `$lib`). Environment variables are declared in `src/env.ts` and read from `$app/env/private` or `$app/env/public`.
- **Caching:** there is no ISR. Routes state their policy in `CDN-Cache-Control` (`lib/server/cache.ts`). `src/hooks.server.ts` serves it from the edge, with stale-while-revalidate. API responses are also kept in memory (`lib/server/api.ts`), with stale-if-error.
- **Article bodies** are sanitised once, on the server, by `sanitize-html` (`lib/server/sanitize.ts`).
- **Links built from API data** go through `safeUrl()` (`lib/site.ts`): unlike React, Svelte does not block `javascript:` links.
- **Security headers:** a strict Content-Security-Policy is set in `vite.config.ts`, and the rest in `src/hooks.server.ts`. Never put an `onload`/`onerror` handler, a `use:` action or a `{...spread}` directly on an `<img>`. Svelte renders those as inline handlers, which the CSP blocks. Use the container actions in `lib/actions/image.ts`.
- **Images** are served at original size (`lib/components/shared/Img.svelte`). Resizing on Cloudflare needs a custom domain with Image Transformations enabled.
- **Folders:** components follow the newsroom's `common/` → `shared/` → `features/` tiers (see `BIBLE.md` in the newsroom repo).
