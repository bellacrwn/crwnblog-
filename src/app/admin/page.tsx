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
      <div className="panel mx-auto max-w-md rounded-2xl p-8 text-center">
        <h1 className="text-xl font-bold">Editors only</h1>
        <p className="mt-2 text-sm text-slate-400">
          Your account isn&apos;t an admin. Run the last snippet in{' '}
          <code className="text-indigo-300">supabase/schema.sql</code> to promote yourself.
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
    <div className="mx-auto max-w-4xl">
      <h1 className="text-3xl font-black">Moderation queue</h1>
      <p className="mt-1 text-sm text-slate-500">
        {pending?.length ?? 0} post{pending?.length === 1 ? '' : 's'} awaiting review.
      </p>

      <div className="mt-8 space-y-5">
        {(pending ?? []).length === 0 && (
          <p className="panel rounded-2xl p-10 text-center text-slate-400">Queue is empty. 🎉</p>
        )}

        {(pending ?? []).map((p: any) => {
          const cat = catBySlug(p.category_slug);
          return (
            <div key={p.id} className="panel rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <div className="min-w-0">
                  <span className="text-xs font-semibold" style={{ color: cat.accent }}>
                    {cat.name}
                  </span>
                  <h2 className="mt-1 text-xl font-bold">{p.title}</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    by {p.profiles?.username} · {new Date(p.created_at).toLocaleString()}
                  </p>
                  <p className="mt-3 text-sm text-slate-400">{toExcerpt(p.body_html, 320)}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Link
                  href={`/post/${p.slug}`}
                  className="rounded-lg border border-[#2a2f42] px-4 py-2 text-sm hover:bg-white/5"
                >
                  Read full
                </Link>

                <form action={moderatePost}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="decision" value="approve" />
                  <button className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-400">
                    Approve & publish
                  </button>
                </form>

                <form action={moderatePost} className="flex gap-2">
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="decision" value="reject" />
                  <input
                    name="reason"
                    placeholder="Reason (optional)"
                    className="rounded-lg border border-[#2a2f42] bg-black/30 px-3 py-2 text-sm outline-none"
                  />
                  <button className="rounded-lg border border-rose-500/50 px-4 py-2 text-sm font-semibold text-rose-300 hover:bg-rose-500/10">
                    Reject
                  </button>
                </form>

                <form action={moderatePost}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="decision" value="delete" />
                  <button className="rounded-lg px-3 py-2 text-sm text-slate-500 hover:text-rose-300">
                    Delete
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </div>

      {(recent ?? []).length > 0 && (
        <>
          <h2 className="mt-12 mb-3 text-sm font-bold uppercase tracking-widest text-slate-500">
            Recently decided
          </h2>
          <div className="panel divide-y divide-[#1e2230] rounded-2xl">
            {(recent ?? []).map((p: any) => (
              <div key={p.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                <span
                  className={`rounded px-2 py-0.5 text-xs font-semibold ${
                    p.status === 'published'
                      ? 'bg-emerald-500/15 text-emerald-300'
                      : 'bg-rose-500/15 text-rose-300'
                  }`}
                >
                  {p.status}
                </span>
                <Link href={`/post/${p.slug}`} className="truncate hover:text-indigo-300">
                  {p.title}
                </Link>
                <span className="ml-auto shrink-0 text-xs text-slate-500">{p.profiles?.username}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
