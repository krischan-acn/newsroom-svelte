import adapter from '@sveltejs/adapter-cloudflare';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// Deployed to Cloudflare Workers only (wrangler.jsonc). Locally, `npm run dev`
// and `npm run preview` emulate the Workers platform through wrangler.
export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			adapter: adapter(),
			// Put the stylesheet inside the HTML instead of linking it. SvelteKit
			// lists the <link> after its script preloads, so the browser asked for
			// the one render-blocking file last (evaluation 2026-10-23, "What it
			// did worse" #3). ~50 KB raw / ~12 KB compressed today; the threshold
			// sits above that so the whole layout stylesheet is inlined. Cost: a
			// full page load carries the CSS instead of reusing a cached file -
			// worth it for first paint, and client-side navigations don't reload it.
			inlineStyleThreshold: 100_000,
			csp: {
				// Hashes rather than nonces: pages are cached at the edge, and a nonce
				// baked into a cached page would be reused by every visitor.
				mode: 'hash',
				directives: {
					'default-src': ['self'],
					'script-src': ['self'],
					'style-src': ['self', 'unsafe-inline'],
					// Article bodies embed images from wherever the release's author
					// put them, so img-src stays broad; everything else is this origin.
					'img-src': ['self', 'data:', 'https:'],
					'font-src': ['self'],
					'connect-src': ['self'],
					'frame-ancestors': ['self'],
					'form-action': ['self'],
					'base-uri': ['self'],
					'object-src': ['none']
				}
			}
		})
	]
});
