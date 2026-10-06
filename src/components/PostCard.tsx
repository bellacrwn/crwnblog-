import Link from 'next/link';
import { catBySlug, deskVar } from '@/lib/categories';
import { sanitizeUrl } from '@/lib/sanitize';
import { when } from '@/lib/format';
import Stars from '@/components/Stars';

export type PostRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_url: string | null;
  poster_url?: string | null;
  rating?: number | null;
  release_year?: number | null;
  category_slug: string;
  published_at: string | null;
  created_at: string;
  views?: number;
  profiles?: { username: string } | null;
};

/** Engraved placeholder used when a story ships without artwork. */
function Placeholder({ initials }: { initials: string }) {
  return (
    <div
      className="absolute inset-0 grid place-items-center"
      style={{
        backgroundColor: 'var(--panel-2)',
        backgroundImage:
          'repeating-linear-gradient(45deg, var(--rule) 0 1px, transparent 1px 7px)',
      }}
    >
      <span className="font-display text-5xl font-black text-rule-mid">{initials}</span>
    </div>
  );
}

export default function PostCard({ post, big = false }: { post: PostRow; big?: boolean }) {
  const cat = catBySlug(post.category_slug);
  const safeCover = sanitizeUrl(post.poster_url ?? null) ?? sanitizeUrl(post.cover_url);
  const username = post.profiles?.username ?? 'anonymous';
  const isReview = cat.kind === 'review';

  return (
    <article className="group flex h-full flex-col">
      <Link href={`/post/${post.slug}`} className="flex h-full flex-col">
        {big ? (
          <div
            className="relative w-full overflow-hidden border border-rule"
            style={{ aspectRatio: '16 / 9' }}
          >
            {safeCover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={safeCover}
                alt={post.title}
                loading="eager"
                referrerPolicy="no-referrer"
                className="newsprint-img h-full w-full object-cover"
              />
            ) : (
              <Placeholder initials={cat.short.slice(0, 2).toUpperCase()} />
            )}
          </div>
        ) : (
          <div
            className="relative w-full overflow-hidden border border-rule"
            style={{ aspectRatio: isReview ? '3 / 4' : '16 / 10' }}
          >
            {safeCover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={safeCover}
                alt={post.title}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="newsprint-img h-full w-full object-cover"
              />
            ) : (
              <Placeholder initials={cat.short.slice(0, 2).toUpperCase()} />
            )}
            {isReview && typeof post.rating === 'number' && (
              <span className="absolute bottom-0 left-0 bg-ink px-2 py-1 font-mono text-[10px] font-bold tracking-kicker text-bg">
                ★ {post.rating.toFixed(1)}
              </span>
            )}
          </div>
        )}

        <div className="mt-3 flex flex-1 flex-col">
          <div className="flex items-center gap-2">
            <span
              className="font-mono text-[10px] font-bold uppercase tracking-kicker"
              style={{ color: deskVar(cat.slug) }}
            >
              {cat.name}
            </span>
            <span className="text-rule-mid" aria-hidden>
              ·
            </span>
            <span className="font-mono text-[10px] uppercase tracking-kicker text-faint">
              {when(post.published_at ?? post.created_at)}
            </span>
          </div>

          <h3
            className={`mt-1.5 font-display font-bold leading-[1.15] text-ink transition-colors group-hover:text-accent ${
              big ? 'text-3xl tracking-tight sm:text-[2.6rem]' : 'text-xl'
            }`}
          >
            {post.title}
          </h3>

          {isReview && typeof post.release_year === 'number' && (
            <p className="mt-1.5 font-mono text-[10px] uppercase tracking-kicker text-faint">
              Released {post.release_year}
            </p>
          )}

          {post.excerpt && (
            <p
              className={`mt-2 font-serif leading-relaxed text-muted ${
                big ? 'text-base italic' : 'line-clamp-3 text-sm'
              }`}
            >
              {post.excerpt}
            </p>
          )}

          {isReview && typeof post.rating === 'number' && big && (
            <div className="mt-3">
              <Stars rating={post.rating} size="md" />
            </div>
          )}

          <div className="mt-auto flex items-center gap-2 border-t border-rule pt-2.5 text-xs text-faint sm:mt-4">
            <span className="font-serif italic text-muted">By @{username}</span>
            {typeof post.views === 'number' && (
              <>
                <span aria-hidden>·</span>
                <span className="font-mono text-[10px] uppercase tracking-kicker">
                  {post.views.toLocaleString()} reads
                </span>
              </>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}
