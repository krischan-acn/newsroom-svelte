// lib/server/sanitize.ts
//
// Everything that cleans API text before it reaches a page.
//
// The plain-text helpers are the Next app's, unchanged: regex entity-decode and
// tag-strip, for headlines, summaries and names that Svelte then escapes again
// on output.
//
// The article BODY is different. The Next app sanitised it twice - a regex pass
// during SSR and DOMPurify after hydration - because DOMPurify had no DOM on the
// server. That split had two costs: the server HTML, which the browser runs
// first, was only ever protected by the regex; and swapping in DOMPurify's
// output after mount repainted the largest element on the page. Here the body is
// cleaned ONCE, on the server, by sanitize-html, which uses a real HTML parser
// (htmlparser2) and needs no DOM. The browser receives finished markup and does
// nothing to it.

import sanitizeHtml from 'sanitize-html';

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&apos;/g, "'")
    .replace(/&ldquo;/g, '“')
    .replace(/&rdquo;/g, '”')
    .replace(/&lsquo;/g, '‘')
    .replace(/&rsquo;/g, '’')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '…')
    .replace(/&copy;/g, '©')
    .replace(/&reg;/g, '®')
    .replace(/&trade;/g, '™')
    .replace(/&bull;/g, '•')
    .replace(/&middot;/g, '·')
    .replace(/&laquo;/g, '«')
    .replace(/&raquo;/g, '»')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)));
}

// Strip all HTML tags (no DOM needed — just regex, safe for plain text fields)
function stripTags(text: string): string {
  return text.replace(/<[^>]*>/g, '');
}

// Strip all tags except safe inline formatting
function stripUnsafeTags(text: string): string {
  return text.replace(/<(?!\/?(?:em|strong|b|i)\b)[^>]*>/gi, '');
}

export function sanitizeText(text: string | null | undefined): string {
  if (!text) return '';
  return stripTags(decodeHtmlEntities(text)).trim();
}

export function sanitizeHeadline(text: string | null | undefined): string {
  if (!text) return '';
  return stripUnsafeTags(decodeHtmlEntities(text)).trim();
}

// ---------------------------------------------------------------------------
// Article body HTML
// ---------------------------------------------------------------------------

/** The allowlist carried over from the Next app, so bodies render the same. */
const ARTICLE_ALLOWED_TAGS = [
	'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
	'ul', 'ol', 'li', 'a', 'img', 'figure', 'figcaption', 'div', 'span',
	'blockquote', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
];

const ARTICLE_ALLOWED_ATTR = [
	'src', 'alt', 'class', 'href', 'target', 'rel',
	'width', 'height', 'align', 'border', 'cellpadding', 'cellspacing',
];

const BODY_OPTIONS: sanitizeHtml.IOptions = {
	allowedTags: ARTICLE_ALLOWED_TAGS,
	// `loading` is set by transformTags below, so it has to be allowed on img.
	allowedAttributes: { '*': ARTICLE_ALLOWED_ATTR, img: ['loading'] },
	// javascript:, vbscript:, file: and friends are dropped however they are
	// spelled; sanitize-html decodes entities and whitespace before comparing.
	allowedSchemes: ['http', 'https', 'mailto'],
	allowedSchemesByTag: { img: ['http', 'https', 'data'] },
	allowProtocolRelative: false,
	// script/style/iframe and the rest go WITH their content, not just the tags.
	disallowedTagsMode: 'discard',
	transformTags: {
		// A release linking out in a new tab must not hand the opened page a
		// handle on this one.
		a: (tagName, attribs) => ({
			tagName,
			attribs:
				attribs.target === '_blank'
					? { ...attribs, rel: 'noopener noreferrer' }
					: attribs,
		}),
		// Body images below the fold should not compete with the page's own.
		img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: 'lazy' } }),
	},
};

/** The one sanitiser for article body HTML. Runs on the server only. */
export function sanitizeArticleHtml(html: string | null | undefined): string {
	if (!html) return '';
	return sanitizeHtml(html, BODY_OPTIONS);
}
