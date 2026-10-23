// Environment variables the app reads, and what happens when one is unset.
// Both have working defaults, so a fresh clone runs with no .env at all.

import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	ACN_API_BASE: {
		description: 'The newswire API. Production has always called the host named "development".',
		schema: (value) => (value || 'https://development.acnnewswire.com').replace(/\/+$/, '')
	},
	PUBLIC_SITE_URL: {
		public: true,
		description: 'Canonical origin for canonical links, Open Graph and JSON-LD.',
		schema: (value) => (value || 'https://portal.acnnewswire.com').replace(/\/+$/, '')
	}
});
