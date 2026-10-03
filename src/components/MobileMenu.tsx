'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { signOut } from '@/lib/actions';
import { CATEGORIES } from '@/lib/categories';

type MobileMenuProps = {
  isSignedIn: boolean;
  username: string | null;
  isAdmin: boolean;
  pendingCount: number;
  revisionCount: number;
};

export default function MobileMenu({
  isSignedIn,
  username,
  isAdmin,
  pendingCount,
  revisionCount,
}: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) {
      if (wasOpenRef.current) triggerRef.current?.focus();
      wasOpenRef.current = false;
      return;
    }

    wasOpenRef.current = true;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        return;
      }

      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled])'
        )
      ).filter((element) => element.getClientRects().length > 0);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === panelRef.current)
      ) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  function closeMenu() {
    setIsOpen(false);
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isOpen}
        aria-controls="mobile-navigation"
        className="ml-auto grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-200 transition hover:border-white/20 hover:bg-white/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400 lg:hidden"
      >
        {isOpen ? (
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
            <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {isOpen &&
        createPortal(
          <div className="fixed inset-0 z-[60] lg:hidden">
            <button
              type="button"
              tabIndex={-1}
              aria-label="Close navigation menu"
              onClick={closeMenu}
              className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
            />

            <aside
              id="mobile-navigation"
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation"
              tabIndex={-1}
              className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col border-l border-white/10 bg-[#080a12] shadow-2xl shadow-black/50 outline-none"
            >
              <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
                <div>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-300">
                    crwnblog
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-white">Navigation</p>
                </div>
                <button
                  type="button"
                  onClick={closeMenu}
                  aria-label="Close navigation menu"
                  className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                    <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              <div className="no-scrollbar flex-1 overflow-y-auto overscroll-contain px-5 py-5">
                <form
                  action="/"
                  method="get"
                  onSubmit={closeMenu}
                  className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/40 p-1.5 pl-3 focus-within:border-indigo-400/60"
                >
                  <label htmlFor="mobile-search" className="sr-only">
                    Search dispatches
                  </label>
                  <input
                    id="mobile-search"
                    type="search"
                    name="q"
                    placeholder="Search dispatches…"
                    autoComplete="off"
                    className="min-w-0 flex-1 bg-transparent px-1 py-2 text-base text-white outline-none placeholder:text-slate-500 sm:text-sm"
                  />
                  <button
                    type="submit"
                    className="min-h-10 shrink-0 rounded-xl bg-indigo-500 px-3.5 text-xs font-semibold text-white transition hover:bg-indigo-400"
                  >
                    Search
                  </button>
                </form>

                <nav aria-label="Editorial desks" className="mt-7">
                  <p className="mb-2 px-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                    Editorial Desks
                  </p>
                  <div className="space-y-1">
                    <Link
                      href="/"
                      onClick={closeMenu}
                      className="flex min-h-12 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06] hover:text-white"
                    >
                      <span className="h-2 w-2 shrink-0 rounded-full bg-indigo-300" />
                      All Feed
                    </Link>
                    {CATEGORIES.map((category) => (
                      <Link
                        key={category.slug}
                        href={`/category/${category.slug}`}
                        onClick={closeMenu}
                        className="flex min-h-14 items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-white/[0.06]"
                      >
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: category.accent }}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-slate-200">
                            {category.name}
                          </span>
                          <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
                            {category.blurb}
                          </span>
                        </span>
                        <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-slate-600" fill="none">
                          <path d="m7 4 6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </Link>
                    ))}
                  </div>
                </nav>

                <nav aria-label="Account links" className="mt-7 border-t border-white/[0.08] pt-5">
                  <p className="mb-2 px-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                    Your Workspace
                  </p>
                  {isSignedIn ? (
                    <div className="space-y-1">
                      <Link
                        href="/dashboard"
                        onClick={closeMenu}
                        className="flex min-h-12 items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06] hover:text-white"
                      >
                        <span>My Posts</span>
                        {revisionCount > 0 && (
                          <span
                            title={`${revisionCount} post${revisionCount === 1 ? '' : 's'} needing revision`}
                            className="rounded-full border border-rose-400/30 bg-rose-500/15 px-2.5 py-1 font-mono text-[10px] font-bold text-rose-200"
                          >
                            {revisionCount} {revisionCount === 1 ? 'revision' : 'revisions'}
                          </span>
                        )}
                      </Link>

                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={closeMenu}
                          className="flex min-h-12 items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06] hover:text-white"
                        >
                          <span>Moderation Queue</span>
                          {pendingCount > 0 && (
                            <span className="min-w-6 rounded-full bg-amber-400 px-2 py-1 text-center font-mono text-[10px] font-bold text-black">
                              {pendingCount > 99 ? '99+' : pendingCount}
                            </span>
                          )}
                        </Link>
                      )}

                      <Link
                        href="/write"
                        onClick={closeMenu}
                        className="mt-3 flex min-h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:from-indigo-400 hover:to-violet-400"
                      >
                        + Write a dispatch
                      </Link>

                      <form action={signOut} onSubmit={closeMenu} className="mt-3">
                        <button
                          type="submit"
                          className="flex min-h-12 w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-200"
                        >
                          Sign out
                        </button>
                      </form>
                    </div>
                  ) : (
                    <Link
                      href="/login"
                      onClick={closeMenu}
                      className="mt-2 flex min-h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:from-indigo-400 hover:to-violet-400"
                    >
                      Sign in to post
                    </Link>
                  )}
                </nav>
              </div>

              <div className="border-t border-white/[0.08] px-5 py-3">
                <p className="truncate font-mono text-[10px] text-slate-500">
                  {isSignedIn && username
                    ? `SIGNED IN AS ${username}`
                    : 'COMMUNITY-WRITTEN · EDITOR-VERIFIED'}
                </p>
              </div>
            </aside>
          </div>,
          document.body
        )}
    </>
  );
}
