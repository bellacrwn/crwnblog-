'use client';

import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import Editor from '@/components/Editor';
import { submitPost, type ActionState } from '@/lib/actions';
import { CATEGORIES } from '@/lib/categories';

const initial: ActionState = { ok: false, message: '' };

function Submit({ isAdmin }: { isAdmin: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="rounded-lg bg-indigo-500 px-6 py-2.5 font-semibold text-white hover:bg-indigo-400 disabled:opacity-50"
    >
      {pending ? 'Sending…' : isAdmin ? 'Publish now' : 'Submit for review'}
    </button>
  );
}

export default function WriteForm({ isAdmin }: { isAdmin: boolean }) {
  const [state, action] = useFormState(submitPost, initial);

  if (state.ok) {
    return (
      <div className="panel rounded-2xl p-8 text-center">
        <p className="text-2xl font-bold text-emerald-400">✓ {state.message}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/" className="rounded-lg border border-[#2a2f42] px-5 py-2.5 hover:bg-white/5">
            Back to feed
          </Link>
          <Link href="/write" className="rounded-lg bg-indigo-500 px-5 py-2.5 font-semibold">
            Write another
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      {state.message && (
        <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {state.message}
        </p>
      )}

      <input
        name="title"
        required
        maxLength={160}
        placeholder="Headline — what did you discover?"
        className="panel w-full rounded-xl px-5 py-4 text-2xl font-bold outline-none placeholder:text-slate-600 focus:border-indigo-500"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <select
          name="category"
          required
          defaultValue=""
          className="panel rounded-xl px-4 py-3 outline-none focus:border-indigo-500"
        >
          <option value="" disabled>
            Choose a category…
          </option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>

        <input
          name="cover_url"
          type="url"
          placeholder="Cover image URL (optional)"
          className="panel rounded-xl px-4 py-3 outline-none placeholder:text-slate-600 focus:border-indigo-500"
        />
      </div>

      <Editor name="body_html" />

      <div className="flex items-center gap-4">
        <Submit isAdmin={isAdmin} />
        <p className="text-xs text-slate-500">
          {isAdmin
            ? 'You are an admin — this goes live immediately.'
            : 'Posts are reviewed by an editor before appearing on the site.'}
        </p>
      </div>
    </form>
  );
}
