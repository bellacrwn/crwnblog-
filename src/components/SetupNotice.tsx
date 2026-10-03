export default function SetupNotice() {
  return (
    <div className="panel relative overflow-hidden rounded-3xl p-8 sm:p-10">
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-indigo-500/15 blur-3xl" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 font-mono text-[11px] font-semibold text-amber-300">
            <span>● DATABASE CONNECTION REQUIRED</span>
          </div>
          <h2 className="font-display text-3xl text-white sm:text-4xl">
            Connect Supabase to activate your live newsroom
          </h2>
          <p className="mt-2.5 text-sm leading-relaxed text-slate-400">
            crwnblog ships with zero fake or mock posts — every article, comment, and moderation
            action runs against real Postgres with Row-Level Security.
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-black/40 p-4 font-mono text-xs text-slate-300">
          <p className="text-[10px] uppercase tracking-widest text-slate-500">.env.local</p>
          <pre className="mt-2 overflow-x-auto text-indigo-300">
{`NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...`}
          </pre>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
          <span className="font-mono text-xs font-bold text-indigo-400">STEP 01</span>
          <h3 className="mt-1 font-bold text-white">Create Supabase Project</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
            Create a free Postgres project at <span className="text-indigo-300">supabase.com</span> and copy your Project URL &amp; anon public key.
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
          <span className="font-mono text-xs font-bold text-cyan-400">STEP 02</span>
          <h3 className="mt-1 font-bold text-white">Run Hardened SQL Schema</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
            Open <b>SQL Editor</b> and run <code className="rounded bg-black/50 px-1.5 py-0.5 text-slate-200">supabase/schema.sql</code> to set up tables, triggers &amp; RLS policies.
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
          <span className="font-mono text-xs font-bold text-rose-400">STEP 03</span>
          <h3 className="mt-1 font-bold text-white">Promote Editor Account</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
            Sign up at <code className="rounded bg-black/50 px-1.5 py-0.5 text-slate-200">/login</code>, then run the admin SQL snippet at the bottom of the schema file.
          </p>
        </div>
      </div>
    </div>
  );
}
