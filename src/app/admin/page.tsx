import Link from 'next/link';
import { createClient, getSession, isConfigured } from '@/lib/supabase/server';
import { moderatePost } from '@/lib/actions';
import SetupNotice from '@/components/SetupNotice';
import { catBySlug } from '@/lib/categories';
import { toExcerpt } from '@/lib/sanitize';

export const metadata = { title: 'Moderation queue' };
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  if (!isConfigured()) return <SetupNotice />;

  const { profile } = await getSession();
  if (!profile || profile.role !== 'admin') {
    return (
      <div className="panel mx-auto max-w-md rounded-3xl p-10 text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-500/10 font-mono text-lg text-amber-300">
          ⛨
        </span>
        <h1 className="mt-4 font-display text-3xl text-white">Editors Only</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          Your account isn&apos;t an editor yet. Run the admin promotion snippet at the bottom of{' '}
          <code className="rounded bg-black/50 px-1.5 py-0.5 text-indigo-300">
            supabase/schema.sql
          </code>{' '}
          in your Supabase SQL Editor.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: pending } = await supabase
    .from('posts')
    .select('*, profiles(username)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  const { data: recent } = await supabase
    .from('posts')
    .select('id,title,slug,status,created_at,category_slug,profiles(username)')
    .neq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div>
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-amber-300">
          Editorial Control
        </span>
        <h1 className="mt-1 font-display text-4xl text-white sm:text-5xl">Moderation Queue</h1>
        <p className="mt-1 text-sm text-slate-400">
          {pending?.length ?? 0} community submission{pending?.length === 1 ? '' : 's'} awaiting
          editorial decision.
        </p>
      </div>

      <div className="space-y-5">
        {(pending ?? []).length === 0 && (
          <div className="panel rounded-3xl p-12 text-center">
            <p className="font-display text-3xl text-white">All caught up.</p>
            <p className="mt-1 text-sm text-slate-400">
              There are zero pending submissions in the review queue right now.
            </p>
          </div>
        )}

        {(pending ?? []).map((p: any) => {
          const cat = catBySlug(p.category_slug);
          return (
            <div key={p.id} className="panel rounded-2xl p-6">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span
                  className="rounded-full px-3 py-1 font-semibold"
                  style={{ backgroundColor: `${cat.accent}18`, color: cat.accent }}
                >
                  {cat.name}
                </span>
                <span className="font-mono text-slate-400">
                  by @{p.profiles?.username ?? 'anonymous'}
                </span>
                <span className="font-mono text-slate-500">
                  · {new Date(p.created_at).toLocaleString()}
                </span>
              </div>

              <h2 className="mt-3 text-2xl font-bold text-white">{p.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                {toExcerpt(p.body_html, 340)}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2.5 border-t border-white/[0.06] pt-4">
                <Link
                  href={`/post/${p.slug}`}
                  className="rounded-full border border-white/15 bg-white/[0.03] px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"
                >
                  Inspect Full Article →
                </Link>

                <Link
                  href={`/write?edit=${p.id}`}
                  className="rounded-full border border-indigo-400/30 bg-indigo-500/10 px-4 py-2 text-xs font-semibold text-indigo-200 hover:bg-indigo-500/20"
                >
                  ✎ Edit
                </Link>

                <form action={moderatePost}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="decision" value="approve" />
                  <button className="rounded-full bg-emerald-500 px-5 py-2 text-xs font-bold text-black shadow-md shadow-emerald-500/20 hover:bg-emerald-400">
                    ✓ Approve &amp; Publish
                  </button>
                </form>

                <form action={moderatePost} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="decision" value="reject" />
                  <input
                    name="reason"
                    maxLength={500}
                    placeholder="Feedback for author (optional)"
                    className="rounded-full border border-white/15 bg-black/40 px-4 py-1.5 text-xs text-white outline-none focus:border-rose-400"
                  />
                  <button className="rounded-full border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20">
                    Request Changes
                  </button>
                </form>

                <form action={moderatePost} className="ml-auto">
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="decision" value="delete" />
                  <button className="rounded-full px-3 py-2 text-xs text-slate-500 hover:text-rose-300">
                    Delete
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </div>

      {(recent ?? []).length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-3">
            <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-slate-400">
              Recently Moderated
            </h2>
            <div className="h-px flex-1 bg-white/[0.07]" />
          </div>
          <div className="panel divide-y divide-white/[0.06] overflow-hidden rounded-2xl">
            {(recent ?? []).map((p: any) => (
              <div key={p.id} className="flex items-center gap-3 px-5 py-3.5 text-sm">
                <span
                  className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
                    p.status === 'published'
                      ? 'bg-emerald-500/15 text-emerald-300'
                      : 'bg-rose-500/15 text-rose-300'
                  }`}
                >
                  {p.status}
                </span>
                <Link
                  href={`/post/${p.slug}`}
                  className="truncate font-medium text-slate-200 hover:text-indigo-300"
                >
                  {p.title}
                </Link>
                <span className="ml-auto shrink-0 font-mono text-xs text-slate-500">
                  @{p.profiles?.username}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
