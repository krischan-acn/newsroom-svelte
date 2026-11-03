# Moving portal.acnnewswire.com to Cloudflare

Decided 2026-11-03: free Workers plan, measure first; final home is `portal.acnnewswire.com`.

Today `portal` is a DNS-only CNAME to `acnnewswire.netlify.app` in Cloudflare. Nothing here changes that until step 3, and every step can be undone.

## 1. Staging on a subdomain

- Deploy this repo as a Worker (README, "Deploying to Cloudflare").
  - The existing test Worker is at `newsroom-svelte.krischan-balasbas.workers.dev`, but `wrangler.jsonc` names the Worker `acn-newsroom-svelte`.
  - Before the first deploy, check in the dashboard which name the git import uses, and make `wrangler.jsonc` match it. Otherwise a second Worker appears.
- Add a custom domain such as `svelte.acnnewswire.com` (Worker → Settings → Domains & Routes). The edge cache does not work on `workers.dev`.
- Point `bench/targets.json` and `bench/parity.json` (`candidate`) at it, then run:
  - `npm run parity -- --shots`
  - `npm run bench -- --psi`

## 2. The gate: every line must hold

- [ ] **Parity:** `npm run parity` shows no difference that isn't in `docs/parity.md`, and the side-by-side screenshots in `bench/results/shots/` are signed off.
- [ ] **CPU:** in the Worker's observability (or `npx wrangler tail`), no uncached render of any page goes over **10 ms of CPU**.
  - The free plan's limit is a dead page (error 1102), not a slow one. stale-if-error can't help, because the Worker itself fails.
  - If anything is over, switch to Workers Paid ($5/month) *before* cutover.
  - Check the home page first (about 21 API calls, 9 shelves) and a long press release.
- [ ] **Requests per day:** the free plan allows 100,000, and every request counts, cache hits included.
  - Check portal's real daily requests in Netlify analytics.
  - Over about 60,000 means the paid plan, or the fail-open setup below.
- [ ] **Edge cache works:** on the staging domain, a page reports `x-edge-cache: MISS` then `HIT`.
  - `?utm_source=x` hits the same entry.
  - After hovering a link and then hard-reloading it, you get HTML, not JSON.
- [ ] **Rollback is ready:**
  - The Netlify site stays deployed.
  - Lower the TTL on the `portal` record a day ahead.

Worth trying on staging first: attach the Worker by **route** over a **proxied** CNAME to Netlify, with **fail open**. Then a request over the limit, or one the Worker fails, falls through to the Next site instead of erroring.

## 3. Cutover

- Point `portal` at the Worker: custom domain or route, whichever was tested.
  - `PUBLIC_SITE_URL` already defaults to `https://portal.acnnewswire.com`, so canonical links and the noindex guard need no change.
- Watch for the first hours: `x-edge-cache` ratios, errors and CPU in observability.
- **Rollback:** remove the Worker's domain or route and restore the CNAME to `acnnewswire.netlify.app`.

## Afterwards

- **Share images:** to restore per-release cards at no cost, point `og:image` at `https://acnnewswire.netlify.app/api/og/article/{id}` (parity doc, "Share images").
- **Knowledge base:** add a decision recording the move (it supersedes 0009's "stay on Netlify" and 0010's "parked"). Also correct 0009's note that the Next `cloudflare` branch was never pushed: it is on GitHub at `7155a44`.
