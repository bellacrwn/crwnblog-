import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient, isConfigured, getSession } from '@/lib/supabase/server';
import { catBySlug, deskVar } from '@/lib/categories';
import { cleanHtml, readingTime, sanitizeUrl } from '@/lib/sanitize';
import { addComment, deleteComment } from '@/lib/actions';
import { shortDate, when } from '@/lib/format';
import SetupNotice from '@/components/SetupNotice';
import ViewTracker from '@/components/ViewTracker';
import Stars from '@/components/Stars';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  if (!isConfigured()) return { title: 'Dispatch' };
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
  const safePoster = sanitizeUrl(post.poster_url);
  const safeHtml = cleanHtml(post.body_html);
  const isReview = cat.kind === 'review';
  const rating = typeof post.rating === 'number' ? post.rating : null;
  const filedOn = new Date(post.published_at ?? post.created_at);

  const canEdit =
    user &&
    (profile?.role === 'admin' || (post.author_id === user.id && post.status !== 'published'));

  return (
    <article className="mx-auto max-w-3xl">
      {post.status === 'published' && <ViewTracker slug={post.slug} />}

      {post.status !== 'published' && (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border border-warn bg-warn-soft px-5 py-4 text-sm text-ink">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-kicker text-warn">
              Status: {post.status} — visible only to you and the editors
            </p>
            {post.reject_reason && (
              <p className="mt-1.5 font-serif text-sm text-muted">
                <b>Editor feedback:</b> {post.reject_reason}
              </p>
            )}
          </div>
          {canEdit && (
            <Link
              href={`/write?edit=${post.id}`}
              className="btn btn-primary px-4 py-2 font-mono text-[10px] uppercase tracking-kicker"
            >
              ✎ Edit &amp; resubmit
            </Link>
          )}
        </div>
      )}

      {/* ---------- Article head ---------- */}
      <header>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-rule-strong pb-3">
          <Link
            href={`/category/${cat.slug}`}
            className="font-mono text-[10px] font-bold uppercase tracking-kicker transition hover:underline"
            style={{ color: deskVar(cat.slug) }}
          >
            {cat.name}
          </Link>

          {canEdit && post.status === 'published' && (
            <Link
              href={`/write?edit=${post.id}`}
              className="btn btn-ghost px-3 py-1.5 font-mono text-[10px] uppercase tracking-kicker"
            >
              ✎ Edit article
            </Link>
          )}
        </div>

        <h1 className="mt-5 font-display text-4xl font-black leading-[1.06] tracking-tight text-ink sm:text-6xl">
          {post.title}
        </h1>

        {post.excerpt && !isReview && (
          <p className="mt-4 font-serif text-lg italic leading-relaxed text-muted">
            {post.excerpt}
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 border-y border-rule py-2.5 font-mono text-[10px] uppercase tracking-kicker text-faint">
          <span className="font-serif text-xs normal-case italic tracking-normal text-ink">
            By @{authorName}
          </span>
          <span aria-hidden>·</span>
          <span>{shortDate(filedOn)}</span>
          <span aria-hidden>·</span>
          <span>{readingTime(safeHtml)} min read</span>
          <span aria-hidden>·</span>
          <span>{(post.views ?? 0).toLocaleString()} reads</span>
        </div>
      </header>

      {/* ---------- Review box ---------- */}
      {isReview && (rating !== null || safePoster || post.release_year) && (
        <aside className="mt-8 flex gap-5 border border-rule bg-panel p-5">
          {safePoster && (
            <div className="w-28 shrink-0 overflow-hidden border border-rule sm:w-36">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={safePoster}
                alt={`${post.title} poster`}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="newsprint-img aspect-[2/3] w-full object-cover"
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] font-bold uppercase tracking-kicker text-muted">
              The verdict
            </p>
            {rating !== null && (
              <div className="mt-2">
                <Stars rating={rating} size="lg" />
              </div>
            )}
            {post.release_year && (
              <p className="mt-3 font-mono text-[10px] uppercase tracking-kicker text-faint">
                Released {post.release_year}
              </p>
            )}
            {post.excerpt && (
              <p className="mt-3 font-serif text-sm italic leading-relaxed text-muted">
                {post.excerpt}
              </p>
            )}
          </div>
        </aside>
      )}

      {/* ---------- Lead artwork ---------- */}
      {safeCover && (
        <figure className="mt-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={safeCover}
            alt={post.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="newsprint-img w-full border border-rule"
          />
          <figcaption className="mt-1.5 border-b border-rule pb-2 font-mono text-[10px] uppercase tracking-kicker text-faint">
            {post.title} — {cat.name}
          </figcaption>
        </figure>
      )}

      {/* ---------- Body ---------- */}
      <div
        className="prose-crwn dropcap mt-10"
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />

      {author?.bio && (
        <div className="mt-12 border-t-2 border-rule-strong pt-4">
          <p className="font-mono text-[10px] font-bold uppercase tracking-kicker text-muted">
            About the contributor
          </p>
          <p className="mt-1.5 font-display text-xl font-bold text-ink">@{authorName}</p>
          <p className="mt-1 font-serif text-sm leading-relaxed text-muted">{author.bio}</p>
        </div>
      )}

      {/* ---------- Letters ---------- */}
      <section className="mt-14">
        <div className="flex items-end justify-between border-b-2 border-rule-strong pb-3">
          <h2 className="font-display text-3xl font-black tracking-tight text-ink">
            Letters to the Editor
          </h2>
          <span className="font-mono text-[10px] uppercase tracking-kicker text-faint">
            {comments?.length ?? 0}
          </span>
        </div>

        {post.status !== 'published' ? (
          <p className="mt-4 border border-rule bg-panel p-5 font-serif text-sm italic text-muted">
            Letters open once an editor clears this dispatch for publication.
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
              placeholder="Write to the desk…"
              className="field font-serif"
            />
            <div className="flex justify-end">
              <button className="btn btn-primary px-6 py-2.5 font-mono text-[10px] uppercase tracking-kicker">
                Post letter
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-5 flex items-center justify-between gap-4 border border-rule bg-panel p-5">
            <span className="font-serif text-sm italic text-muted">
              Sign in to write to the desk.
            </span>
            <Link
              href="/login"
              className="btn btn-primary shrink-0 px-4 py-2 font-mono text-[10px] uppercase tracking-kicker"
            >
              Sign in
            </Link>
          </div>
        )}

        <div className="mt-8 divide-y divide-rule">
          {(comments ?? []).map((c: any) => {
            const cAuthor = c.profiles?.username ?? 'anonymous';
            const canDelete = user && (c.author_id === user.id || profile?.role === 'admin');
            return (
              <div key={c.id} className="py-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-baseline gap-2">
                    <span className="font-serif text-sm font-bold text-ink">@{cAuthor}</span>
                    <span className="font-mono text-[9px] uppercase tracking-kicker text-faint">
                      {when(c.created_at)}
                    </span>
                  </div>
                  {canDelete && (
                    <form action={deleteComment}>
                      <input type="hidden" name="comment_id" value={c.id} />
                      <input type="hidden" name="slug" value={post.slug} />
                      <button className="font-mono text-[9px] uppercase tracking-kicker text-faint transition hover:text-bad">
                        Delete
                      </button>
                    </form>
                  )}
                </div>
                <p className="mt-2 whitespace-pre-wrap font-serif text-sm leading-relaxed text-muted">
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
