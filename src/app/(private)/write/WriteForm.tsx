'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import Editor from '@/components/Editor';
import { submitPost, type ActionState } from '@/lib/actions';
import { CATEGORIES, catBySlug } from '@/lib/categories';
import { createClient } from '@/lib/supabase/client';

const initial: ActionState = { ok: false, message: '' };

export type EditablePost = {
  id: string;
  title: string;
  category_slug: string;
  cover_url: string | null;
  poster_url: string | null;
  rating: number | null;
  release_year: number | null;
  body_html: string;
  status: string;
  reject_reason: string | null;
};

function Submit({ isAdmin, isEditing }: { isAdmin: boolean; isEditing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="btn btn-primary px-7 py-3 font-mono text-[10px] uppercase tracking-kicker disabled:opacity-50"
    >
      {pending
        ? 'Saving…'
        : isEditing
        ? isAdmin
          ? 'Save changes'
          : 'Update & resubmit for review'
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
  const [category, setCategory] = useState(initialPost?.category_slug ?? '');
  const [coverUrl, setCoverUrl] = useState(initialPost?.cover_url ?? '');
  const [posterUrl, setPosterUrl] = useState(initialPost?.poster_url ?? '');
  const [uploading, setUploading] = useState<'cover' | 'poster' | null>(null);
  const [uploadErr, setUploadErr] = useState('');

  const isReview = category ? catBySlug(category).kind === 'review' : false;

  async function handleFileUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'cover' | 'poster'
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadErr('');

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setUploadErr('Only JPG, PNG, WebP, or GIF images are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadErr('Image must be under 5 MB.');
      return;
    }

    setUploading(target);
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
        if (target === 'cover') setCoverUrl(data.publicUrl);
        else setPosterUrl(data.publicUrl);
      }
    } catch {
      setUploadErr('Could not upload image. You can also paste an image URL directly.');
    } finally {
      setUploading(null);
      e.target.value = '';
    }
  }

  if (state.ok) {
    return (
      <div className="border border-rule bg-panel p-10 text-center">
        <span className="font-display text-4xl font-black text-ok">✓</span>
        <h2 className="mt-3 font-display text-3xl font-black text-ink">{state.message}</h2>
        <p className="mx-auto mt-2 max-w-md font-serif text-sm text-muted">
          You can track the review status of every submission from your writer dashboard.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {state.slug && (
            <Link
              href={`/post/${state.slug}`}
              className="btn btn-ghost px-5 py-2.5 font-mono text-[10px] uppercase tracking-kicker"
            >
              Preview article →
            </Link>
          )}
          <Link
            href="/dashboard"
            className="btn btn-ghost px-5 py-2.5 font-mono text-[10px] uppercase tracking-kicker"
          >
            Writer dashboard
          </Link>
          <Link
            href="/write"
            className="btn btn-primary px-5 py-2.5 font-mono text-[10px] uppercase tracking-kicker"
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
        <div className="border border-warn bg-warn-soft p-5">
          <p className="font-mono text-[10px] font-bold uppercase tracking-kicker text-warn">
            Editor feedback · revision requested
          </p>
          <p className="mt-1.5 font-serif text-sm text-ink">
            {initialPost.reject_reason || 'Please revise and resubmit for another review.'}
          </p>
        </div>
      )}

      {state.message && (
        <p className="border border-bad bg-bad-soft px-5 py-3.5 font-serif text-sm text-ink">
          {state.message}
        </p>
      )}

      <div className="space-y-2">
        <label htmlFor="title" className="label">
          Headline
        </label>
        <input
          id="title"
          name="title"
          required
          maxLength={160}
          defaultValue={initialPost?.title ?? ''}
          placeholder="What did you discover?"
          className="field field-headline"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="category" className="label">
            Section
          </label>
          <select
            id="category"
            name="category"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="field"
          >
            <option value="" disabled>
              Choose a section…
            </option>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
                {c.kind === 'review' ? ' (rated review)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="cover_url" className="label">
              Cover Image
            </label>
            <UploadButton target="cover" uploading={uploading} onPick={handleFileUpload} />
          </div>
          <input
            id="cover_url"
            name="cover_url"
            type="url"
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
            placeholder="https://… (or upload)"
            className="field"
          />
          {uploadErr && <p className="font-mono text-[10px] text-bad">{uploadErr}</p>}
        </div>
      </div>

      {/* ---- Film & Screen review metadata ---- */}
      {isReview && (
        <fieldset className="space-y-4 border border-rule bg-panel2 p-5">
          <legend className="px-2 font-mono text-[10px] font-bold uppercase tracking-kicker text-accent">
            Film &amp; Screen details
          </legend>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="rating" className="label">
                Rating (0–10)
              </label>
              <input
                id="rating"
                name="rating"
                type="number"
                min={0}
                max={10}
                step={0.5}
                defaultValue={initialPost?.rating ?? ''}
                placeholder="e.g. 8.5"
                className="field"
              />
              <p className="font-mono text-[10px] text-faint">Shown as stars on the article.</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="release_year" className="label">
                Release year
              </label>
              <input
                id="release_year"
                name="release_year"
                type="number"
                min={1888}
                max={2100}
                step={1}
                defaultValue={initialPost?.release_year ?? ''}
                placeholder="e.g. 2024"
                className="field"
              />
              <p className="font-mono text-[10px] text-faint">The first film was released in 1888.</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="poster_url" className="label">
                Poster (portrait)
              </label>
              <UploadButton target="poster" uploading={uploading} onPick={handleFileUpload} />
            </div>
            <input
              id="poster_url"
              name="poster_url"
              type="url"
              value={posterUrl}
              onChange={(e) => setPosterUrl(e.target.value)}
              placeholder="https://… (or upload)"
              className="field"
            />
            <p className="font-mono text-[10px] text-faint">
              A 2:3 poster crops best in the review box. The cover image is still used on cards.
            </p>
          </div>
        </fieldset>
      )}

      <div className="space-y-2">
        <span className="label">Article body</span>
        <Editor name="body_html" initialHtml={initialPost?.body_html ?? ''} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-rule pt-4">
        <p className="font-mono text-[10px] uppercase tracking-kicker text-faint">
          {isAdmin
            ? 'Editor privilege · publishes immediately'
            : 'HTML scrubbed server-side · queued for an editor'}
        </p>
        <div className="flex items-center gap-3">
          {initialPost && (
            <Link
              href="/dashboard"
              className="btn btn-ghost px-5 py-2.5 font-mono text-[10px] uppercase tracking-kicker"
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

function UploadButton({
  target,
  uploading,
  onPick,
}: {
  target: 'cover' | 'poster';
  uploading: 'cover' | 'poster' | null;
  onPick: (e: React.ChangeEvent<HTMLInputElement>, target: 'cover' | 'poster') => void;
}) {
  return (
    <label className="cursor-pointer font-mono text-[10px] font-bold uppercase tracking-kicker text-accent hover:underline">
      {uploading === target ? 'Uploading…' : '↑ Upload file'}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={(e) => onPick(e, target)}
        disabled={uploading !== null}
        className="hidden"
      />
    </label>
  );
}
