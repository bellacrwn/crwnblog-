'use server';

import { revalidatePath } from 'next/cache';
import { createClient, getSession } from '@/lib/supabase/server';
import {
  cleanHtml,
  isValidSlug,
  isValidUuid,
  sanitizeUrl,
  slugify,
  toExcerpt,
} from '@/lib/sanitize';

export type ActionState = { ok: boolean; message: string; slug?: string };

const MAX_PENDING_POSTS_PER_USER = 5;

export async function submitPost(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { user, profile } = await getSession();
  if (!user || !profile) {
    return { ok: false, message: 'You must be signed in to post.' };
  }

  const postId = String(formData.get('post_id') ?? '').trim();
  const title = String(formData.get('title') ?? '').trim();
  const category = String(formData.get('category') ?? '');
  const rawCover = String(formData.get('cover_url') ?? '').trim();
  const rawBody = String(formData.get('body_html') ?? '');

  if (postId && !isValidUuid(postId)) {
    return { ok: false, message: 'Invalid post identifier.' };
  }
  if (title.length < 3 || title.length > 160) {
    return { ok: false, message: 'Title must be between 3 and 160 characters.' };
  }
  if (!['cyber', 'tech', 'celebrity'].includes(category)) {
    return { ok: false, message: 'Pick a valid category.' };
  }
  if (rawBody.length > 100_000) {
    return { ok: false, message: 'Post body is too large.' };
  }

  let cover_url: string | null = null;
  if (rawCover) {
    cover_url = sanitizeUrl(rawCover);
    if (!cover_url) {
      return {
        ok: false,
        message: 'Cover image URL must be a valid http:// or https:// address.',
      };
    }
  }

  const body_html = cleanHtml(rawBody);
  const plainTextLength = toExcerpt(body_html, 1000).length;
  if (plainTextLength < 50) {
    return { ok: false, message: 'Write at least 50 characters of body text.' };
  }

  const isAdmin = profile.role === 'admin';
  const supabase = await createClient();

  // Editing an existing post (resubmitting a rejected/pending draft, or admin edit)
  if (postId) {
    const { data: existing, error: fetchErr } = await supabase
      .from('posts')
      .select('id, slug, author_id, status, published_at')
      .eq('id', postId)
      .single();

    if (fetchErr || !existing) {
      return { ok: false, message: 'Post not found or you do not have permission to edit it.' };
    }
    if (!isAdmin && existing.author_id !== user.id) {
      return { ok: false, message: 'You can only edit your own posts.' };
    }
    if (!isAdmin && existing.status === 'published') {
      return { ok: false, message: 'Published posts can only be edited by an editor.' };
    }

    const nextStatus = isAdmin ? existing.status : 'pending';
    const { error: updateErr } = await supabase
      .from('posts')
      .update({
        category_slug: category,
        title,
        excerpt: toExcerpt(body_html),
        body_html,
        cover_url,
        status: nextStatus,
        reject_reason: isAdmin ? undefined : null,
        published_at: isAdmin ? existing.published_at ?? new Date().toISOString() : null,
      })
      .eq('id', postId);

    if (updateErr) {
      return {
        ok: false,
        message: 'Could not update your post. Please check your inputs and try again.',
      };
    }

    revalidatePath('/');
    revalidatePath(`/category/${category}`);
    revalidatePath(`/post/${existing.slug}`);
    revalidatePath('/dashboard');
    revalidatePath('/admin');

    return {
      ok: true,
      slug: existing.slug,
      message: isAdmin
        ? 'Changes saved.'
        : 'Updated and resubmitted for editor review!',
    };
  }

  // Creating a new post
  if (!isAdmin) {
    const { count } = await supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', user.id)
      .eq('status', 'pending');

    if ((count ?? 0) >= MAX_PENDING_POSTS_PER_USER) {
      return {
        ok: false,
        message: `You already have ${MAX_PENDING_POSTS_PER_USER} posts awaiting review. Please wait for an editor to review them first.`,
      };
    }
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({
      author_id: user.id,
      category_slug: category,
      title,
      slug: slugify(title),
      excerpt: toExcerpt(body_html),
      body_html,
      cover_url,
      status: isAdmin ? 'published' : 'pending',
      published_at: isAdmin ? new Date().toISOString() : null,
    })
    .select('slug')
    .single();

  if (error) {
    return {
      ok: false,
      message: 'Could not save your post. Please check your inputs and try again.',
    };
  }

  revalidatePath('/');
  revalidatePath(`/category/${category}`);
  revalidatePath('/dashboard');
  revalidatePath('/admin');
  return {
    ok: true,
    slug: data.slug,
    message: isAdmin
      ? 'Published live.'
      : 'Submitted! An editor will review your discovery before it goes live.',
  };
}

export async function deleteOwnPost(formData: FormData) {
  const { user, profile } = await getSession();
  if (!user) return;

  const id = String(formData.get('id') ?? '');
  if (!isValidUuid(id)) return;

  const supabase = await createClient();
  const query = supabase.from('posts').delete().eq('id', id);

  if (profile?.role !== 'admin') {
    await query.eq('author_id', user.id);
  } else {
    await query;
  }

  revalidatePath('/dashboard');
  revalidatePath('/admin');
  revalidatePath('/');
}

async function requireAdmin() {
  const { profile } = await getSession();
  if (!profile || profile.role !== 'admin') throw new Error('Admins only.');
  return createClient();
}

export async function moderatePost(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const decision = String(formData.get('decision') ?? '');

  if (!isValidUuid(id)) return;

  const { data: existing } = await supabase
    .from('posts')
    .select('slug, category_slug')
    .eq('id', id)
    .single();

  if (decision === 'approve') {
    await supabase
      .from('posts')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        reject_reason: null,
      })
      .eq('id', id);
  } else if (decision === 'reject') {
    const rawReason = String(formData.get('reason') ?? '').trim().slice(0, 500);
    await supabase
      .from('posts')
      .update({
        status: 'rejected',
        reject_reason: rawReason || 'Needs revision before publishing.',
      })
      .eq('id', id);
  } else if (decision === 'delete') {
    await supabase.from('posts').delete().eq('id', id);
  } else {
    return;
  }

  revalidatePath('/admin');
  revalidatePath('/dashboard');
  revalidatePath('/');
  if (existing?.category_slug) {
    revalidatePath(`/category/${existing.category_slug}`);
  }
  if (existing?.slug && isValidSlug(existing.slug)) {
    revalidatePath(`/post/${existing.slug}`);
  }
}

export async function addComment(formData: FormData) {
  const { user } = await getSession();
  if (!user) return;

  const body = String(formData.get('body') ?? '').trim().slice(0, 2000);
  const post_id = String(formData.get('post_id') ?? '');
  const slug = String(formData.get('slug') ?? '');

  if (!body || !isValidUuid(post_id) || !isValidSlug(slug)) return;

  const supabase = await createClient();

  const { data: post } = await supabase
    .from('posts')
    .select('id, status')
    .eq('id', post_id)
    .eq('status', 'published')
    .single();

  if (!post) return;

  await supabase.from('comments').insert({ post_id, author_id: user.id, body });
  revalidatePath(`/post/${slug}`);
}

export async function deleteComment(formData: FormData) {
  const { user, profile } = await getSession();
  if (!user) return;

  const comment_id = String(formData.get('comment_id') ?? '');
  const slug = String(formData.get('slug') ?? '');
  if (!isValidUuid(comment_id) || !isValidSlug(slug)) return;

  const supabase = await createClient();
  const query = supabase.from('comments').delete().eq('id', comment_id);

  if (profile?.role !== 'admin') {
    await query.eq('author_id', user.id);
  } else {
    await query;
  }

  revalidatePath(`/post/${slug}`);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
}
