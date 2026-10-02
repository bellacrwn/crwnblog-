export default function SetupNotice() {
  return (
    <div className="panel mx-auto max-w-2xl rounded-2xl p-8">
      <h2 className="text-2xl font-bold">Connect Supabase to go live</h2>
      <p className="mt-2 text-slate-400">
        crwnblog is running, but it has no database yet — and by design it ships with zero
        fake posts. Three steps:
      </p>
      <ol className="mt-5 space-y-3 text-sm text-slate-300">
        <li>
          <b className="text-white">1.</b> Create a free project at{' '}
          <span className="text-indigo-300">supabase.com</span>.
        </li>
        <li>
          <b className="text-white">2.</b> Open <b>SQL Editor</b> and run the contents of{' '}
          <code className="rounded bg-black/50 px-1.5 py-0.5">supabase/schema.sql</code>.
        </li>
        <li>
          <b className="text-white">3.</b> Copy <code className="rounded bg-black/50 px-1.5 py-0.5">.env.local.example</code>{' '}
          to <code className="rounded bg-black/50 px-1.5 py-0.5">.env.local</code>, paste your
          Project URL + anon key, and restart.
        </li>
      </ol>
      <p className="mt-5 text-xs text-slate-500">
        Then sign up, and run the last SQL snippet in the schema file to make your account an admin.
      </p>
    </div>
  );
}
