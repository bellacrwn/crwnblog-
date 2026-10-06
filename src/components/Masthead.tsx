import Link from 'next/link';
import { CATEGORIES, deskVar } from '@/lib/categories';
import { createClient, getSession, isConfigured } from '@/lib/supabase/server';
import { signOut } from '@/lib/actions';
import { dateline, editionNumber, romanVolume } from '@/lib/format';
import MobileMenu from '@/components/MobileMenu';

/**
 * Public shell: the nameplate, dateline and section index.
 * Reads on cream paper with brown ink — the contributor area uses <Nav /> instead.
 */
export default async function Masthead() {
  const { user, profile } = await getSession();

  let pendingCount = 0;
  let rejectedCount = 0;

  if (user && isConfigured()) {
    const supabase = await createClient();
    if (profile?.role === 'admin') {
      const { count } = await supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');
      pendingCount = count ?? 0;
    }
    const { count: rCount } = await supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', user.id)
      .eq('status', 'rejected');
    rejectedCount = rCount ?? 0;
  }

  const now = new Date();

  return (
    <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur-sm">
      {/* Dateline bar */}
      <div className="rule border-b">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-1.5 font-mono text-[10px] uppercase tracking-kicker">
          <span className="hidden shrink-0 text-faint sm:inline">
            Vol. {romanVolume(1)} · No. {editionNumber(now)}
          </span>
          <span className="flex-1 text-center text-muted">{dateline(now)}</span>
          <nav className="hidden shrink-0 items-center gap-3 lg:flex">
            {profile?.role === 'admin' && (
              <Link href="/admin" className="text-accent hover:underline">
                Queue{pendingCount > 0 ? ` (${pendingCount})` : ''}
              </Link>
            )}
            {user ? (
              <>
                <Link href="/dashboard" className="text-muted hover:text-ink">
                  My Posts
                </Link>
                <Link href="/write" className="text-accent hover:underline">
                  Write
                </Link>
                <form action={signOut}>
                  <button
                    title={`Signed in as ${profile?.username ?? user.email}`}
                    className="text-faint transition hover:text-ink"
                  >
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <Link href="/login" className="text-accent hover:underline">
                Contributor sign in
              </Link>
            )}
          </nav>
        </div>
      </div>

      {/* Nameplate */}
      <div className="border-b border-rule">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 pb-3 pt-5">
          <div className="flex-1 text-center">
            <div className="mx-auto mb-1 h-px w-24 bg-rule-mid" />
            <Link href="/" className="group inline-block">
              <h1 className="font-masthead text-5xl leading-none text-ink transition-colors group-hover:text-accent sm:text-7xl">
                crwnblog
              </h1>
            </Link>
            <p className="mt-1.5 font-serif text-[11px] italic tracking-wide text-muted sm:text-xs">
              Community-filed dispatches · verified by the desk before they reach the front page
            </p>
          </div>

          {/* Mobile trigger sits beside the nameplate; the drawer carries search + sections */}
          <MobileMenu
            theme="newsprint"
            isSignedIn={Boolean(user)}
            username={profile?.username ?? null}
            isAdmin={profile?.role === 'admin'}
            pendingCount={pendingCount}
            revisionCount={rejectedCount}
          />
        </div>
      </div>

      {/* Section index */}
      <div className="rule-double hidden lg:block">
        <div className="mx-auto flex max-w-6xl items-center gap-5 px-5 py-2">
          <nav className="flex flex-1 items-center gap-1">
            <Link
              href="/"
              className="shrink-0 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-kicker text-ink transition hover:text-accent"
            >
              Front Page
            </Link>
            <span className="shrink-0 text-rule-mid" aria-hidden>
              ·
            </span>
            {CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                href={`/category/${c.slug}`}
                className="shrink-0 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-kicker transition hover:underline"
                style={{ color: deskVar(c.slug) }}
              >
                {c.short}
              </Link>
            ))}
          </nav>

          <form action="/" method="get" className="shrink-0">
            <label htmlFor="masthead-search" className="sr-only">
              Search the archive
            </label>
            <input
              id="masthead-search"
              type="search"
              name="q"
              placeholder="Search the archive…"
              className="w-44 border border-rule-mid bg-panel-inset px-2.5 py-1 font-mono text-[11px] text-ink outline-none placeholder:text-faint focus:border-accent"
            />
          </form>
        </div>
      </div>
    </header>
  );
}
