'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

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
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username: username.trim() } },
      });
      setBusy(false);
      if (error) return setMsg(error.message);
      setMsg('Account created. Check your email if confirmation is enabled, then sign in.');
      setMode('in');
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return setMsg(error.message);
    router.push('/write');
    router.refresh();
  }

  if (!configured) {
    return (
      <div className="panel mx-auto max-w-md rounded-2xl p-8 text-center text-slate-400">
        Add your Supabase keys to <code className="text-indigo-300">.env.local</code> to enable accounts.
      </div>
    );
  }

  return (
    <div className="panel mx-auto max-w-md rounded-2xl p-8">
      <h1 className="text-2xl font-bold">{mode === 'in' ? 'Welcome back' : 'Join crwnblog'}</h1>
      <p className="mt-1 text-sm text-slate-500">
        {mode === 'in' ? 'Sign in to write and comment.' : 'Free account. Your first post goes to review.'}
      </p>

      <form onSubmit={handle} className="mt-6 space-y-3">
        {mode === 'up' && (
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
            maxLength={24}
            placeholder="Username"
            className="w-full rounded-lg border border-[#2a2f42] bg-black/30 px-4 py-2.5 outline-none focus:border-indigo-500"
          />
        )}
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
          placeholder="Email"
          className="w-full rounded-lg border border-[#2a2f42] bg-black/30 px-4 py-2.5 outline-none focus:border-indigo-500"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
          minLength={6}
          placeholder="Password (min 6)"
          className="w-full rounded-lg border border-[#2a2f42] bg-black/30 px-4 py-2.5 outline-none focus:border-indigo-500"
        />
        <button
          disabled={busy}
          className="w-full rounded-lg bg-indigo-500 py-2.5 font-semibold text-white hover:bg-indigo-400 disabled:opacity-50"
        >
          {busy ? 'Working…' : mode === 'in' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      {msg && <p className="mt-4 text-sm text-amber-300">{msg}</p>}

      <button
        onClick={() => {
          setMode(mode === 'in' ? 'up' : 'in');
          setMsg('');
        }}
        className="mt-5 w-full text-sm text-slate-400 hover:text-white"
      >
        {mode === 'in' ? "No account? Create one" : 'Already have an account? Sign in'}
      </button>
    </div>
  );
}
