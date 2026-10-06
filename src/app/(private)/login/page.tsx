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
    <div className="mx-auto max-w-md border border-rule bg-panel p-8 sm:p-10">
      <span className="font-mono text-[10px] font-bold uppercase tracking-kicker text-accent">
        {mode === 'in' ? 'Contributor access' : 'New contributor'}
      </span>
      <h1 className="mt-2 font-display text-4xl font-black tracking-tight text-ink">
        {mode === 'in' ? 'Welcome back' : 'Join the newsroom'}
      </h1>
      <p className="mt-2 font-serif text-sm leading-relaxed text-muted">
        {mode === 'in'
          ? 'Sign in to file dispatches, manage drafts and write to the desk.'
          : 'Create a free contributor account. Every dispatch is read by an editor before it runs.'}
      </p>

      <form onSubmit={handle} className="mt-7 space-y-4">
        {mode === 'up' && (
          <div className="space-y-1.5">
            <label htmlFor="username" className="label">
              Handle
            </label>
            <input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={24}
              pattern="^[a-zA-Z0-9_-]{3,24}$"
              title="3–24 characters: letters, numbers, underscores, or hyphens"
              placeholder="e.g. cyber_researcher"
              className="field"
            />
          </div>
        )}
        <div className="space-y-1.5">
          <label htmlFor="email" className="label">
            Email address
          </label>
          <input
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            autoComplete="email"
            placeholder="you@domain.com"
            className="field"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="password" className="label">
            Password
          </label>
          <input
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            minLength={mode === 'up' ? 8 : 6}
            autoComplete={mode === 'up' ? 'new-password' : 'current-password'}
            placeholder={mode === 'up' ? 'At least 8 characters' : '••••••••'}
            className="field"
          />
        </div>
        <button
          disabled={busy}
          className="btn btn-primary w-full py-3 font-mono text-[10px] uppercase tracking-kicker disabled:opacity-50"
        >
          {busy
            ? 'Authenticating…'
            : mode === 'in'
            ? 'Sign in →'
            : 'Create contributor account →'}
        </button>
      </form>

      {msg && (
        <p className="mt-4 border border-warn bg-warn-soft px-4 py-2.5 font-serif text-xs text-ink">
          {msg}
        </p>
      )}

      <button
        type="button"
        onClick={() => {
          setMode(mode === 'in' ? 'up' : 'in');
          setMsg('');
        }}
        className="mt-6 w-full text-center font-mono text-[10px] uppercase tracking-kicker text-faint transition hover:text-accent"
      >
        {mode === 'in'
          ? 'Need a contributor account? Create one →'
          : 'Already have an account? Sign in →'}
      </button>
    </div>
  );
}
