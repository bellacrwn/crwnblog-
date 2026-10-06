/**
 * Single source of truth for editorial desks.
 *
 * Adding a desk is a THREE part change — do not skip any of them:
 *   1. This file.
 *   2. `supabase/schema.sql` seed rows (fresh installs).
 *   3. `supabase/migrations/0002_new_desks_and_film_reviews.sql` (existing installs),
 *      which you must run in the Supabase SQL Editor. `posts.category_slug` is a
 *      foreign key to `public.categories(slug)`, so an insert fails until the row exists.
 *
 * Each desk carries two inks: `accent` for cream newsprint, `accentDark` for the
 * walnut contributor shell. Components should prefer `deskVar(slug)` so the colour
 * adapts to whichever shell is rendering it.
 */
export const CATEGORIES = [
  {
    slug: 'cyber',
    name: 'Cyber Discovery',
    short: 'Cyber',
    kind: 'news',
    accent: '#1f4e5f',
    accentDark: '#79b3c9',
    blurb: 'Breaches, exploits, threat research and defence.',
  },
  {
    slug: 'tech',
    name: 'Tech Discovery',
    short: 'Tech',
    kind: 'news',
    accent: '#3d5a3d',
    accentDark: '#8fbc88',
    blurb: 'New tools, hardware, AI and engineering finds.',
  },
  {
    slug: 'celebrity',
    name: 'Celebrity News',
    short: 'Society',
    kind: 'news',
    accent: '#7b2d26',
    accentDark: '#e08a7d',
    blurb: 'Culture, entertainment and who did what.',
  },
  {
    slug: 'football',
    name: 'Football',
    short: 'Football',
    kind: 'news',
    accent: '#8c5a1f',
    accentDark: '#e0b061',
    blurb: 'Matches, transfers, tactics and the business of the game.',
  },
  {
    slug: 'movies',
    name: 'Film & Screen',
    short: 'Screen',
    kind: 'review',
    accent: '#4a3a63',
    accentDark: '#b39ad6',
    blurb: 'Reviews and recommendations, rated out of ten.',
  },
] as const;

export type Category = (typeof CATEGORIES)[number];
export type CategorySlug = Category['slug'];
export type CategoryKind = Category['kind'];

/** Loose string list — use for server-side validation of untrusted form input. */
export const CATEGORY_SLUGS: string[] = CATEGORIES.map((c) => c.slug);

export const isCategorySlug = (value: string): value is CategorySlug =>
  CATEGORIES.some((c) => c.slug === value);

export const catBySlug = (slug: string): Category =>
  CATEGORIES.find((c) => c.slug === slug) ?? CATEGORIES[1];

/** Review desks collect a star rating, release year and poster. */
export const isReviewDesk = (slug: string) => catBySlug(slug).kind === 'review';

/**
 * Theme-aware desk colour. Resolves to the newsprint ink inside .theme-newsprint
 * and to the lighter walnut ink inside .theme-walnut — no conditional in the component.
 */
export const deskVar = (slug: string) => `var(--desk-${catBySlug(slug).slug})`;
