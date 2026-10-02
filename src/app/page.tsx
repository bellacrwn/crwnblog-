import Link from 'next/link';
import { createClient, isConfigured } from '@/lib/supabase/server';
import PostCard, { type PostRow } from '@/components/PostCard';
import SetupNotice from '@/components/SetupNotice';
import { CATEGORIES } from '@/lib/categories';

export const revalidate = 30;

export default async function Home() {
  if (!isConfigured()) {
    return (
      <div className="py-10">
        <Hero empty />
        <SetupNotice />
      </div>
    );
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from('posts')
    .select('id,title,slug,excerpt,cover_url,category_slug,published_at,created_at,views,profiles(username)')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(19);

  const posts = (data ?? []) as unknown as PostRow[];
  const [lead, ...rest] = posts;

  return (
    <div>
      <Hero empty={posts.length === 0} />

      {posts.length === 0 ? (
        <div className="panel rounded-2xl p-10 text-center">
          <p className="text-lg font-semibold">No discoveries published yet.</p>
          <p className="mt-2 text-sm text-slate-400">
            The feed is fully live — it fills up the moment the first post is approved.
          </p>
          <Link href="/write" className="mt-5 inline-block rounded-lg bg-indigo-500 px-5 py-2.5 font-semibold text-white hover:bg-indigo-400">
            Be the first to post
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <PostCard post={lead} big />
            </div>
            <div className="grid gap-5">
              {rest.slice(0, 2).map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          </div>

          {rest.length > 2 && (
            <>
              <h2 className="mt-12 mb-4 text-sm font-bold uppercase tracking-widest text-slate-500">
                Latest
              </h2>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {rest.slice(2).map((p) => (
                  <PostCard key={p.id} post={p} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function Hero({ empty }: { empty: boolean }) {
  return (
    <section className="mb-10">
      <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl">
        Recent discoveries in{' '}
        <span className="bg-gradient-to-r from-cyan-300 via-indigo-300 to-rose-300 bg-clip-text text-transparent">
          cyber, tech & culture
        </span>
      </h1>
      <p className="mt-3 max-w-2xl text-slate-400">
        crwnblog is community-written. Anyone with an account can submit a discovery — an
        editor reviews it, then it goes live.
      </p>
      <div className="mt-5 flex flex-wrap gap-2.5">
        {CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href={`/category/${c.slug}`}
            className="rounded-full border px-3.5 py-1.5 text-sm font-medium transition hover:bg-white/5"
            style={{ borderColor: `${c.accent}55`, color: c.accent }}
          >
            {c.name}
          </Link>
        ))}
      </div>
      {empty && <div className="mt-8" />}
    </section>
  );
}
