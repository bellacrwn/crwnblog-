import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient, isConfigured } from '@/lib/supabase/server';
import PostCard, { type PostRow } from '@/components/PostCard';
import SetupNotice from '@/components/SetupNotice';
import { CATEGORIES, catBySlug } from '@/lib/categories';

export const revalidate = 30;

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const cat = catBySlug(params.slug);
  return { title: cat.name, description: cat.blurb };
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  if (!CATEGORIES.some((c) => c.slug === params.slug)) notFound();
  const cat = catBySlug(params.slug);

  if (!isConfigured()) {
    return (
      <div className="space-y-8">
        <CategoryHeader cat={cat} count={0} />
        <SetupNotice />
      </div>
    );
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from('posts')
    .select(
      'id,title,slug,excerpt,cover_url,category_slug,published_at,created_at,views,profiles(username)'
    )
    .eq('status', 'published')
    .eq('category_slug', params.slug)
    .order('published_at', { ascending: false })
    .limit(30);

  const posts = (data ?? []) as unknown as PostRow[];

  return (
    <div className="space-y-10">
      <CategoryHeader cat={cat} count={posts.length} />

      {posts.length === 0 ? (
        <div className="panel rounded-3xl p-6 text-center sm:p-12">
          <p className="font-display text-2xl text-white sm:text-3xl">
            Nothing published in {cat.name} yet.
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Be the first contributor to file a dispatch for this desk.
          </p>
          <Link
            href="/write"
            className="mt-6 inline-flex w-full justify-center rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-2.5 text-sm font-semibold text-white sm:w-auto"
          >
            Submit to {cat.name} →
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryHeader({
  cat,
  count,
}: {
  cat: (typeof CATEGORIES)[number];
  count: number;
}) {
  return (
    <header className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0c0f1a]/90 p-5 sm:p-8 lg:p-10">
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl"
        style={{ backgroundColor: `${cat.accent}22` }}
      />
      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div>
          <span
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-widest"
            style={{ borderColor: `${cat.accent}44`, color: cat.accent }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cat.accent }} />
            Editorial Desk
          </span>
          <h1 className="mt-3 break-words font-display text-3xl text-white sm:text-5xl lg:text-6xl">{cat.name}</h1>
          <p className="mt-2 max-w-xl text-base text-slate-400">{cat.blurb}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const active = c.slug === cat.slug;
            return (
              <Link
                key={c.slug}
                href={`/category/${c.slug}`}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                  active
                    ? 'bg-white/10 text-white'
                    : 'border-white/10 text-slate-400 hover:text-white'
                }`}
                style={active ? { borderColor: c.accent, color: c.accent } : undefined}
              >
                {c.name} ({active ? count : '→'})
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
