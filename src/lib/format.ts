// lib/format.ts
import { timezoneFor } from './languages';

/**
 * "Jun 5, 2026 12:14 HKT". The timezone label comes from the article's language
 * through the language registry, so "zh-Hans", "Simplified Chinese" and "zh_CN"
 * all yield CST. Unchanged from the Next app.
 */
export function formatDateTime(raw: string, language?: string | null): string {
	const tz = timezoneFor(language);

	// ISO format: "2026-06-05T12:14:00"
	const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}:\d{2})/);
	if (iso) {
		const [, year, month, day, time] = iso;
		const monthShort = new Date(`${year}-${month}-${day}`).toLocaleString('en', { month: 'short' });
		return `${monthShort} ${Number(day)}, ${year} ${time} ${tz}`;
	}

	// Legacy format: "Thu, 05 Jun 2026 12:14"
	const legacy = raw.match(/\w+,\s+(\d+)\s+(\w+)\s+(\d{4})\s+(\d{2}:\d{2})/);
	if (legacy) {
		const [, day, month, year, time] = legacy;
		const monthShort = new Date(`${month} 1`).toLocaleString('en', { month: 'short' });
		return `${monthShort} ${day}, ${year} ${time} ${tz}`;
	}

	return raw;
}
