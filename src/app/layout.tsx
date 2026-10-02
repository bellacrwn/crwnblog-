import type { Metadata } from 'next';
import './globals.css';
import Nav from '@/components/Nav';
import Link from 'next/link';

export const metadata: Metadata = {
  title: { default: 'crwnblog — cyber, tech & celebrity discoveries', template: '%s · crwnblog' },
  description:
    'crwnblog publishes recent discoveries in cyber security, technology and celebrity culture — written by the community.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Nav />
        <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
        <footer className="mt-16 border-t border-[#1e2230]">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 text-sm text-slate-500 sm:flex-row sm:items-center">
            <p>© {new Date().getFullYear()} crwnblog. Community submissions are reviewed before publishing.</p>
            <Link href="/write" className="text-indigo-400 hover:text-indigo-300 sm:ml-auto">
              Submit a discovery →
            </Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
