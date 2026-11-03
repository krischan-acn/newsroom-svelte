// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
	namespace App {
		interface PageData {
			/** Overrides the layout's `index, follow` robots meta (e.g. search is noindex). */
			robots?: string;
		}
	}
}

export {};
