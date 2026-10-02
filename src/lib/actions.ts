'use server';

import { revalidatePath } from 'next/cache';
import { createClient, getSession } from '@/lib/supabase/server';
import { cleanHtml, slugify, toExcerpt } from '@/lib/sanitize';

export type ActionState = { ok: boolean; message: string; slug?: string };

export async function submitPost(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { user, profile } = await getSession();
  if (!user || !profile) return { ok: false, message: 'You must be signed in to post.' };

  const title = String(formData.get('title') ?? '').trim();
  const category = String(formData.get('category') ?? '');
  const cover = String(formData.get('cover_url') ?? '').trim();
  const rawBody = String(formData.get('body_html') ?? '');

  if (title.length < 3) return { ok: false, message: 'Title is too short.' };
  if (!['cyber', 'tech', 'celebrity'].includes(category))
    return { ok: false, message: 'Pick a valid category.' };

  const body_html = cleanHtml(rawBody);
  if (body_html.replace(/<[^>]*>/g, '').trim().length < 50)
    return { ok: false, message: 'Write at least 50 characters of body text.' };

  const isAdmin = profile.role === 'admin';
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('posts')
    .insert({
      author_id: user.id,
      category_slug: category,
      title,
      slug: slugify(title),
      excerpt: toExcerpt(body_html),
      body_html,
      cover_url: cover || null,
      status: isAdmin ? 'published' : 'pending',
      published_at: isAdmin ? new Date().toISOString() : null,
    })
    .select('slug')
    .single();

  if (error) return { ok: false, message: error.message };

  revalidatePath('/');
  revalidatePath('/admin');
  return {
    ok: true,
    slug: data.slug,
    message: isAdmin
      ? 'Published.'
      : 'Submitted! An editor will review it before it goes live.',
  };
}

async function requireAdmin() {
  const { profile } = await getSession();
  if (!profile || profile.role !== 'admin') throw new Error('Admins only.');
  return createClient();
}

export async function moderatePost(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get('id'));
  const decision = String(formData.get('decision'));

  if (decision === 'approve') {
    await supabase
      .from('posts')
      .update({ status: 'published', published_at: new Date().toISOString(), reject_reason: null })
      .eq('id', id);
  } else if (decision === 'reject') {
    await supabase
      .from('posts')
      .update({ status: 'rejected', reject_reason: String(formData.get('reason') || 'Not a fit.') })
      .eq('id', id);
  } else if (decision === 'delete') {
    await supabase.from('posts').delete().eq('id', id);
  }

  revalidatePath('/admin');
  revalidatePath('/');
}

export async function addComment(formData: FormData) {
  const { user } = await getSession();
  if (!user) return;
  const body = String(formData.get('body') ?? '').trim().slice(0, 2000);
  const post_id = String(formData.get('post_id'));
  const slug = String(formData.get('slug'));
  if (!body) return;

  const supabase = await createClient();
  await supabase.from('comments').insert({ post_id, author_id: user.id, body });
  revalidatePath(`/post/${slug}`);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/');
}
