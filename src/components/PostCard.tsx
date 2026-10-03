import Link from 'next/link';
import { catBySlug } from '@/lib/categories';
import { sanitizeUrl } from '@/lib/sanitize';

export type PostRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_url: string | null;
  category_slug: string;
  published_at: string | null;
  created_at: string;
  views?: number;
  profiles?: { username: string } | null;
};

function when(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  if (mins < 10080) return `${Math.round(mins / 1440)}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function PostCard({ post, big = false }: { post: PostRow; big?: boolean }) {
  const cat = catBySlug(post.category_slug);
  const safeCover = sanitizeUrl(post.cover_url);
  const username = post.profiles?.username ?? 'anonymous';

  return (
    <article className="panel panel-interactive group relative flex h-full flex-col overflow-hidden rounded-2xl">
      <Link href={`/post/${post.slug}`} className="flex h-full flex-col">
        <div
          className={`${big ? 'h-64 sm:h-72' : 'h-44'} relative w-full overflow-hidden bg-cover bg-center transition duration-500 group-hover:scale-[1.02]`}
          style={{
            backgroundImage: safeCover
              ? `url("${safeCover}")`
              : `radial-gradient(circle at 20% 20%, ${cat.accent}35, transparent 60%), linear-gradient(135deg, #111524 0%, #070910 100%)`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d1019] via-transparent to-transparent opacity-80" />
          <div className="absolute left-4 top-4 flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold backdrop-blur-md"
              style={{
                background: 'rgba(7, 8, 13, 0.72)',
                borderColor: `${cat.accent}55`,
                color: cat.accent,
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cat.accent }} />
              {cat.name}
            </span>
            {big && (
              <span className="rounded-full border border-indigo-400/30 bg-indigo-500/20 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-indigo-200 backdrop-blur-md">
                Lead Story
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-between p-5 sm:p-6">
          <div>
            <div className="mb-2 flex items-center gap-2 font-mono text-[11px] text-slate-400">
              <span>{when(post.published_at ?? post.created_at)}</span>
              {typeof post.views === 'number' && (
                <>
                  <span>·</span>
                  <span>{post.views.toLocaleString()} views</span>
                </>
              )}
            </div>

            <h3
              className={`${
                big
                  ? 'font-display text-3xl sm:text-4xl tracking-tight leading-[1.12]'
                  : 'text-lg sm:text-xl font-bold leading-snug tracking-tight'
              } text-white transition group-hover:text-indigo-300`}
            >
              {post.title}
            </h3>

            {post.excerpt && (
              <p className="mt-2.5 line-clamp-3 text-sm leading-relaxed text-slate-400">
                {post.excerpt}
              </p>
            )}
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-3.5 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-white/10 font-mono text-[10px] font-bold uppercase text-slate-200">
                {username.slice(0, 1)}
              </span>
              <span className="font-medium text-slate-300">@{username}</span>
            </div>
            <span className="font-mono text-[11px] text-indigo-400 transition group-hover:translate-x-0.5">
              Read →
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
