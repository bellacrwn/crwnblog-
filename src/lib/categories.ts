export const CATEGORIES = [
  { slug: 'cyber', name: 'Cyber Discovery', accent: '#22d3ee', blurb: 'Breaches, exploits, threat research and defence.' },
  { slug: 'tech', name: 'Tech Discovery', accent: '#a78bfa', blurb: 'New tools, hardware, AI and engineering finds.' },
  { slug: 'celebrity', name: 'Celebrity News', accent: '#fb7185', blurb: 'Culture, entertainment and who did what.' },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]['slug'];

export const catBySlug = (slug: string) =>
  CATEGORIES.find((c) => c.slug === slug) ?? CATEGORIES[1];
