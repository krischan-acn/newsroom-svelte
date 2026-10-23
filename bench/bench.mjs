// bench/bench.mjs - the same pages, measured on every deployment.
//
//   npm run bench                 network timings and page weight
//   npm run bench -- --psi        also Lighthouse, via Google PageSpeed Insights
//   npm run bench -- --targets other.json
//
// Deployments and pages live in bench/targets.json (or the --targets file). Results are printed and
// saved to bench/results/<timestamp>.{json,md}.
//
// What is measured, per deployment and page:
//   warm   - TTFB over WARM_RUNS ordinary requests. After the first, these are
//            what a reader gets most of the time: the host's cached copy.
//   cold   - TTFB over COLD_RUNS requests with a unique query string, which most
//            caches treat as a new page: the full render, API calls included.
//            Some caches ignore the query string (the `cache` column shows it).
//   cache  - what each host's own cache header said for the warm requests.
//   pop    - where the response came from (Cloudflare colo / Vercel region).
//   html   - the page as sent, uncompressed.
//   js     - every script the page loads up front, uncompressed, and how many.
//   psi    - (with --psi) Lighthouse on a throttled mid-range phone, run by
//            Google's servers, so your own connection does not skew it.
//
// TTFB is measured from this machine, so it includes your distance to each
// host's nearest edge. Compare deployments within one run, not across runs on
// different networks.
//
// Set PSI_KEY to a Google API key if PageSpeed Insights rate-limits you.

import fs from 'node:fs';
import path from 'node:path';

const WARM_RUNS = 15;
const COLD_RUNS = 5;
const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const targetsArg = process.argv.indexOf('--targets');
const targetsFile = targetsArg > -1 ? path.resolve(process.argv[targetsArg + 1]) : path.join(here, 'targets.json');
const { targets, paths } = JSON.parse(fs.readFileSync(targetsFile, 'utf8'));
const withPsi = process.argv.includes('--psi');

const pct = (values, p) => {
	const sorted = [...values].sort((a, b) => a - b);
	return Math.round(sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))]);
};

/** The cache verdict, in whichever header this host uses. */
function cacheStatus(headers) {
	return (
		headers.get('x-edge-cache') ?? // this app on Cloudflare (src/hooks.server.ts)
		headers.get('x-vercel-cache') ??
		headers.get('x-nextjs-cache') ??
		headers.get('cache-status')?.match(/(hit|miss|stale|fwd=\w+)/i)?.[0] ?? // Netlify
		headers.get('cf-cache-status') ??
		'?'
	).toUpperCase();
}

/** Where the response was served from. */
function pop(headers) {
	const ray = headers.get('cf-ray');
	if (ray) return `cf:${ray.split('-').pop()}`;
	const vercel = headers.get('x-vercel-id');
	if (vercel) return `vercel:${vercel.split('::')[0]}`;
	if (headers.get('x-nf-request-id')) return 'netlify';
	return '?';
}

async function timed(url) {
	const start = performance.now();
	const res = await fetch(url, { headers: { 'user-agent': 'acn-newsroom-bench' } });
	const ttfb = performance.now() - start;
	const body = await res.text();
	return { status: res.status, ttfb, headers: res.headers, body };
}

/** Scripts the page loads up front: <script src> and <link rel=modulepreload>. */
async function scriptWeight(base, html) {
	const urls = new Set();
	for (const m of html.matchAll(/<script[^>]+src="([^"]+)"/g)) urls.add(m[1]);
	for (const m of html.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="([^"]+)"/g)) urls.add(m[1]);
	for (const m of html.matchAll(/<link[^>]+href="([^"]+)"[^>]+rel="modulepreload"/g)) urls.add(m[1]);
	let bytes = 0;
	for (const u of urls) {
		const res = await fetch(new URL(u, base));
		bytes += (await res.arrayBuffer()).byteLength;
	}
	return { files: urls.size, kb: Math.round(bytes / 1024) };
}

