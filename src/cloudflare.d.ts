// The one piece of the Workers runtime module this app uses (src/hooks.server.ts).
// Declared here rather than pulling in @cloudflare/workers-types, whose global
// Request/Response/Cache types clash with the DOM ones Svelte components use.
declare module 'cloudflare:workers' {
	/** Keeps the Worker alive until `promise` settles, after the response is sent. */
	export function waitUntil(promise: Promise<unknown>): void;
}
