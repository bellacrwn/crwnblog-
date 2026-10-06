import Link from 'next/link';
import { createClient, getSession, isConfigured } from '@/lib/supabase/server';
import { moderatePost } from '@/lib/actions';
import SetupNotice from '@/components/SetupNotice';
import { catBySlug, deskVar } from '@/lib/categories';
import { toExcerpt } from '@/lib/sanitize';
import { when } from '@/lib/format';

export const metadata = { title: 'Moderation queue' };
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  if (!isConfigured()) return <SetupNotice />;

  const { profile } = await getSession();
  if (!profile || profile.role !== 'admin') {
    return (
      <div className="mx-auto max-w-md border border-rule bg-panel p-10 text-center">
        <span className="font-display text-4xl font-black text-warn">⛨</span>
        <h1 className="mt-3 font-display text-3xl font-black text-ink">Editors only</h1>
        <p className="mt-2 font-serif text-sm leading-relaxed text-muted">
          Your account isn&apos;t an editor yet. Run the admin promotion snippet at the bottom of{' '}
          <code className="border border-rule bg-inset px-1.5 py-0.5 font-mono text-xs text-accent">
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
      <div className="border-b-2 border-rule-strong pb-4">
        <span className="font-mono text-[10px] font-bold uppercase tracking-kicker text-accent">
          Editorial control
        </span>
        <h1 className="mt-1.5 font-display text-4xl font-black tracking-tight text-ink sm:text-5xl">
          Moderation Queue
        </h1>
        <p className="mt-1.5 font-serif text-sm italic text-muted">
          {pending?.length ?? 0} community submission{pending?.length === 1 ? '' : 's'} awaiting an
          editorial decision.
        </p>
      </div>

      <div className="space-y-5">
        {(pending ?? []).length === 0 && (
          <div className="border border-rule bg-panel p-12 text-center">
            <p className="font-display text-3xl font-black text-ink">All caught up.</p>
            <p className="mt-1.5 font-serif text-sm text-muted">
              There are zero pending submissions in the review queue right now.
            </p>
          </div>
        )}

        {(pending ?? []).map((p: any) => {
          const cat = catBySlug(p.category_slug);
          return (
            <div key={p.id} className="border border-rule bg-panel p-6">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className="chip"
                  style={{ color: deskVar(p.category_slug) }}
                >
                  {cat.name}
                </span>
                <span className="font-serif text-xs italic text-muted">
                  by @{p.profiles?.username ?? 'anonymous'}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-kicker text-faint">
                  filed {when(p.created_at)}
                </span>
                {typeof p.rating === 'number' && (
                  <span className="font-mono text-[10px] uppercase tracking-kicker text-brass">
                    ★ {p.rating.toFixed(1)}/10
                  </span>
                )}
                {p.release_year && (
                  <span className="font-mono text-[10px] uppercase tracking-kicker text-faint">
                    · {p.release_year}
                  </span>
                )}
              </div>

              <h2 className="mt-3 font-display text-2xl font-black tracking-tight text-ink">
                {p.title}
              </h2>
              <p className="mt-2 font-serif text-sm leading-relaxed text-muted">
                {toExcerpt(p.body_html, 340)}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2.5 border-t border-rule pt-4">
                <Link
                  href={`/post/${p.slug}`}
                  className="btn btn-ghost px-4 py-2 font-mono text-[10px] uppercase tracking-kicker"
                >
                  Inspect full article →
                </Link>

                <Link
                  href={`/write?edit=${p.id}`}
                  className="btn btn-ghost px-4 py-2 font-mono text-[10px] uppercase tracking-kicker"
                >
                  ✎ Edit
                </Link>

                <form action={moderatePost}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="decision" value="approve" />
                  <button className="btn px-5 py-2 font-mono text-[10px] uppercase tracking-kicker text-[var(--on-accent)]"
                    style={{ backgroundColor: 'var(--ok)', borderColor: 'var(--ok)' }}>
                    ✓ Approve &amp; publish
                  </button>
                </form>

                <form action={moderatePost} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="decision" value="reject" />
                  <input
                    name="reason"
                    maxLength={500}
                    placeholder="Feedback for author (optional)"
                    className="field w-52 py-1.5 font-mono text-xs"
                  />
                  <button className="btn btn-ghost px-4 py-2 font-mono text-[10px] uppercase tracking-kicker text-bad">
                    Request changes
                  </button>
                </form>

                <form action={moderatePost} className="ml-auto">
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="decision" value="delete" />
                  <button className="px-3 py-2 font-mono text-[10px] uppercase tracking-kicker text-faint transition hover:text-bad">
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
            <h2 className="font-mono text-[10px] font-bold uppercase tracking-kicker text-muted">
              Recently moderated
            </h2>
            <span className="h-px flex-1 bg-rule" />
          </div>
          <div className="divide-y divide-rule border border-rule bg-panel">
            {(recent ?? []).map((p: any) => (
              <div key={p.id} className="flex items-center gap-3 px-5 py-3.5">
                <span
                  className="chip shrink-0"
                  style={{
                    color: p.status === 'published' ? 'var(--ok)' : 'var(--bad)',
                    borderColor: 'currentColor',
                  }}
                >
                  {p.status}
                </span>
                <Link
                  href={`/post/${p.slug}`}
                  className="truncate font-serif text-sm text-ink transition hover:text-accent"
                >
                  {p.title}
                </Link>
                <span className="ml-auto shrink-0 font-mono text-[10px] uppercase tracking-kicker text-faint">
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
