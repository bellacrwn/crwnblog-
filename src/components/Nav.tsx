import Link from 'next/link';
import { CATEGORIES } from '@/lib/categories';
import { getSession } from '@/lib/supabase/server';
import { signOut } from '@/lib/actions';

export default async function Nav() {
  const { user, profile } = await getSession();

  return (
    <header className="sticky top-0 z-40 border-b border-[#1e2230] bg-[#07080d]/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-5 py-3.5">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 text-sm font-black text-black">
            C
          </span>
          <span className="text-lg font-extrabold tracking-tight">
            crwn<span className="text-indigo-400">blog</span>
          </span>
        </Link>

        <nav className="hidden gap-5 text-sm text-slate-400 md:flex">
          {CATEGORIES.map((c) => (
            <Link key={c.slug} href={`/category/${c.slug}`} className="hover:text-white transition">
              {c.name}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2.5 text-sm">
          {profile?.role === 'admin' && (
            <Link href="/admin" className="rounded-lg border border-[#2a2f42] px-3 py-1.5 text-amber-300 hover:bg-white/5">
              Moderation
            </Link>
          )}
          {user ? (
            <>
              <Link href="/write" className="rounded-lg bg-indigo-500 px-3.5 py-1.5 font-semibold text-white hover:bg-indigo-400">
                Write
              </Link>
              <form action={signOut}>
                <button className="rounded-lg px-2.5 py-1.5 text-slate-400 hover:text-white">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" className="rounded-lg bg-indigo-500 px-3.5 py-1.5 font-semibold text-white hover:bg-indigo-400">
              Sign in to post
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
