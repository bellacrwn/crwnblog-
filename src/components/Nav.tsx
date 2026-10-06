import Link from 'next/link';
import { CATEGORIES, deskVar } from '@/lib/categories';
import { createClient, getSession, isConfigured } from '@/lib/supabase/server';
import { signOut } from '@/lib/actions';
import MobileMenu from '@/components/MobileMenu';

/**
 * Contributor shell bar — deep walnut. Deliberately plainer than the public
 * Masthead: this is a workspace, not the front page.
 */
export default async function Nav() {
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

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-bg/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center gap-5 px-5 py-3">
        <Link href="/" className="group flex shrink-0 items-baseline gap-2">
          <span className="font-masthead text-2xl leading-none text-fg transition group-hover:text-accent">
            crwnblog
          </span>
          <span className="hidden font-mono text-[9px] uppercase tracking-kicker text-faint sm:inline">
            Newsroom
          </span>
        </Link>

        <nav className="hidden items-center gap-4 lg:flex">
          <Link
            href="/"
            className="font-mono text-[10px] font-bold uppercase tracking-kicker text-muted transition hover:text-fg"
          >
            Front Page
          </Link>
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              className="font-mono text-[10px] font-bold uppercase tracking-kicker transition hover:underline"
              style={{ color: deskVar(c.slug) }}
            >
              {c.short}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2 lg:flex">
          {profile?.role === 'admin' && (
            <Link
              href="/admin"
              className="btn btn-ghost px-3 py-1.5 font-mono text-[10px] uppercase tracking-kicker text-accent"
              style={{ borderColor: 'var(--accent)' }}
            >
              Queue{pendingCount > 0 ? ` · ${pendingCount}` : ''}
            </Link>
          )}

          {user ? (
            <>
              <Link
                href="/dashboard"
                className="btn btn-ghost px-3 py-1.5 font-mono text-[10px] uppercase tracking-kicker"
              >
                My Posts
                {rejectedCount > 0 && (
                  <span
                    title="Posts needing revision"
                    className="ml-1 h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: 'var(--bad)' }}
                  />
                )}
              </Link>
              <Link
                href="/write"
                className="btn btn-primary px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-kicker"
              >
                + Write
              </Link>
              <form action={signOut}>
                <button
                  title={`Signed in as ${profile?.username ?? user.email}`}
                  className="px-2 py-1.5 font-mono text-[10px] uppercase tracking-kicker text-faint transition hover:text-fg"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="btn btn-primary px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-kicker"
            >
              Sign in
            </Link>
          )}
        </div>

        <MobileMenu
          theme="walnut"
          isSignedIn={Boolean(user)}
          username={profile?.username ?? null}
          isAdmin={profile?.role === 'admin'}
          pendingCount={pendingCount}
          revisionCount={rejectedCount}
        />
      </div>
    </header>
  );
}
