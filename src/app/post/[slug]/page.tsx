import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient, isConfigured, getSession } from '@/lib/supabase/server';
import { catBySlug } from '@/lib/categories';
import { cleanHtml, readingTime, sanitizeUrl } from '@/lib/sanitize';
import { addComment, deleteComment } from '@/lib/actions';
import SetupNotice from '@/components/SetupNotice';
import ViewTracker from '@/components/ViewTracker';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  if (!isConfigured()) return { title: 'Post' };
  const supabase = await createClient();
  const { data } = await supabase
    .from('posts')
    .select('title,excerpt,cover_url,status')
    .eq('slug', params.slug)
    .single();
  if (!data) return { title: 'Not found' };
  const safeCover = sanitizeUrl(data.cover_url);
  return {
    title: data.title,
    description: data.excerpt ?? undefined,
    openGraph: {
      title: data.title,
      description: data.excerpt ?? '',
      images: safeCover ? [safeCover] : [],
    },
  };
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  if (!isConfigured()) return <SetupNotice />;

  const supabase = await createClient();
  const { user, profile } = await getSession();

  const { data: post } = await supabase
    .from('posts')
    .select('*, profiles(username, bio)')
    .eq('slug', params.slug)
    .single();

  if (!post) notFound();

  const { data: comments } = await supabase
    .from('comments')
    .select('id, body, author_id, created_at, profiles(username)')
    .eq('post_id', post.id)
    .order('created_at', { ascending: true });

  const cat = catBySlug(post.category_slug);
  const author = (post as any).profiles;
  const authorName = author?.username ?? 'anonymous';
  const safeCover = sanitizeUrl(post.cover_url);
  const safeHtml = cleanHtml(post.body_html);
  const canEdit =
    user &&
    (profile?.role === 'admin' ||
      (post.author_id === user.id && post.status !== 'published'));

  return (
    <article className="mx-auto max-w-3xl">
      {post.status === 'published' && <ViewTracker slug={post.slug} />}

      {post.status !== 'published' && (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-400/35 bg-amber-500/10 px-5 py-4 text-sm text-amber-200">
          <div>
            <p className="font-semibold">
              Status:{' '}
              <span className="uppercase tracking-wider text-amber-300">{post.status}</span> — only
              visible to you and editors.
            </p>
            {post.reject_reason && (
              <p className="mt-1 text-xs text-rose-200">
                <b>Editor feedback:</b> {post.reject_reason}
              </p>
            )}
          </div>
          {canEdit && (
            <Link
              href={`/write?edit=${post.id}`}
              className="rounded-full bg-amber-400 px-4 py-1.5 text-xs font-bold text-black hover:bg-amber-300"
            >
              ✎ Edit &amp; Resubmit
            </Link>
          )}
        </div>
      )}

      <header className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/category/${cat.slug}`}
            className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-semibold transition hover:bg-white/5"
            style={{ borderColor: `${cat.accent}55`, color: cat.accent }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cat.accent }} />
            {cat.name}
          </Link>

          {canEdit && post.status === 'published' && (
            <Link
              href={`/write?edit=${post.id}`}
              className="rounded-full border border-white/15 px-3.5 py-1 text-xs font-semibold text-slate-300 hover:bg-white/5"
            >
              ✎ Edit Article
            </Link>
          )}
        </div>

        <h1 className="font-display text-4xl leading-[1.08] tracking-tight text-white sm:text-6xl">
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-indigo-500/20 font-mono text-xs font-bold uppercase text-indigo-300">
              {authorName.slice(0, 1)}
            </span>
            <span className="font-semibold text-slate-200">@{authorName}</span>
          </div>
          <span>·</span>
          <span className="font-mono">
            {new Date(post.published_at ?? post.created_at).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
          <span>·</span>
          <span className="font-mono">{readingTime(safeHtml)} min read</span>
          <span>·</span>
          <span className="font-mono">{(post.views ?? 0).toLocaleString()} views</span>
        </div>
      </header>

      {safeCover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={safeCover}
          alt={post.title}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="mt-8 w-full rounded-3xl border border-white/[0.08] shadow-2xl"
        />
      )}

      <div
        className="prose-crwn mt-10"
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />

      {author?.bio && (
        <div className="panel mt-12 rounded-2xl p-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
            Written By
          </p>
          <p className="mt-1 font-bold text-white">@{authorName}</p>
          <p className="mt-1 text-sm text-slate-400">{author.bio}</p>
        </div>
      )}

      <hr className="my-14 border-white/[0.08]" />

      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-3xl text-white">
            Discussion ({comments?.length ?? 0})
          </h2>
        </div>

        {post.status !== 'published' ? (
          <p className="mt-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 text-sm text-slate-400">
            Comments unlock once this dispatch is approved and published.
          </p>
        ) : user ? (
          <form action={addComment} className="mt-5 space-y-3">
            <input type="hidden" name="post_id" value={post.id} />
            <input type="hidden" name="slug" value={post.slug} />
            <textarea
              name="body"
              required
              rows={3}
              maxLength={2000}
              placeholder="Add your perspective or technical notes…"
              className="panel w-full rounded-2xl px-4 py-3.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-indigo-500"
            />
            <div className="flex justify-end">
              <button className="rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 hover:from-indigo-400 hover:to-violet-400">
                Post comment
              </button>
            </div>
          </form>
        ) : (
          <div className="panel mt-5 flex items-center justify-between rounded-2xl p-5 text-sm">
            <span className="text-slate-400">Sign in to join the community discussion.</span>
            <Link
              href="/login"
              className="rounded-full bg-indigo-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-400"
            >
              Sign in
            </Link>
          </div>
        )}

        <div className="mt-8 space-y-4">
          {(comments ?? []).map((c: any) => {
            const cAuthor = c.profiles?.username ?? 'anonymous';
            const canDelete =
              user && (c.author_id === user.id || profile?.role === 'admin');
            return (
              <div key={c.id} className="panel rounded-2xl p-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-white/10 font-mono text-[10px] font-bold uppercase text-slate-200">
                      {cAuthor.slice(0, 1)}
                    </span>
                    <span className="text-xs font-semibold text-slate-200">@{cAuthor}</span>
                    <span className="font-mono text-[11px] text-slate-500">
                      ·{' '}
                      {new Date(c.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  {canDelete && (
                    <form action={deleteComment}>
                      <input type="hidden" name="comment_id" value={c.id} />
                      <input type="hidden" name="slug" value={post.slug} />
                      <button className="text-xs text-slate-500 transition hover:text-rose-300">
                        Delete
                      </button>
                    </form>
                  )}
                </div>
                <p className="mt-2.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                  {c.body}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </article>
  );
}
