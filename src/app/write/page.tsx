import Link from 'next/link';
import { createClient, getSession, isConfigured } from '@/lib/supabase/server';
import { isValidUuid, cleanHtml } from '@/lib/sanitize';
import SetupNotice from '@/components/SetupNotice';
import WriteForm, { type EditablePost } from './WriteForm';

export const metadata = { title: 'Write a discovery' };
export const dynamic = 'force-dynamic';

export default async function WritePage({
  searchParams,
}: {
  searchParams?: { edit?: string };
}) {
  if (!isConfigured()) return <SetupNotice />;

  const { user, profile } = await getSession();

  if (!user) {
    return (
      <div className="panel mx-auto max-w-md rounded-3xl p-6 text-center sm:p-10">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-400/30 bg-indigo-500/10 font-mono text-lg text-indigo-300">
          ✎
        </span>
        <h1 className="mt-4 font-display text-3xl text-white">Sign in to contribute</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          crwnblog is open to community researchers and writers — sign in so your dispatches
          carry your byline.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex w-full justify-center rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-7 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 sm:w-auto"
        >
          Sign in / Create account
        </Link>
      </div>
    );
  }

  const editId = (searchParams?.edit ?? '').trim();
  let initialPost: EditablePost | null = null;
  const isAdmin = profile?.role === 'admin';

  if (editId && isValidUuid(editId)) {
    const supabase = await createClient();
    const { data } = await supabase
      .from('posts')
      .select('id, title, category_slug, cover_url, body_html, status, reject_reason, author_id')
      .eq('id', editId)
      .single();

    if (data && (isAdmin || (data.author_id === user.id && data.status !== 'published'))) {
      initialPost = {
        id: data.id,
        title: data.title,
        category_slug: data.category_slug,
        cover_url: data.cover_url,
        body_html: cleanHtml(data.body_html),
        status: data.status,
        reject_reason: data.reject_reason,
      };
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-indigo-400">
            {initialPost ? 'Edit Submission' : 'Contributor Desk'}
          </span>
          <h1 className="mt-1 break-words font-display text-3xl text-white sm:text-4xl lg:text-5xl">
            {initialPost ? 'Revise your discovery' : 'Submit a new discovery'}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Byline: <span className="font-semibold text-slate-200">@{profile?.username}</span>
          </p>
        </div>

        <Link
          href="/dashboard"
          className="w-full rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-center text-xs font-semibold text-slate-300 transition hover:bg-white/[0.08] sm:w-auto"
        >
          View My Submissions →
        </Link>
      </div>

      <WriteForm isAdmin={isAdmin} userId={user.id} initialPost={initialPost} />
    </div>
  );
}