async function psi(url) {
	const api = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
	api.searchParams.set('url', url);
	api.searchParams.set('strategy', 'mobile');
	api.searchParams.set('category', 'performance');
	if (process.env.PSI_KEY) api.searchParams.set('key', process.env.PSI_KEY);
	const res = await fetch(api);
	if (!res.ok) return { error: `PSI ${res.status}` };
	const { lighthouseResult: lh } = await res.json();
	const ms = (id) => Math.round(lh.audits[id].numericValue);
	return {
		score: Math.round(lh.categories.performance.score * 100),
		fcp: ms('first-contentful-paint'),
		lcp: ms('largest-contentful-paint'),
		tbt: ms('total-blocking-time'),
		cls: Number(lh.audits['cumulative-layout-shift'].numericValue.toFixed(3)),
		si: ms('speed-index'),
		weightKb: Math.round(lh.audits['total-byte-weight'].numericValue / 1024)
	};
}

const rows = [];
for (const target of targets) {
	for (const page of paths) {
		const url = new URL(page, target.base).toString();
		process.stdout.write(`${target.name.padEnd(22)} ${page.padEnd(20)} `);
		try {
			await timed(url); // connection and TLS set-up, and a cache fill: not counted

			const warm = [];
			const statuses = {};
			let last;
			for (let i = 0; i < WARM_RUNS; i++) {
				last = await timed(url);
				warm.push(last.ttfb);
				const s = cacheStatus(last.headers);
				statuses[s] = (statuses[s] ?? 0) + 1;
			}

			const cold = [];
			for (let i = 0; i < COLD_RUNS; i++) {
				const bust = new URL(url);
				bust.searchParams.set('bench', `${Date.now()}${i}`);
				cold.push((await timed(bust)).ttfb);
			}

			const js = await scriptWeight(url, last.body);
			const row = {
				target: target.name,
				page,
				status: last.status,
				pop: pop(last.headers),
				cache: Object.entries(statuses).map(([s, n]) => `${s}x${n}`).join(' '),
				warmP50: pct(warm, 50),
				warmP95: pct(warm, 95),
				coldP50: pct(cold, 50),
				coldP95: pct(cold, 95),
				htmlKb: Math.round(Buffer.byteLength(last.body) / 1024),
				jsFiles: js.files,
				jsKb: js.kb
			};
			if (withPsi) row.psi = await psi(url);
			rows.push(row);
			console.log(`warm ${row.warmP50}ms  cold ${row.coldP50}ms  ${row.cache}`);
		} catch (err) {
			rows.push({ target: target.name, page, error: String(err) });
			console.log(`FAILED: ${err}`);
		}
	}
}

const header =
	'| Deployment | Page | Status | Served from | Cache (warm) | Warm p50 / p95 | Cold p50 / p95 | HTML | JS |' +
	(withPsi ? ' Lighthouse | FCP | LCP | TBT | CLS | Page weight |' : '');
const divider = header.replace(/[^|]+/g, '---');
const lines = rows.map((r) => {
	if (r.error) return `| ${r.target} | ${r.page} | failed: ${r.error} |`;
	let line = `| ${r.target} | ${r.page} | ${r.status} | ${r.pop} | ${r.cache} | ${r.warmP50} / ${r.warmP95} ms | ${r.coldP50} / ${r.coldP95} ms | ${r.htmlKb} KB | ${r.jsKb} KB (${r.jsFiles}) |`;
	if (withPsi) {
		const p = r.psi ?? {};
		line += p.error
			? ` ${p.error} | | | | | |`
			: ` ${p.score} | ${p.fcp} ms | ${p.lcp} ms | ${p.tbt} ms | ${p.cls} | ${p.weightKb} KB |`;
	}
	return line;
});
const table = [header, divider, ...lines].join('\n');
console.log(`\n${table}\n`);

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outDir = path.join(here, 'results');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, `${stamp}.json`), JSON.stringify(rows, null, 2));
fs.writeFileSync(path.join(outDir, `${stamp}.md`), `# Benchmark ${new Date().toISOString()}\n\n${table}\n`);
console.log(`Saved bench/results/${stamp}.{json,md}`);
