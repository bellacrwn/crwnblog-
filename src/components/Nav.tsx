import Link from 'next/link';
import { CATEGORIES } from '@/lib/categories';
import { createClient, getSession, isConfigured } from '@/lib/supabase/server';
import { signOut } from '@/lib/actions';
import MobileMenu from '@/components/MobileMenu';

export default async function Nav() {
  const { user, profile } = await getSession();
  const isAdmin = profile?.role === 'admin';

  let pendingCount = 0;
  let rejectedCount = 0;

  if (user && isConfigured()) {
    const supabase = await createClient();
    if (isAdmin) {
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
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#05060a]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3.5 sm:px-5">
        <Link href="/" className="group flex shrink-0 items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 text-sm font-black text-black shadow-md shadow-indigo-500/20 transition group-hover:scale-105">
            C
          </span>
          <div className="flex flex-col">
            <span className="text-lg font-extrabold leading-none tracking-tight text-white">
              crwn<span className="text-indigo-400">blog</span>
            </span>
            <span className="mt-0.5 font-mono text-[9px] uppercase tracking-widest text-slate-500">
              Dispatches
            </span>
          </div>
        </Link>

        <nav aria-label="Editorial desks" className="hidden items-center gap-1 lg:flex">
          {CATEGORIES.map((category) => (
            <Link
              key={category.slug}
              href={`/category/${category.slug}`}
              className="group flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
            >
              <span
                className="h-1.5 w-1.5 rounded-full transition group-hover:scale-125"
                style={{ backgroundColor: category.accent }}
              />
              {category.name}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2 text-sm lg:flex">
          {isAdmin && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3.5 py-1.5 text-xs font-semibold text-amber-300 transition hover:bg-amber-400/20"
            >
              <span>Queue</span>
              {pendingCount > 0 && (
                <span className="rounded-full bg-amber-400 px-1.5 py-0.2 font-mono text-[10px] font-bold text-black">
                  {pendingCount}
                </span>
              )}
            </Link>
          )}

          {user ? (
            <>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.09] bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/[0.07]"
              >
                <span>My Posts</span>
                {rejectedCount > 0 && (
                  <span
                    title="Posts needing revision"
                    className="h-2 w-2 rounded-full bg-rose-400"
                  />
                )}
              </Link>
              <Link
                href="/write"
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:from-indigo-400 hover:to-violet-400"
              >
                <span>+ Write</span>
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  title={`Signed in as ${profile?.username ?? user.email}`}
                  className="rounded-full px-2.5 py-1.5 text-xs text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:from-indigo-400 hover:to-violet-400"
            >
              Sign in to post
            </Link>
          )}
        </div>

        <MobileMenu
          isSignedIn={Boolean(user)}
          username={profile?.username ?? user?.email ?? null}
          isAdmin={isAdmin}
          pendingCount={pendingCount}
          revisionCount={rejectedCount}
        />
      </div>

      <div className="no-scrollbar flex touch-pan-x items-center gap-2 overflow-x-auto overscroll-x-contain border-t border-white/[0.05] px-4 py-2 lg:hidden sm:px-5">
        <Link
          href="/"
          className="shrink-0 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-slate-300"
        >
          All Feed
        </Link>
        {CATEGORIES.map((category) => (
          <Link
            key={category.slug}
            href={`/category/${category.slug}`}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.02] px-3 py-1 text-xs font-medium text-slate-300"
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: category.accent }}
            />
            {category.name}
          </Link>
        ))}
      </div>
    </header>
  );
}
