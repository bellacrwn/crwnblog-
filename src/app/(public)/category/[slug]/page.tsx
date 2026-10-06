import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient, isConfigured } from '@/lib/supabase/server';
import PostCard, { type PostRow } from '@/components/PostCard';
import SetupNotice from '@/components/SetupNotice';
import { CATEGORIES, type Category, deskVar } from '@/lib/categories';

export const revalidate = 30;

const SELECT =
  'id,title,slug,excerpt,cover_url,poster_url,rating,release_year,category_slug,published_at,created_at,views,profiles(username)';

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const cat = CATEGORIES.find((c) => c.slug === params.slug);
  return {
    title: cat?.name ?? 'Section',
    description: cat?.blurb ?? undefined,
  };
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const cat = CATEGORIES.find((c) => c.slug === params.slug);
  if (!cat) notFound();

  if (!isConfigured()) {
    return (
      <div className="space-y-8">
        <SectionHeader cat={cat!} count={0} />
        <SetupNotice />
      </div>
    );
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from('posts')
    .select(SELECT)
    .eq('status', 'published')
    .eq('category_slug', params.slug)
    .order('published_at', { ascending: false })
    .limit(48);

  const posts = (data ?? []) as unknown as PostRow[];

  return (
    <div className="space-y-10">
      <SectionHeader cat={cat} count={posts.length} />

      {posts.length === 0 ? (
        <div className="border border-rule bg-panel p-12 text-center sm:p-16">
          <p className="font-display text-3xl font-black text-ink sm:text-4xl">
            Nothing filed in {cat.name} yet.
          </p>
          <p className="mx-auto mt-3 max-w-md font-serif text-sm text-muted">
            Be the first contributor to report for this desk — submissions go to an editor before
            they reach the page.
          </p>
          <Link
            href="/write"
            className="btn btn-primary mt-7 px-6 py-3 font-mono text-[10px] uppercase tracking-kicker"
          >
            Submit to {cat.name} →
          </Link>
        </div>
      ) : (
        <div className="col-rule grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p, i) => (
            <div key={p.id} className={i % 3 !== 0 ? 'lg:pl-7' : ''}>
              <PostCard post={p} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionHeader({ cat, count }: { cat: Category; count: number }) {
  return (
    <header>
      <div className="flex flex-wrap items-end justify-between gap-4 border-t-2 border-rule-strong pt-4">
        <div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-kicker text-muted">
            Section
          </span>
          <h1
            className="mt-1 font-display text-5xl font-black tracking-tight sm:text-7xl"
            style={{ color: deskVar(cat.slug) }}
          >
            {cat.name}
          </h1>
          <p className="mt-2 max-w-xl font-serif text-base italic leading-relaxed text-muted">
            {cat.blurb}
          </p>
        </div>

        <p className="font-mono text-[10px] uppercase tracking-kicker text-faint">
          {count} {count === 1 ? 'dispatch' : 'dispatches'} on file
        </p>
      </div>

      {/* Desk index */}
      <nav className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-rule py-2.5">
        {CATEGORIES.map((c) => {
          const active = c.slug === cat.slug;
          return (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              aria-current={active ? 'page' : undefined}
              className={`font-mono text-[10px] font-bold uppercase tracking-kicker transition ${
                active ? 'underline decoration-2 underline-offset-4' : 'hover:underline'
              }`}
              style={{
                color: active ? 'var(--ink)' : deskVar(c.slug),
                opacity: active ? 1 : 0.75,
              }}
            >
              {c.short}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
