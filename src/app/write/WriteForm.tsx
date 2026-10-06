'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import Editor from '@/components/Editor';
import { submitPost, type ActionState } from '@/lib/actions';
import { CATEGORIES } from '@/lib/categories';
import { createClient } from '@/lib/supabase/client';

const initial: ActionState = { ok: false, message: '' };

export type EditablePost = {
  id: string;
  title: string;
  category_slug: string;
  cover_url: string | null;
  body_html: string;
  status: string;
  reject_reason: string | null;
};

function Submit({ isAdmin, isEditing }: { isAdmin: boolean; isEditing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="w-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-400 hover:to-violet-400 disabled:opacity-50 sm:w-auto"
    >
      {pending
        ? 'Saving…'
        : isEditing
        ? isAdmin
          ? 'Save changes'
          : 'Update & Resubmit for review'
        : isAdmin
        ? 'Publish live now'
        : 'Submit for editorial review'}
    </button>
  );
}

export default function WriteForm({
  isAdmin,
  userId,
  initialPost,
}: {
  isAdmin: boolean;
  userId: string;
  initialPost?: EditablePost | null;
}) {
  const [state, action] = useFormState(submitPost, initial);
  const [coverUrl, setCoverUrl] = useState(initialPost?.cover_url ?? '');
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadErr('');

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setUploadErr('Only JPG, PNG, WebP, or GIF images are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadErr('Cover image must be under 5 MB.');
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg';
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${safeExt}`;

      const { error } = await supabase.storage.from('covers').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

      if (error) {
        setUploadErr(error.message);
      } else {
        const { data } = supabase.storage.from('covers').getPublicUrl(path);
        setCoverUrl(data.publicUrl);
      }
    } catch {
      setUploadErr('Could not upload image. You can also paste an image URL directly.');
    } finally {
      setUploading(false);
    }
  }

  if (state.ok) {
    return (
      <div className="panel rounded-3xl p-6 text-center sm:p-10">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-emerald-400/30 bg-emerald-500/15 text-2xl text-emerald-300">
          ✓
        </div>
        <h2 className="font-display text-3xl text-white">{state.message}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
          You can track the review status of all your submissions in your Writer Dashboard.
        </p>
        <div className="mt-7 flex w-full flex-col justify-center gap-3 sm:flex-row">
          {state.slug && (
            <Link
              href={`/post/${state.slug}`}
              className="w-full rounded-full border border-white/15 bg-white/[0.04] px-5 py-2.5 text-center text-sm font-semibold text-white hover:bg-white/10 sm:w-auto"
            >
              Preview article →
            </Link>
          )}
          <Link
            href="/dashboard"
            className="w-full rounded-full border border-indigo-400/30 bg-indigo-500/15 px-5 py-2.5 text-center text-sm font-semibold text-indigo-200 hover:bg-indigo-500/25 sm:w-auto"
          >
            Go to Writer Dashboard
          </Link>
          <Link
            href="/write"
            className="w-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-2.5 text-center text-sm font-semibold text-white sm:w-auto"
          >
            Write another
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-6">
      {initialPost && <input type="hidden" name="post_id" value={initialPost.id} />}

      {initialPost?.status === 'rejected' && (
        <div className="rounded-2xl border border-amber-400/35 bg-amber-500/10 p-5">
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-amber-300">
            Editor Feedback · Revision Requested
          </p>
          <p className="mt-1 text-sm text-slate-200">
            {initialPost.reject_reason || 'Please revise and resubmit for another review.'}
          </p>
        </div>
      )}

      {state.message && (
        <p className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3.5 text-sm text-rose-300 sm:px-5">
          {state.message}
        </p>
      )}

      <div className="space-y-2">
        <label className="block font-mono text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          Headline
        </label>
        <input
          name="title"
          required
          maxLength={160}
          defaultValue={initialPost?.title ?? ''}
          placeholder="What did you discover?"
          className="panel w-full rounded-2xl px-4 py-4 text-base font-bold text-white outline-none placeholder:text-slate-600 focus:border-indigo-500 sm:px-5 sm:text-sm"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="block font-mono text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Editorial Desk
          </label>
          <select
            name="category"
            required
            defaultValue={initialPost?.category_slug ?? ''}
            className="panel w-full rounded-2xl px-4 py-3.5 text-base text-white outline-none focus:border-indigo-500 sm:text-sm"
          >
            <option value="" disabled className="bg-[#0d1019]">
              Choose a category…
            </option>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug} className="bg-[#0d1019]">
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block font-mono text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Cover Image (URL or Upload)
            </label>
            <label className="cursor-pointer font-mono text-[11px] font-semibold text-indigo-400 hover:text-indigo-300">
              {uploading ? 'Uploading…' : '↑ Upload file'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
          <input
            name="cover_url"
            type="url"
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
            placeholder="https://… (or click Upload file)"
            className="panel w-full rounded-2xl px-4 py-3.5 text-base text-white outline-none placeholder:text-slate-600 focus:border-indigo-500 sm:text-sm"
          />
          {uploadErr && <p className="text-xs text-rose-400">{uploadErr}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block font-mono text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          Article Body
        </label>
        <Editor name="body_html" initialHtml={initialPost?.body_html ?? ''} />
      </div>

      <div className="flex flex-col items-stretch gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-400">
          {isAdmin
            ? '⚡ Editor privilege: your post publishes immediately.'
            : '🛡 All HTML is sanitized server-side and queued for editor verification.'}
        </p>
        <div className="flex w-full flex-col-reverse items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
          {initialPost && (
            <Link
              href="/dashboard"
              className="w-full rounded-full border border-white/10 px-5 py-2.5 text-center text-xs font-semibold text-slate-300 hover:bg-white/5 sm:w-auto"
            >
              Cancel
            </Link>
          )}
          <Submit isAdmin={isAdmin} isEditing={Boolean(initialPost)} />
        </div>
      </div>
    </form>
  );
}
