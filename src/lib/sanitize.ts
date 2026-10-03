import sanitizeHtml from 'sanitize-html';

const MAX_HTML_INPUT_LENGTH = 100_000;

/** Server-side XSS scrub. NEVER trust editor output from the browser or DB. */
export function cleanHtml(dirty: string) {
  const bounded = (dirty ?? '').slice(0, MAX_HTML_INPUT_LENGTH);
  return sanitizeHtml(bounded, {
    allowedTags: [
      'p', 'br', 'strong', 'em', 'u', 's', 'blockquote', 'code', 'pre',
      'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'a', 'img', 'hr', 'figure', 'figcaption',
    ],
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
      img: ['src', 'alt', 'loading'],
    },
    allowedSchemes: ['https', 'http', 'mailto'],
    allowedSchemesByTag: {
      a: ['https', 'http', 'mailto'],
      img: ['https', 'http'],
    },
    allowProtocolRelative: false,
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', {
        rel: 'nofollow noopener noreferrer',
        target: '_blank',
      }),
      img: sanitizeHtml.simpleTransform('img', {
        loading: 'lazy',
      }),
      h1: 'h2',
      div: 'p',
      span: 'em',
    },
  });
}

/**
 * Validates and normalizes an external HTTP(S) URL (e.g., cover_url).
 * Returns null if the URL is invalid, uses a dangerous scheme (javascript:, data:),
 * or contains characters that could break out of CSS url("...") contexts.
 */
export function sanitizeUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 2048) return null;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return null;
    }
    if (parsed.username || parsed.password) {
      return null;
    }
    // Encode characters that could break out of CSS url("...") or HTML attributes
    return parsed.toString().replace(/["'()\\]/g, (ch) => encodeURIComponent(ch));
  } catch {
    return null;
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,98}[a-z0-9]$/;

export function isValidUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function isValidSlug(value: string): boolean {
  return SLUG_RE.test(value);
}

export function toExcerpt(html: string, len = 180) {
  const text = sanitizeHtml((html ?? '').slice(0, MAX_HTML_INPUT_LENGTH), {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > len ? text.slice(0, len).trimEnd() + '…' : text;
}

export function slugify(title: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base || 'post'}-${suffix}`;
}

export function readingTime(html: string) {
  const words = sanitizeHtml((html ?? '').slice(0, MAX_HTML_INPUT_LENGTH), {
    allowedTags: [],
    allowedAttributes: {},
  })
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}
