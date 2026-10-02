import Link from 'next/link';
import { catBySlug } from '@/lib/categories';

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

  return (
    <article className="panel group overflow-hidden rounded-2xl transition hover:border-[#343b52]">
      <Link href={`/post/${post.slug}`}>
        <div
          className={`${big ? 'h-60' : 'h-40'} w-full bg-cover bg-center`}
          style={{
            backgroundImage: post.cover_url
              ? `url(${post.cover_url})`
              : `linear-gradient(135deg, ${cat.accent}33, #0e1018 70%)`,
          }}
        />
        <div className="p-5">
          <div className="mb-2 flex items-center gap-2 text-xs">
            <span
              className="rounded-full px-2.5 py-1 font-semibold"
              style={{ background: `${cat.accent}1f`, color: cat.accent }}
            >
              {cat.name}
            </span>
            <span className="text-slate-500">{when(post.published_at ?? post.created_at)}</span>
          </div>
          <h3 className={`${big ? 'text-2xl' : 'text-lg'} font-bold leading-snug group-hover:text-indigo-300`}>
            {post.title}
          </h3>
          <p className="mt-2 line-clamp-3 text-sm text-slate-400">{post.excerpt}</p>
          <p className="mt-3 text-xs text-slate-500">
            by {post.profiles?.username ?? 'anonymous'}
            {typeof post.views === 'number' && ` · ${post.views} views`}
          </p>
        </div>
      </Link>
    </article>
  );
}
