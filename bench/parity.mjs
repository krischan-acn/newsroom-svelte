// bench/parity.mjs - does the Svelte site say the same things as the Next site?
//
//   node bench/parity.mjs                      diff every path in bench/parity.json
//   node bench/parity.mjs --candidate URL      override the candidate base (e.g. a staging domain)
//   node bench/parity.mjs --shots              also screenshot both sites, 1440px and 390px wide
//
// For each path it fetches the reference (Next) and the candidate (Svelte) and
// compares what a crawler or a share preview sees:
//   status (after redirects are NOT followed - a 308 must stay a 308), the
//   redirect target, <title>, meta description, robots, canonical, og:* /
//   twitter:* / article:* tags, and each JSON-LD block's @type and keys.
// Origins are stripped from URLs before comparing, so a different canonical
// host does not drown out real differences.
//
// Every difference it prints must be listed in docs/parity.md as intentional,
// or it is a bug. Screenshots are for a person to compare side by side - live
// data differs between fetches, so nothing is pixel-diffed.
//
// Results go to bench/results/parity-<timestamp>.md (gitignored).

import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const config = JSON.parse(fs.readFileSync(path.join(here, 'parity.json'), 'utf8'));
const arg = (name) => {
	const i = process.argv.indexOf(name);
	return i > -1 ? process.argv[i + 1] : undefined;
};
const reference = config.reference;
const candidate = { ...config.candidate, base: arg('--candidate') ?? config.candidate.base };
const withShots = process.argv.includes('--shots');

const decode = (s) =>
	s
		.replace(/&amp;/g, '&')
		.replace(/&quot;/g, '"')
		.replace(/&#39;|&#x27;/g, "'")
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.trim();

/** Strips the origin from absolute URLs on either site, so hosts do not count as differences. */
function normalise(value) {
	return value.replace(/https?:\/\/(www\.|portal\.)?acnnewswire\.com|https?:\/\/[a-z0-9.-]+\.(vercel\.app|workers\.dev|netlify\.app)/gi, '');
}

function attrs(tag) {
	const out = {};
	for (const m of tag.matchAll(/([a-zA-Z:-]+)\s*=\s*("([^"]*)"|'([^']*)')/g)) out[m[1].toLowerCase()] = decode(m[3] ?? m[4] ?? '');
	return out;
}

/** What a crawler reads from the page, as a flat { key: value } map. */
function extract(html) {
	const head = html.split(/<\/head>/i)[0] ?? html;
	const facts = {};
	const title = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
	if (title) facts.title = decode(title[1]);
	for (const m of head.matchAll(/<meta\b[^>]*>/gi)) {
		const a = attrs(m[0]);
		const key = a.property ?? a.name;
		if (!key || !/^(description|robots|og:|twitter:|article:)/.test(key) || key === 'og:site_name') continue;
		const k = `meta ${key}`;
		facts[k] = facts[k] ? `${facts[k]} | ${normalise(a.content ?? '')}` : normalise(a.content ?? '');
	}
	for (const m of head.matchAll(/<link\b[^>]*>/gi)) {
		const a = attrs(m[0]);
		if (a.rel === 'canonical') facts.canonical = normalise(a.href ?? '');
	}
	let n = 0;
	for (const m of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
		try {
			const data = JSON.parse(m[1]);
			facts[`jsonld#${n++}`] = `${data['@type']}: ${Object.keys(data).sort().join(',')}`;
		} catch {
			facts[`jsonld#${n++}`] = 'UNPARSABLE';
		}
	}
	return facts;
}

async function probe(base, p) {
	try {
		const res = await fetch(base + p, { redirect: 'manual', headers: { 'user-agent': 'acn-parity-check' } });
		const facts = { status: String(res.status) };
		const location = res.headers.get('location');
		if (location) facts.redirect = normalise(new URL(location, base + p).pathname);
		if ((res.headers.get('content-type') ?? '').includes('text/html')) Object.assign(facts, extract(await res.text()));
		return facts;
	} catch (e) {
		return { status: `ERROR ${e.message}` };
	}
}

const lines = [`# Parity: ${reference.name} vs ${candidate.name}`, '', `${new Date().toISOString()}`, ''];
let differing = 0;

for (const p of config.paths) {
	const [ref, cand] = await Promise.all([probe(reference.base, p), probe(candidate.base, p)]);
	const keys = [...new Set([...Object.keys(ref), ...Object.keys(cand)])].sort();
	const diffs = keys.filter((k) => ref[k] !== cand[k]);
	console.log(`${diffs.length ? 'DIFF' : 'same'}  ${p}  (${ref.status} / ${cand.status})`);
	if (!diffs.length) continue;
	differing++;
	lines.push(`## ${p}`, '', `| | ${reference.name} | ${candidate.name} |`, '| --- | --- | --- |');
	for (const k of diffs) {
		const cell = (v) => (v === undefined ? '_(none)_' : String(v).replace(/\|/g, '\\|').slice(0, 300));
		lines.push(`| ${k} | ${cell(ref[k])} | ${cell(cand[k])} |`);
		console.log(`      ${k}\n        ref:  ${ref[k]}\n        cand: ${cand[k]}`);
	}
	lines.push('');
}

lines.splice(4, 0, `${differing} of ${config.paths.length} paths differ.`, '');

if (withShots) {
	const { chromium } = await import('playwright');
	const browser = await chromium.launch();
	const dir = path.join(here, 'results', 'shots');
	fs.mkdirSync(dir, { recursive: true });
	for (const width of [1440, 390]) {
		const page = await browser.newPage({ viewport: { width, height: 900 } });
		for (const p of config.paths) {
			for (const [label, base] of [['next', reference.base], ['svelte', candidate.base]]) {
				const file = `${p.replace(/[^a-z0-9]+/gi, '_') || 'home'}-${width}-${label}.png`;
				try {
					await page.goto(base + p, { waitUntil: 'networkidle', timeout: 30000 });
					await page.screenshot({ path: path.join(dir, file), fullPage: true });
				} catch (e) {
					console.log(`shot failed: ${label} ${p} ${width}: ${e.message}`);
				}
			}
		}
		await page.close();
	}
	await browser.close();
	lines.push(`Screenshots: bench/results/shots/`);
}

fs.mkdirSync(path.join(here, 'results'), { recursive: true });
const out = path.join(here, 'results', `parity-${new Date().toISOString().replace(/[:.]/g, '-')}.md`);
fs.writeFileSync(out, lines.join('\n'));
console.log(`\n${differing} of ${config.paths.length} paths differ. Written to ${path.relative(process.cwd(), out)}`);
