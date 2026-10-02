import sanitizeHtml from 'sanitize-html';

/** Server-side XSS scrub. NEVER trust editor output from the browser. */
export function cleanHtml(dirty: string) {
  return sanitizeHtml(dirty, {
    allowedTags: [
      'p', 'br', 'strong', 'em', 'u', 's', 'blockquote', 'code', 'pre',
      'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'a', 'img', 'hr', 'figure', 'figcaption',
    ],
    allowedAttributes: {
      a: ['href', 'title'],
      img: ['src', 'alt'],
    },
    allowedSchemes: ['https', 'http', 'mailto'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'nofollow noopener', target: '_blank' }),
      h1: 'h2',
      div: 'p',
      span: 'em',
    },
  });
}

export function toExcerpt(html: string, len = 180) {
  const text = sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > len ? text.slice(0, len).trimEnd() + '…' : text;
}

export function slugify(title: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 70);
  return `${base || 'post'}-${Math.random().toString(36).slice(2, 7)}`;
}

export function readingTime(html: string) {
  const words = sanitizeHtml(html, { allowedTags: [] }).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}
