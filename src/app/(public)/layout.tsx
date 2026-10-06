import Masthead from '@/components/Masthead';
import Colophon from '@/components/Colophon';

/**
 * Public shell — cream newsprint paper, brown ink.
 * The contributor area in `src/app/(private)` uses the walnut shell instead.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-newsprint flex min-h-screen flex-col">
      <Masthead />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8">{children}</main>
      <Colophon />
    </div>
  );
}
