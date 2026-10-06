import Link from 'next/link';
import { CATEGORIES, deskVar } from '@/lib/categories';

/** Public shell footer — a printer's colophon rather than a SaaS footer. */
export default function Colophon() {
  return (
    <footer className="mt-16 border-t-2 border-rule-strong bg-bgalt">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <Link href="/" className="font-masthead text-3xl text-ink">
              crwnblog
            </Link>
            <p className="mt-2 max-w-md font-serif text-sm leading-relaxed text-muted">
              An independent broadsheet on cyber security, technology, society, football and film.
              Every dispatch is filed by a contributor and read by an editor before publication.
            </p>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-kicker text-faint">
              Set in Playfair Display &amp; Libre Caslon Text
            </p>
          </div>

          <div>
            <h3 className="font-mono text-[10px] font-bold uppercase tracking-kicker text-ink">
              Sections
            </h3>
            <ul className="mt-3 space-y-1.5 font-serif text-sm text-muted">
              {CATEGORIES.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/category/${c.slug}`}
                    className="inline-flex items-center gap-2 transition hover:text-accent"
                  >
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: deskVar(c.slug) }}
                    />
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-mono text-[10px] font-bold uppercase tracking-kicker text-ink">
              Contributors
            </h3>
            <ul className="mt-3 space-y-1.5 font-serif text-sm text-muted">
              <li>
                <Link href="/write" className="transition hover:text-accent">
                  File a dispatch →
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="transition hover:text-accent">
                  Writer dashboard
                </Link>
              </li>
              <li>
                <Link href="/login" className="transition hover:text-accent">
                  Contributor sign in
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-rule pt-5 font-mono text-[10px] uppercase tracking-kicker text-faint sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} crwnblog · All rights reserved</p>
          <p>Editor-moderated · HTML scrubbed · RLS-hardened</p>
        </div>
      </div>
    </footer>
  );
}
