import Link from 'next/link';
import { createClient, isConfigured } from '@/lib/supabase/server';
import PostCard, { type PostRow } from '@/components/PostCard';
import SetupNotice from '@/components/SetupNotice';
import { CATEGORIES, catBySlug, deskVar } from '@/lib/categories';
import { sanitizeUrl } from '@/lib/sanitize';
import { when } from '@/lib/format';
import Stars from '@/components/Stars';

export const revalidate = 30;

const SELECT =
  'id,title,slug,excerpt,cover_url,poster_url,rating,release_year,category_slug,published_at,created_at,views,profiles(username)';

export default async function HomePage({
  searchParams,
}: {
  searchParams?: { q?: string };
}) {
  const query = (searchParams?.q ?? '').trim();

  if (!isConfigured()) {
    return (
      <div className="space-y-10">
        <SetupNotice />
      </div>
    );
  }

  const supabase = await createClient();

  const base = supabase.from('posts').select(SELECT).eq('status', 'published');
  const { data } = query
    ? await base.or(`title.ilike.%${query}%,excerpt.ilike.%${query}%`).order('published_at', {
        ascending: false,
      })
    : await base.order('published_at', { ascending: false }).limit(60);

  const posts = (data ?? []) as unknown as PostRow[];
  const [lead, ...rest] = posts;

  if (query) return <SearchResults query={query} posts={posts} />;
  if (!lead) return <EmptyFront />;

  const deskGroups = CATEGORIES.map((cat) => ({
    cat,
    items: posts.filter((p) => p.category_slug === cat.slug).slice(0, 3),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-14">
      {/* ---------------- FRONT PAGE ---------------- */}
      <section>
        <SectionRule label="Front Page" />

        <div className="col-rule mt-5 grid gap-8 lg:grid-cols-12">
          {/* Lead story */}
          <article className="lg:col-span-8 lg:pr-8">
            <Link href={`/post/${lead.slug}`} className="group block">
              <LeadArtwork post={lead} />

              <div className="mt-4 flex items-center gap-2">
                <span
                  className="font-mono text-[10px] font-bold uppercase tracking-kicker"
                  style={{ color: deskVar(lead.category_slug) }}
                >
                  {catBySlug(lead.category_slug).name}
                </span>
                <span className="text-rule-mid" aria-hidden>
                  ·
                </span>
                <span className="font-mono text-[10px] font-bold uppercase tracking-kicker text-accent">
                  Lead Story
                </span>
              </div>

              <h2 className="mt-2 font-display text-4xl font-black leading-[1.05] tracking-tight text-ink transition-colors group-hover:text-accent sm:text-6xl">
                {lead.title}
              </h2>

              {lead.excerpt && (
                <div className="dropcap mt-4">
                  <p className="max-w-2xl font-serif text-lg leading-relaxed text-muted">
                    {lead.excerpt}
                  </p>
                </div>
              )}

              {typeof lead.rating === 'number' && (
                <div className="mt-4">
                  <Stars rating={lead.rating} size="md" />
                </div>
              )}

              <p className="mt-5 border-t border-rule pt-3 font-mono text-[10px] uppercase tracking-kicker text-faint">
                By @{lead.profiles?.username ?? 'anonymous'} ·{' '}
                {when(lead.published_at ?? lead.created_at)} ·{' '}
                {(lead.views ?? 0).toLocaleString()} reads
              </p>
            </Link>
          </article>

          {/* Inside today */}
          <aside className="lg:col-span-4">
            <div className="border border-rule bg-panel p-5">
              <h3 className="border-b-2 border-rule-strong pb-2 text-center font-mono text-[10px] font-bold uppercase tracking-kicker text-ink">
                Inside Today
              </h3>

              {rest.length === 0 ? (
                <p className="mt-4 font-serif text-sm italic text-muted">
                  The rest of the paper is still being set. More dispatches appear here as editors
                  approve them.
                </p>
              ) : (
                <ol className="mt-1 divide-y divide-rule">
                  {rest.slice(0, 6).map((p, i) => (
                    <li key={p.id}>
                      <Link href={`/post/${p.slug}`} className="group flex gap-3 py-3">
                        <span className="font-display text-2xl font-black leading-none text-rule-mid transition group-hover:text-accent">
                          {String(i + 2).padStart(2, '0')}
                        </span>
                        <span>
                          <span
                            className="block font-mono text-[9px] font-bold uppercase tracking-kicker"
                            style={{ color: deskVar(p.category_slug) }}
                          >
                            {catBySlug(p.category_slug).short}
                          </span>
                          <span className="mt-0.5 block font-display text-base font-bold leading-snug text-ink transition group-hover:text-accent">
                            {p.title}
                          </span>
                          <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-kicker text-faint">
                            {when(p.published_at ?? p.created_at)}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              )}

              <Link
                href="/write"
                className="btn btn-primary mt-5 w-full px-4 py-2.5 font-mono text-[10px] uppercase tracking-kicker"
              >
                File a dispatch
              </Link>
            </div>
          </aside>
        </div>
      </section>

      {/* ---------------- SECTION STRIPS ---------------- */}
      {deskGroups.map(({ cat, items }) => (
        <section key={cat.slug}>
          <div className="flex items-end justify-between gap-4 border-t-2 border-rule-strong pt-3">
            <h2
              className="font-display text-3xl font-black tracking-tight sm:text-4xl"
              style={{ color: deskVar(cat.slug) }}
            >
              {cat.name}
            </h2>
            <Link
              href={`/category/${cat.slug}`}
              className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-kicker text-muted transition hover:text-accent"
            >
              All in {cat.short} →
            </Link>
          </div>
          <p className="mt-1 font-serif text-sm italic text-muted">{cat.blurb}</p>

          <div className="col-rule mt-5 grid gap-7 lg:grid-cols-3">
            {items.map((p, i) => (
              <div key={p.id} className={i > 0 ? 'lg:pl-7' : ''}>
                <PostCard post={p} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function LeadArtwork({ post }: { post: PostRow }) {
  const cover = sanitizeUrl(post.poster_url ?? null) ?? sanitizeUrl(post.cover_url);
  const cat = catBySlug(post.category_slug);

  if (!cover) {
    return (
      <div
        className="grid h-64 place-items-center border border-rule sm:h-80"
        style={{
          backgroundColor: 'var(--panel-2)',
          backgroundImage:
            'repeating-linear-gradient(45deg, var(--rule) 0 1px, transparent 1px 8px)',
        }}
      >
        <span className="font-display text-7xl font-black text-rule-mid">
          {cat.short.slice(0, 2).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden border border-rule">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={cover}
        alt={post.title}
        loading="eager"
        referrerPolicy="no-referrer"
        className="newsprint-img aspect-[16/9] w-full object-cover"
      />
    </div>
  );
}

function SectionRule({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="font-mono text-[10px] font-bold uppercase tracking-kicker text-ink">
        {label}
      </span>
      <span className="h-px flex-1 bg-rule-mid" />
    </div>
  );
}

function SearchResults({ query, posts }: { query: string; posts: PostRow[] }) {
  return (
    <div className="space-y-8">
      <SectionRule label={`Search · “${query}”`} />

      <p className="font-serif text-sm text-muted">
        {posts.length} archive {posts.length === 1 ? 'entry' : 'entries'} matched.
      </p>

      {posts.length === 0 ? (
        <div className="border border-rule bg-panel p-12 text-center">
          <p className="font-display text-3xl font-black text-ink">Nothing in the archive.</p>
          <p className="mx-auto mt-2 max-w-md font-serif text-sm text-muted">
            Try another term, or browse the sections from the index at the top of the page.
          </p>
          <Link href="/" className="btn btn-ghost mt-6 px-5 py-2.5 font-mono text-[10px] uppercase tracking-kicker">
            Back to the front page
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

function EmptyFront() {
  return (
    <div className="space-y-8">
      <SectionRule label="Front Page" />
      <div className="border border-rule bg-panel p-12 text-center sm:p-16">
        <p className="font-display text-4xl font-black text-ink sm:text-5xl">
          The presses are quiet.
        </p>
        <p className="mx-auto mt-3 max-w-lg font-serif text-base leading-relaxed text-muted">
          No dispatch has been approved yet. The front page fills in the moment an editor clears the
          first community submission.
        </p>
        <Link
          href="/write"
          className="btn btn-primary mt-8 px-6 py-3 font-mono text-[10px] uppercase tracking-kicker"
        >
          File the first dispatch →
        </Link>
      </div>
    </div>
  );
}
