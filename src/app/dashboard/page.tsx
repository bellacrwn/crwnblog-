import Link from 'next/link';
import { createClient, getSession, isConfigured } from '@/lib/supabase/server';
import { deleteOwnPost } from '@/lib/actions';
import { catBySlug } from '@/lib/categories';
import SetupNotice from '@/components/SetupNotice';

export const metadata = { title: 'Writer Dashboard' };
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  if (!isConfigured()) return <SetupNotice />;

  const { user, profile } = await getSession();
  if (!user || !profile) {
    return (
      <div className="panel mx-auto max-w-md rounded-3xl p-6 text-center sm:p-10">
        <h1 className="font-display text-3xl text-white">Sign in to view your dashboard</h1>
        <p className="mt-2 text-sm text-slate-400">
          Track your pending submissions, read editor feedback, and manage published articles.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex w-full justify-center rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-2.5 text-sm font-semibold text-white sm:w-auto"
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
      'id, title, slug, excerpt, category_slug, status, reject_reason, views, created_at, published_at'
    )
    .eq('author_id', user.id)
    .order('created_at', { ascending: false });

  const allPosts = posts ?? [];
  const publishedCount = allPosts.filter((p) => p.status === 'published').length;
  const pendingCount = allPosts.filter((p) => p.status === 'pending').length;
  const rejectedCount = allPosts.filter((p) => p.status === 'rejected').length;
  const totalViews = allPosts.reduce((sum, p) => sum + (p.views ?? 0), 0);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-indigo-400">
            Contributor Workspace
          </span>
          <h1 className="mt-1 break-words font-display text-3xl text-white sm:text-4xl lg:text-5xl">
            @{profile.username}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Role:{' '}
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 font-mono text-xs text-slate-200">
              {profile.role}
            </span>
          </p>
        </div>

        <Link
          href="/write"
          className="w-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-2.5 text-center text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-400 hover:to-violet-400 sm:w-auto"
        >
          + New Discovery
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="panel rounded-2xl p-4 sm:p-5">
          <p className="font-mono text-[11px] uppercase tracking-wider text-slate-400">Published</p>
          <p className="mt-2 font-display text-3xl text-emerald-400 sm:text-4xl">{publishedCount}</p>
        </div>
        <div className="panel rounded-2xl p-4 sm:p-5">
          <p className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
            In Review
          </p>
          <p className="mt-2 font-display text-3xl text-amber-300 sm:text-4xl">{pendingCount}</p>
        </div>
        <div className="panel rounded-2xl p-4 sm:p-5">
          <p className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
            Needs Changes
          </p>
          <p className="mt-2 font-display text-3xl text-rose-400 sm:text-4xl">{rejectedCount}</p>
        </div>
        <div className="panel rounded-2xl p-4 sm:p-5">
          <p className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
            Total Views
          </p>
          <p className="mt-2 font-display text-3xl text-indigo-300 sm:text-4xl">
            {totalViews.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-slate-400">
            Your Submissions ({allPosts.length})
          </h2>
          <div className="h-px flex-1 bg-white/[0.07]" />
        </div>

        {allPosts.length === 0 ? (
          <div className="panel rounded-3xl p-6 text-center sm:p-12">
            <p className="font-display text-2xl text-white sm:text-3xl">You haven&apos;t submitted a discovery yet.</p>
            <p className="mt-2 text-sm text-slate-400">
              Share your first cyber, tech, or culture story with the community.
            </p>
            <Link
              href="/write"
              className="mt-6 inline-flex w-full justify-center rounded-full bg-indigo-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 sm:w-auto"
            >
              Write your first post →
            </Link>
          </div>
        ) : (
          allPosts.map((p) => {
            const cat = catBySlug(p.category_slug);
            const canEdit = p.status !== 'published' || profile.role === 'admin';

            return (
              <div key={p.id} className="panel rounded-2xl p-4 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span
                      className={`rounded-full px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider ${
                        p.status === 'published'
                          ? 'border border-emerald-400/30 bg-emerald-500/15 text-emerald-300'
                          : p.status === 'pending'
                          ? 'border border-amber-400/30 bg-amber-500/15 text-amber-300'
                          : 'border border-rose-400/30 bg-rose-500/15 text-rose-300'
                      }`}
                    >
                      {p.status === 'rejected' ? 'Needs Revision' : p.status}
                    </span>

                    <span
                      className="rounded-full px-2.5 py-0.5 font-semibold"
                      style={{ backgroundColor: `${cat.accent}18`, color: cat.accent }}
                    >
                      {cat.name}
                    </span>

                    <span className="font-mono text-[11px] text-slate-500">
                      {new Date(p.published_at ?? p.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  {p.status === 'published' && (
                    <span className="font-mono text-xs text-slate-400">
                      {(p.views ?? 0).toLocaleString()} views
                    </span>
                  )}
                </div>

                <h3 className="mt-3 break-words text-lg font-bold text-white sm:text-xl">
                  <Link href={`/post/${p.slug}`} className="hover:text-indigo-300">
                    {p.title}
                  </Link>
                </h3>

                {p.excerpt && (
                  <p className="mt-1.5 line-clamp-2 text-sm text-slate-400">{p.excerpt}</p>
                )}

                {p.status === 'rejected' && (
                  <div className="mt-4 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-rose-300">
                      Editor Note:{' '}
                    </span>
                    <span className="text-slate-200">
                      {p.reject_reason || 'Needs revision before publication.'}
                    </span>
                  </div>
                )}

                <div className="mt-5 flex flex-col items-stretch gap-2.5 border-t border-white/[0.06] pt-4 sm:flex-row sm:flex-wrap sm:items-center">
                  <Link
                    href={`/post/${p.slug}`}
                    className="w-full rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-center text-xs font-semibold text-slate-200 transition hover:bg-white/10 sm:w-auto"
                  >
                    {p.status === 'published' ? 'View live article' : 'Preview'}
                  </Link>

                  {canEdit && (
                    <Link
                      href={`/write?edit=${p.id}`}
                      className="w-full rounded-full border border-indigo-400/35 bg-indigo-500/15 px-4 py-2 text-center text-xs font-semibold text-indigo-200 transition hover:bg-indigo-500/25 sm:w-auto"
                    >
                      {p.status === 'rejected' ? '✎ Edit & Resubmit' : '✎ Edit'}
                    </Link>
                  )}

                  <form action={deleteOwnPost} className="w-full sm:ml-auto sm:w-auto">
                    <input type="hidden" name="id" value={p.id} />
                    <button className="w-full rounded-full px-3 py-2 text-center text-xs font-medium text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-300 sm:w-auto">
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
