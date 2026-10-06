import Link from 'next/link';
import { createClient, getSession, isConfigured } from '@/lib/supabase/server';
import { isValidUuid, cleanHtml } from '@/lib/sanitize';
import SetupNotice from '@/components/SetupNotice';
import WriteForm, { type EditablePost } from './WriteForm';

export const metadata = { title: 'File a dispatch' };
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
      <div className="mx-auto max-w-md border border-rule bg-panel p-10 text-center">
        <span className="font-display text-4xl font-black text-accent">✎</span>
        <h1 className="mt-3 font-display text-3xl font-black text-ink">Sign in to contribute</h1>
        <p className="mt-2 font-serif text-sm leading-relaxed text-muted">
          crwnblog is open to community researchers and writers — sign in so your dispatches carry
          your byline.
        </p>
        <Link
          href="/login"
          className="btn btn-primary mt-6 px-7 py-2.5 font-mono text-[10px] uppercase tracking-kicker"
        >
          Sign in / create account
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
      .select(
        'id, title, category_slug, cover_url, poster_url, rating, release_year, body_html, status, reject_reason, author_id'
      )
      .eq('id', editId)
      .single();

    if (data && (isAdmin || (data.author_id === user.id && data.status !== 'published'))) {
      initialPost = {
        id: data.id,
        title: data.title,
        category_slug: data.category_slug,
        cover_url: data.cover_url,
        poster_url: data.poster_url,
        rating: data.rating,
        release_year: data.release_year,
        body_html: cleanHtml(data.body_html),
        status: data.status,
        reject_reason: data.reject_reason,
      };
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b-2 border-rule-strong pb-4">
        <div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-kicker text-accent">
            {initialPost ? 'Revise submission' : 'Contributor desk'}
          </span>
          <h1 className="mt-1.5 font-display text-4xl font-black tracking-tight text-ink sm:text-5xl">
            {initialPost ? 'Revise your dispatch' : 'File a new dispatch'}
          </h1>
          <p className="mt-1.5 font-serif text-sm italic text-muted">
            Byline:{' '}
            <span className="not-italic font-bold text-ink">@{profile?.username}</span>
          </p>
        </div>

        <Link
          href="/dashboard"
          className="btn btn-ghost px-4 py-2 font-mono text-[10px] uppercase tracking-kicker"
        >
          My submissions →
        </Link>
      </div>

      <WriteForm isAdmin={isAdmin} userId={user.id} initialPost={initialPost} />
    </div>
  );
}
