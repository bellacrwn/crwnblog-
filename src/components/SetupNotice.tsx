/** Shown when Supabase env vars are missing. Inherits whichever shell theme is active. */
export default function SetupNotice() {
  return (
    <div className="border border-rule bg-panel p-8 sm:p-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-xl">
          <span className="font-mono text-[10px] font-bold uppercase tracking-kicker text-warn">
            ● Database connection required
          </span>
          <h2 className="mt-2 font-display text-3xl font-black tracking-tight text-ink sm:text-4xl">
            Connect Supabase to start the presses
          </h2>
          <p className="mt-2.5 font-serif text-sm leading-relaxed text-muted">
            crwnblog ships with zero placeholder copy — every dispatch, letter and moderation action
            runs against real Postgres with Row-Level Security. Add the two environment variables
            and the newsroom goes live.
          </p>
        </div>

        <div className="shrink-0 border border-rule bg-inset p-4">
          <p className="font-mono text-[9px] uppercase tracking-kicker text-faint">.env.local</p>
          <pre className="mt-2 overflow-x-auto font-mono text-xs text-ink">
{`NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...`}
          </pre>
        </div>
      </div>

      <div className="col-rule mt-8 grid gap-6 sm:grid-cols-3">
        {[
          {
            n: '01',
            t: 'Create the project',
            d: 'supabase.com → New project. Free tier is fine.',
          },
          {
            n: '02',
            t: 'Run the schema',
            d: 'Paste supabase/schema.sql into the SQL Editor and run it.',
          },
          {
            n: '03',
            t: 'Wire up the keys',
            d: 'Copy the URL and anon key into .env.local, then restart the dev server.',
          },
        ].map((s, i) => (
          <div key={s.n} className={i > 0 ? 'sm:pl-6' : ''}>
            <span className="font-display text-3xl font-black text-rule-mid">{s.n}</span>
            <p className="mt-1 font-display text-lg font-bold text-ink">{s.t}</p>
            <p className="mt-1 font-serif text-sm leading-relaxed text-muted">{s.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
