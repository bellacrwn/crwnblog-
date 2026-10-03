'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import SetupNotice from '@/components/SetupNotice';

const USERNAME_RE = /^[a-zA-Z0-9_-]{3,24}$/;

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    const supabase = createClient();

    if (mode === 'up') {
      const cleanUsername = username.trim();
      if (!USERNAME_RE.test(cleanUsername)) {
        setBusy(false);
        return setMsg(
          'Username must be 3–24 characters using only letters, numbers, underscores (_), or hyphens (-).'
        );
      }
      if (password.length < 8) {
        setBusy(false);
        return setMsg('Password must be at least 8 characters.');
      }

      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { username: cleanUsername } },
      });
      setBusy(false);
      if (error) return setMsg(error.message);
      setMsg('Account created! Check your email if confirmation is enabled, then sign in.');
      setMode('in');
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (error) return setMsg(error.message);
    router.push('/dashboard');
    router.refresh();
  }

  if (!configured) {
    return <SetupNotice />;
  }

  return (
    <div className="panel mx-auto max-w-md rounded-3xl p-8 sm:p-10">
      <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-indigo-400">
        {mode === 'in' ? 'Contributor Access' : 'New Contributor'}
      </span>
      <h1 className="mt-1 font-display text-4xl text-white">
        {mode === 'in' ? 'Welcome back' : 'Join crwnblog'}
      </h1>
      <p className="mt-1.5 text-sm text-slate-400">
        {mode === 'in'
          ? 'Sign in to submit discoveries, manage drafts, and join discussions.'
          : 'Create a free contributor account. Every dispatch is reviewed before going live.'}
      </p>

      <form onSubmit={handle} className="mt-7 space-y-4">
        {mode === 'up' && (
          <div>
            <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-slate-400">
              Handle
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={24}
              pattern="^[a-zA-Z0-9_-]{3,24}$"
              title="3–24 characters: letters, numbers, underscores, or hyphens"
              placeholder="e.g. cyber_researcher"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
            />
          </div>
        )}
        <div>
          <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-slate-400">
            Email Address
          </label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            autoComplete="email"
            placeholder="you@domain.com"
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-slate-400">
            Password
          </label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            minLength={mode === 'up' ? 8 : 6}
            autoComplete={mode === 'up' ? 'new-password' : 'current-password'}
            placeholder={mode === 'up' ? 'At least 8 characters' : '••••••••'}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
          />
        </div>
        <button
          disabled={busy}
          className="w-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-400 hover:to-violet-400 disabled:opacity-50"
        >
          {busy ? 'Authenticating…' : mode === 'in' ? 'Sign in →' : 'Create contributor account →'}
        </button>
      </form>

      {msg && (
        <p className="mt-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-200">
          {msg}
        </p>
      )}

      <button
        type="button"
        onClick={() => {
          setMode(mode === 'in' ? 'up' : 'in');
          setMsg('');
        }}
        className="mt-6 w-full text-center text-xs font-medium text-slate-400 transition hover:text-white"
      >
        {mode === 'in'
          ? 'Need a contributor account? Create one →'
          : 'Already have an account? Sign in →'}
      </button>
    </div>
  );
}
