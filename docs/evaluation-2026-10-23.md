# SvelteKit evaluation, 2026-10-23 (parked)

**Status: parked.** This repository was built in a day to answer one question: would rewriting the newsroom (portal.acnnewswire.com) in SvelteKit make it meaningfully faster and safer than the Next.js version? The answer was "partly, not yet". Meanwhile, simply redeploying the Next site on Vercel and Netlify fixed most of what had made it feel slow. So the rewrite is on hold while the team decides what to use going forward.

Nothing here is live for readers. The Worker at `newsroom-svelte.krischan-balasbas.workers.dev` is a test deployment.

## What was built

- A port of the site shell (top bar, main nav and mega menus, footer), the home page, and the press release page, including infinite scroll.
  - Company, events, news and search pages were not ported.
  - The employee A/B tool was left out on purpose.
- Deployed to Cloudflare Workers. It's one Worker plus static files, with no storage services. Pages are cached at the edge through the Cache API (`src/hooks.server.ts`).
- A benchmark, `bench/bench.mjs`, that measures any list of deployments the same way.

## Results

Measured 2026-10-23, with the API up and fresh deploys on every host. Lighthouse (the engine behind PageSpeed Insights) ran locally, simulating a mid-range phone.

| Page | Version | Score | First paint | Largest paint | Blocking time | JavaScript |
| --- | --- | --- | --- | --- | --- | --- |
| Home | SvelteKit / Workers | 55 | 3.7 s | 4.6 s | 725 ms | 70 KB |
| Home | Next / Vercel | 60 | 2.0 s | 3.8 s | 1,353 ms | 194 KB |
| Home | Next / Netlify | 51 | 2.3 s | 4.0 s | 2,036 ms | 180 KB |
| Press release | SvelteKit / Workers | 63 | 2.6 s | 4.8 s | 559 ms | 72 KB |
| Press release | Next / Vercel | 51 | 1.9 s | 5.6 s | 1,540 ms | 194 KB |
| Press release | Next / Netlify | 44 | 2.3 s | 6.1 s | 1,728 ms | 180 KB |

On desktop, every version scored in the 70s–90s, and the SvelteKit home page scored highest (96).

Network timings from Asia (`npm run bench`), counting cached pages only:
- Next on Vercel: about 47 ms
- Next on Netlify: about 85 ms
- SvelteKit on Workers: 80–120 ms on a warm connection, but 350–920 ms on a fresh one

### What SvelteKit did better

- About a third of the JavaScript.
- 2–3× less blocking time on phones.
- Pages that keep working when the API fails, by serving the last good copy.
- Security fixes the Next site still lacks:
  - a Content-Security-Policy and the other security headers
  - escaped JSON-LD
  - server-side HTML sanitising with a real parser
  - checked links from API data

### What it did worse, and why

1. **Every request boots the whole app.** The cache lookup lives inside SvelteKit, so even a cache hit has to start about 460 KB of server code first. Each Cloudflare location also keeps its own cache, so misses happen more often than expected. Vercel and Netlify answer cached pages from their CDN without running any code.
2. **Startup runs before the first paint.** One task of about 640 ms (unthrottled) ran before the first paint. SvelteKit preloads its scripts at high priority, so they arrive before the browser has painted. Next loads its scripts at low priority.
3. **The stylesheet is requested last.** SvelteKit puts it after 14 script preloads in `<head>`.

### Fixes identified but not made

1. **A custom Worker entry** that answers cache hits before loading SvelteKit at all.
2. **`inlineStyleThreshold`**, to put the stylesheet (about 13 KB compressed) inside the HTML, which removes the render-blocking request.
3. **Profile the startup task,** then shrink it or move it after the first paint.

Neither framework fixes this: both spend about 3.4 s on style and layout on the simulated phone. That cost comes from the shared page design (the carousel, nine card shelves, a large Tailwind stylesheet). It's the biggest thing between either version and the sub-300 ms goal.

## What the Next site needed instead

Redeploying both Next hosts from current `main` fixed real problems that the stale deploys had been carrying. For example, the Netlify home page's layout shift dropped from 0.886 (severe) to 0.001. Several findings from this work still apply to the Next site and are worth doing there regardless:
- Inter is loaded twice, once from a render-blocking Google Fonts `@import`.
- There are no security headers.
- JSON-LD is unescaped.
- List rows fetch whole press releases to fill in missing logos.

## Picking it back up

1. Read `README.md` (how to run, deploy and benchmark).
2. Make the three fixes above, then re-run `npm run bench` and Lighthouse against the same targets.
3. Check the Workers plan. Decision 0009 in the ACN knowledge base notes the free plan's 10 ms CPU limit per request. Uncached renders worked during this test, but it was not measured.

## Update, 2026-11-03: unparked, ported in full

The rest of the site was ported to parity with the Next app (`docs/parity.md` lists every intentional difference), with Cloudflare as the target. What changed against this write-up:

**A correction.** "Escaped JSON-LD", listed above as a SvelteKit win, wasn't true. `jsonLdScript()` replaced `<` with `'<'`, which in a JS string *is* `<`, so nothing was escaped. It's fixed now (`'\\u003c'`), and confirmed in the rendered HTML.

**Two deploy blockers this test never hit**, because `bench` only fetched full pages and never deployed twice:
- **The cache key mixed pages with navigation data.** SvelteKit strips `/__data.json` from `event.url`, which the cache was keyed on. A hover-preload could store JSON under a page's key, and the next reader would get raw JSON. The key is now built from the raw request URL.
- **Cached pages outlived deploys; their scripts didn't.** After a deploy, cached HTML pointed at hashed files that no longer exist, so pages would run without JavaScript for up to a day. The key now includes the build version, so each deploy starts with a fresh cache, like a Netlify or Vercel purge.

Tracking parameters (`utm_*`, `fbclid`, and so on) are also dropped from the key now.

**The three fixes:**
1. **Custom Worker entry: tried, removed.** Two findings:
   - The Cloudflare adapter writes its generated worker to wrangler's `main` on every build, so a hand-written entry there is overwritten. It would need a second, adapter-only wrangler config (adapter option `config`).
   - wrangler inlined the "lazy" import of SvelteKit at the top level, so `server.init()` still ran when each isolate started.

   The hook already answers hits before any load function or render runs. What's left is SvelteKit's startup per isolate. Making that lazy means uploading SvelteKit as a separate module (wrangler `find_additional_modules`). Do it only if the CPU numbers on the real domain say cold starts matter.
2. **`inlineStyleThreshold`: done.** The layout stylesheet is inlined (about 50 KB raw, 12 KB compressed). The CSP already allowed inline styles, and no hashes are added.
3. **Profiling: not done yet.** It needs the real API and a custom domain; the API host is unreachable from the environment this was built in. It's part of the cutover gate in `docs/cutover.md`.
