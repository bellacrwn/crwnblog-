import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient, isConfigured, getSession } from '@/lib/supabase/server';
import { catBySlug } from '@/lib/categories';
import { readingTime } from '@/lib/sanitize';
import { addComment } from '@/lib/actions';
import SetupNotice from '@/components/SetupNotice';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  if (!isConfigured()) return { title: 'Post' };
  const supabase = await createClient();
  const { data } = await supabase
    .from('posts')
    .select('title,excerpt,cover_url')
    .eq('slug', params.slug)
    .single();
  if (!data) return { title: 'Not found' };
  return {
    title: data.title,
    description: data.excerpt ?? undefined,
    openGraph: { title: data.title, description: data.excerpt ?? '', images: data.cover_url ? [data.cover_url] : [] },
  };
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  if (!isConfigured()) return <SetupNotice />;

  const supabase = await createClient();
  const { user } = await getSession();

  const { data: post } = await supabase
    .from('posts')
    .select('*, profiles(username, bio)')
    .eq('slug', params.slug)
    .single();

  if (!post) notFound();

  await supabase.rpc('increment_views', { p_slug: params.slug });

  const { data: comments } = await supabase
    .from('comments')
    .select('id, body, created_at, profiles(username)')
    .eq('post_id', post.id)
    .order('created_at', { ascending: true });

  const cat = catBySlug(post.category_slug);
  const author = (post as any).profiles;

  return (
    <article className="mx-auto max-w-3xl">
      {post.status !== 'published' && (
        <p className="mb-5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          This post is <b>{post.status}</b> — only you and editors can see it.
          {post.reject_reason && <> Reason: {post.reject_reason}</>}
        </p>
      )}

      <Link href={`/category/${cat.slug}`} className="text-sm font-semibold" style={{ color: cat.accent }}>
        {cat.name}
      </Link>

      <h1 className="mt-2 text-4xl font-black leading-tight">{post.title}</h1>

      <p className="mt-3 text-sm text-slate-500">
        by <b className="text-slate-300">{author?.username ?? 'anonymous'}</b> ·{' '}
        {new Date(post.published_at ?? post.created_at).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}{' '}
        · {readingTime(post.body_html)} min read · {post.views} views
      </p>

      {post.cover_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.cover_url} alt="" className="mt-6 w-full rounded-2xl" />
      )}

      <div
        className="prose-crwn mt-8"
        dangerouslySetInnerHTML={{ __html: post.body_html }}
      />

      <hr className="my-12 border-[#1e2230]" />

      <section>
        <h2 className="text-lg font-bold">Comments ({comments?.length ?? 0})</h2>

        {user ? (
          <form action={addComment} className="mt-4 space-y-3">
            <input type="hidden" name="post_id" value={post.id} />
            <input type="hidden" name="slug" value={post.slug} />
            <textarea
              name="body"
              required
              rows={3}
              maxLength={2000}
              placeholder="Add to the discussion…"
              className="panel w-full rounded-xl px-4 py-3 outline-none placeholder:text-slate-600 focus:border-indigo-500"
            />
            <button className="rounded-lg bg-indigo-500 px-5 py-2 text-sm font-semibold">Post comment</button>
          </form>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            <Link href="/login" className="text-indigo-400 hover:underline">
              Sign in
            </Link>{' '}
            to join the discussion.
          </p>
        )}

        <div className="mt-8 space-y-5">
          {(comments ?? []).map((c: any) => (
            <div key={c.id} className="panel rounded-xl p-4">
              <p className="text-sm font-semibold text-slate-200">{c.profiles?.username ?? 'anonymous'}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-400">{c.body}</p>
            </div>
          ))}
        </div>
      </section>
    </article>
  );
}
