import { notFound } from 'next/navigation';
import { createClient, isConfigured } from '@/lib/supabase/server';
import PostCard, { type PostRow } from '@/components/PostCard';
import SetupNotice from '@/components/SetupNotice';
import { CATEGORIES, catBySlug } from '@/lib/categories';

export const revalidate = 30;

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const cat = catBySlug(params.slug);
  return { title: cat.name, description: cat.blurb };
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  if (!CATEGORIES.some((c) => c.slug === params.slug)) notFound();
  const cat = catBySlug(params.slug);

  if (!isConfigured()) return <SetupNotice />;

  const supabase = await createClient();
  const { data } = await supabase
    .from('posts')
    .select('id,title,slug,excerpt,cover_url,category_slug,published_at,created_at,views,profiles(username)')
    .eq('status', 'published')
    .eq('category_slug', params.slug)
    .order('published_at', { ascending: false })
    .limit(30);

  const posts = (data ?? []) as unknown as PostRow[];

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-4xl font-black" style={{ color: cat.accent }}>
          {cat.name}
        </h1>
        <p className="mt-2 text-slate-400">{cat.blurb}</p>
      </header>

      {posts.length === 0 ? (
        <p className="panel rounded-2xl p-10 text-center text-slate-400">
          Nothing published in {cat.name} yet.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </div>
  );
}
