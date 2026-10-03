import Link from 'next/link';
import { createClient, isConfigured } from '@/lib/supabase/server';
import PostCard, { type PostRow } from '@/components/PostCard';
import SetupNotice from '@/components/SetupNotice';
import { CATEGORIES } from '@/lib/categories';

export const revalidate = 30;

export default async function Home({
  searchParams,
}: {
  searchParams?: { q?: string };
}) {
  const query = (searchParams?.q ?? '').trim().slice(0, 80);

  if (!isConfigured()) {
    return (
      <div className="space-y-12 py-4">
        <Hero query="" />
        <CategoryShowcase />
        <SetupNotice />
      </div>
    );
  }

  const supabase = await createClient();
  let dbQuery = supabase
    .from('posts')
    .select(
      'id,title,slug,excerpt,cover_url,category_slug,published_at,created_at,views,profiles(username)'
    )
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(19);

  if (query) {
    const escaped = query.replace(/[%_]/g, '');
    if (escaped) {
      dbQuery = dbQuery.or(`title.ilike.%${escaped}%,excerpt.ilike.%${escaped}%`);
    }
  }

  const { data } = await dbQuery;
  const posts = (data ?? []) as unknown as PostRow[];
  const [lead, ...rest] = posts;

  return (
    <div className="space-y-12">
      <Hero query={query} />

      {query && (
        <div className="flex items-center justify-between rounded-xl border border-indigo-500/25 bg-indigo-500/10 px-4 py-3 text-sm">
          <p className="text-slate-200">
            Showing results for <span className="font-semibold text-white">&ldquo;{query}&rdquo;</span> ({posts.length})
          </p>
          <Link href="/" className="text-xs font-semibold text-indigo-300 hover:text-white">
            Clear filter ✕
          </Link>
        </div>
      )}

      {posts.length === 0 ? (
        <div className="panel rounded-3xl p-12 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-400/30 bg-indigo-500/10 font-mono text-lg text-indigo-300">
            ✦
          </span>
          <p className="mt-4 font-display text-3xl text-white">
            {query ? 'No matching dispatches found.' : 'No discoveries published yet.'}
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
            {query
              ? 'Try another search term or browse all categories below.'
              : 'The newsroom feed is live — it populates the moment the first community dispatch is approved by an editor.'}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            {query && (
              <Link
                href="/"
                className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/5"
              >
                Reset search
              </Link>
            )}
            <Link
              href="/write"
              className="rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-400 hover:to-violet-400"
            >
              Submit a discovery →
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <PostCard post={lead} big />
            </div>
            <div className="grid gap-6">
              {rest.slice(0, 2).map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          </div>

          {rest.length > 2 && (
            <section>
              <div className="mb-5 flex items-center gap-3">
                <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-slate-400">
                  Latest Dispatches
                </h2>
                <div className="h-px flex-1 bg-white/[0.07]" />
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {rest.slice(2).map((p) => (
                  <PostCard key={p.id} post={p} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <CategoryShowcase />
    </div>
  );
}

function Hero({ query }: { query: string }) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#0e1222]/90 via-[#090b13]/90 to-[#0d101b]/90 p-7 sm:p-11">
      <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-[11px] text-slate-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            <span>COMMUNITY-WRITTEN · EDITOR-VERIFIED</span>
          </div>

          <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-6xl">
            Frontline dispatches in{' '}
            <span className="font-display italic font-normal bg-gradient-to-r from-cyan-300 via-indigo-300 to-rose-300 bg-clip-text text-transparent">
              cyber, tech &amp; culture.
            </span>
          </h1>

          <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-400">
            Breakthrough threat research, engineering deep-dives, and cultural shifts — written by
            practitioners and reviewed by editors before publication.
          </p>
        </div>

        <form action="/" method="get" className="w-full max-w-sm">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 p-1.5 pl-4 backdrop-blur-md focus-within:border-indigo-500/60">
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search discoveries, CVEs, tools…"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            />
            <button
              type="submit"
              className="shrink-0 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-500"
            >
              Search
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

function CategoryShowcase() {
  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-slate-400">
          Editorial Desks
        </h2>
        <div className="h-px flex-1 bg-white/[0.07]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href={`/category/${c.slug}`}
            className="panel panel-interactive group rounded-2xl p-5"
          >
            <div className="flex items-center justify-between">
              <span
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
                style={{ backgroundColor: `${c.accent}18`, color: c.accent }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: c.accent }} />
                {c.name}
              </span>
              <span className="font-mono text-xs text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-white">
                Explore →
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">{c.blurb}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
