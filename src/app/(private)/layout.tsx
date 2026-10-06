import Nav from '@/components/Nav';

/**
 * Contributor shell — deep walnut. Used by /write, /dashboard, /admin, /login.
 * Route groups don't change URLs, so these paths stay exactly as they were.
 */
export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-walnut flex min-h-screen flex-col">
      <Nav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10">{children}</main>
      <footer className="border-t border-rule bg-bgalt">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-5 py-6 font-mono text-[10px] uppercase tracking-kicker text-faint sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} crwnblog newsroom</p>
          <p>Submissions are sanitised server-side and queued for an editor</p>
        </div>
      </footer>
    </div>
  );
}
