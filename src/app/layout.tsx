import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import Nav from '@/components/Nav';
import Link from 'next/link';
import { CATEGORIES } from '@/lib/categories';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});

const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: {
    default: 'crwnblog — cyber, tech & celebrity discoveries',
    template: '%s · crwnblog',
  },
  description:
    'crwnblog is an independent community publication covering breakthroughs in cyber security, technology, and digital culture.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex min-h-screen flex-col antialiased selection:bg-indigo-500/30">
        <Nav />
        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">{children}</main>
        <footer className="mt-24 border-t border-white/[0.07] bg-[#040508]/80 backdrop-blur-md">
          <div className="mx-auto max-w-6xl px-5 py-12">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              <div className="sm:col-span-2">
                <Link href="/" className="inline-flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 text-sm font-black text-black shadow-lg shadow-indigo-500/20">
                    C
                  </span>
                  <span className="text-lg font-extrabold tracking-tight text-white">
                    crwn<span className="text-indigo-400">blog</span>
                  </span>
                </Link>
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-400">
                  Community-driven dispatches on cyber security research, emerging engineering tools,
                  and digital culture. Every submission is editorially reviewed before going live.
                </p>
              </div>

              <div>
                <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Desks
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-400">
                  {CATEGORIES.map((c) => (
                    <li key={c.slug}>
                      <Link
                        href={`/category/${c.slug}`}
                        className="inline-flex items-center gap-2 transition hover:text-white"
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: c.accent }}
                        />
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Contributors
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-400">
                  <li>
                    <Link href="/write" className="transition hover:text-white">
                      Submit a discovery →
                    </Link>
                  </li>
                  <li>
                    <Link href="/dashboard" className="transition hover:text-white">
                      Writer dashboard
                    </Link>
                  </li>
                  <li>
                    <Link href="/login" className="transition hover:text-white">
                      Contributor sign in
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-10 flex flex-col gap-3 border-t border-white/[0.06] pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <p>© {new Date().getFullYear()} crwnblog. Sanitized, RLS-hardened & editor-moderated.</p>
              <p className="font-mono text-[11px] text-slate-500">
                SECURITY: CSP · RLS · XSS-SCRUBBED
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
