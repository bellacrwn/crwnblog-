import Link from 'next/link';
import { createClient, getSession, isConfigured } from '@/lib/supabase/server';
import { deleteOwnPost } from '@/lib/actions';
import { catBySlug, deskVar } from '@/lib/categories';
import { shortDate } from '@/lib/format';
import SetupNotice from '@/components/SetupNotice';

export const metadata = { title: 'Writer Dashboard' };
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  if (!isConfigured()) return <SetupNotice />;

  const { user, profile } = await getSession();
  if (!user || !profile) {
    return (
      <div className="mx-auto max-w-md border border-rule bg-panel p-10 text-center">
        <h1 className="font-display text-3xl font-black text-ink">
          Sign in to view your dashboard
        </h1>
        <p className="mt-2 font-serif text-sm text-muted">
          Track pending submissions, read editor feedback and manage published articles.
        </p>
        <Link
          href="/login"
          className="btn btn-primary mt-6 px-6 py-2.5 font-mono text-[10px] uppercase tracking-kicker"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: posts } = await supabase
    .from('posts')
    .select(
      'id, title, slug, excerpt, category_slug, status, reject_reason, rating, views, created_at, published_at'
    )
    .eq('author_id', user.id)
    .order('created_at', { ascending: false });

  const allPosts = posts ?? [];
  const publishedCount = allPosts.filter((p) => p.status === 'published').length;
  const pendingCount = allPosts.filter((p) => p.status === 'pending').length;
  const rejectedCount = allPosts.filter((p) => p.status === 'rejected').length;
  const totalViews = allPosts.reduce((sum, p) => sum + (p.views ?? 0), 0);

  const stats = [
    { label: 'Published', value: publishedCount, tone: 'var(--ok)' },
    { label: 'In review', value: pendingCount, tone: 'var(--warn)' },
    { label: 'Needs changes', value: rejectedCount, tone: 'var(--bad)' },
    { label: 'Total reads', value: totalViews.toLocaleString(), tone: 'var(--brass)' },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-rule-strong pb-4">
        <div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-kicker text-accent">
            Contributor workspace
          </span>
          <h1 className="mt-1.5 font-display text-4xl font-black tracking-tight text-ink sm:text-5xl">
            @{profile.username}
          </h1>
          <p className="mt-1.5 font-serif text-sm italic text-muted">
            Role:{' '}
            <span className="not-italic font-mono text-[10px] uppercase tracking-kicker text-ink">
              {profile.role}
            </span>
          </p>
        </div>

        <Link
          href="/write"
          className="btn btn-primary px-6 py-2.5 font-mono text-[10px] uppercase tracking-kicker"
        >
          + New dispatch
        </Link>
      </div>

      {/* Stats */}
      <div className="col-rule grid grid-cols-2 gap-5 sm:grid-cols-4">
        {stats.map((s, i) => (
          <div key={s.label} className={i > 0 ? 'sm:pl-5' : ''}>
            <p className="font-mono text-[10px] uppercase tracking-kicker text-faint">{s.label}</p>
            <p className="mt-1.5 font-display text-4xl font-black" style={{ color: s.tone }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Submissions */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 border-t border-rule pt-4">
          <h2 className="font-mono text-[10px] font-bold uppercase tracking-kicker text-muted">
            Your submissions ({allPosts.length})
          </h2>
          <span className="h-px flex-1 bg-rule" />
        </div>

        {allPosts.length === 0 ? (
          <div className="border border-rule bg-panel p-12 text-center">
            <p className="font-display text-3xl font-black text-ink">
              You haven&apos;t filed a dispatch yet.
            </p>
            <p className="mt-2 font-serif text-sm text-muted">
              Share your first cyber, tech, sport, screen or culture story with the readership.
            </p>
            <Link
              href="/write"
              className="btn btn-primary mt-6 px-6 py-2.5 font-mono text-[10px] uppercase tracking-kicker"
            >
              Write your first dispatch →
            </Link>
          </div>
        ) : (
          allPosts.map((p) => {
            const cat = catBySlug(p.category_slug);
            const canEdit = p.status !== 'published' || profile.role === 'admin';
            const tone =
              p.status === 'published'
                ? 'var(--ok)'
                : p.status === 'pending'
                ? 'var(--warn)'
                : 'var(--bad)';

            return (
              <div key={p.id} className="border border-rule bg-panel p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span
                      className="chip"
                      style={{ color: tone }}
                    >
                      {p.status === 'rejected' ? 'Needs revision' : p.status}
                    </span>

                    <span className="chip" style={{ color: deskVar(p.category_slug) }}>
                      {cat.name}
                    </span>

                    {typeof p.rating === 'number' && (
                      <span className="font-mono text-[10px] uppercase tracking-kicker text-brass">
                        ★ {p.rating.toFixed(1)}
                      </span>
                    )}

                    <span className="font-mono text-[10px] uppercase tracking-kicker text-faint">
                      {shortDate(new Date(p.published_at ?? p.created_at))}
                    </span>
                  </div>

                  {p.status === 'published' && (
                    <span className="font-mono text-[10px] uppercase tracking-kicker text-faint">
                      {(p.views ?? 0).toLocaleString()} reads
                    </span>
                  )}
                </div>

                <h3 className="mt-3 font-display text-xl font-bold tracking-tight text-ink">
                  <Link href={`/post/${p.slug}`} className="transition hover:text-accent">
                    {p.title}
                  </Link>
                </h3>

                {p.excerpt && (
                  <p className="mt-1.5 line-clamp-2 font-serif text-sm text-muted">{p.excerpt}</p>
                )}

                {p.status === 'rejected' && (
                  <div className="mt-4 border border-bad bg-bad-soft px-4 py-3">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-kicker text-bad">
                      Editor note:{' '}
                    </span>
                    <span className="font-serif text-sm text-ink">
                      {p.reject_reason || 'Needs revision before publication.'}
                    </span>
                  </div>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-2.5 border-t border-rule pt-4">
                  <Link
                    href={`/post/${p.slug}`}
                    className="btn btn-ghost px-4 py-2 font-mono text-[10px] uppercase tracking-kicker"
                  >
                    {p.status === 'published' ? 'View live article' : 'Preview'}
                  </Link>

                  {canEdit && (
                    <Link
                      href={`/write?edit=${p.id}`}
                      className="btn btn-ghost px-4 py-2 font-mono text-[10px] uppercase tracking-kicker text-accent"
                    >
                      {p.status === 'rejected' ? '✎ Edit & resubmit' : '✎ Edit'}
                    </Link>
                  )}

                  <form action={deleteOwnPost} className="ml-auto">
                    <input type="hidden" name="id" value={p.id} />
                    <button className="px-3 py-2 font-mono text-[10px] uppercase tracking-kicker text-faint transition hover:text-bad">
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
