'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { signOut } from '@/lib/actions';
import { CATEGORIES, deskVar } from '@/lib/categories';

type MobileMenuProps = {
  isSignedIn: boolean;
  username: string | null;
  isAdmin: boolean;
  pendingCount: number;
  revisionCount: number;
  /**
   * The drawer portals into document.body, i.e. OUTSIDE the .theme-newsprint /
   * .theme-walnut shell wrapper, so it would not inherit the design tokens.
   * The matching theme class is applied to the portal root instead.
   */
  theme: 'newsprint' | 'walnut';
};

export default function MobileMenu({
  isSignedIn,
  username,
  isAdmin,
  pendingCount,
  revisionCount,
  theme,
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

  const triggerClass =
    'ml-auto grid h-11 w-11 shrink-0 place-items-center border border-rule-mid bg-panel text-ink transition hover:bg-accent-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent lg:hidden';

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isOpen}
        aria-controls="mobile-navigation"
        className={triggerClass}
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
          <div className={`theme-${theme} fixed inset-0 z-[60] lg:hidden`}>
            <button
              type="button"
              tabIndex={-1}
              aria-label="Close navigation menu"
              onClick={closeMenu}
              className="absolute inset-0 cursor-default"
              style={{ background: 'var(--scrim)' }}
            />

            <aside
              id="mobile-navigation"
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation"
              tabIndex={-1}
              className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col border-l border-rule bg-bg shadow-2xl outline-none"
            >
              <div className="flex items-center justify-between border-b border-rule px-5 py-4">
                <div>
                  <p className="font-masthead text-xl leading-none text-ink">crwnblog</p>
                  <p className="mt-1 font-mono text-[10px] font-bold uppercase tracking-kicker text-muted">
                    Navigation
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeMenu}
                  aria-label="Close navigation menu"
                  className="grid h-11 w-11 place-items-center border border-rule-mid bg-panel text-ink transition hover:bg-accent-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                    <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
                <form
                  action="/"
                  method="get"
                  onSubmit={closeMenu}
                  className="flex items-center gap-2 border border-rule-mid bg-panel-inset p-1.5 pl-3 focus-within:border-accent"
                >
                  <label htmlFor="mobile-search" className="sr-only">
                    Search the archive
                  </label>
                  <input
                    id="mobile-search"
                    type="search"
                    name="q"
                    placeholder="Search the archive…"
                    autoComplete="off"
                    className="min-w-0 flex-1 bg-transparent px-1 py-2 font-serif text-base text-ink outline-none placeholder:text-faint sm:text-sm"
                  />
                  <button
                    type="submit"
                    className="btn btn-primary min-h-10 shrink-0 px-3.5 font-mono text-[10px] uppercase tracking-kicker"
                  >
                    Search
                  </button>
                </form>

                <nav aria-label="Sections" className="mt-7">
                  <p className="mb-2 px-1 font-mono text-[10px] font-bold uppercase tracking-kicker text-faint">
                    Sections
                  </p>
                  <div className="space-y-1">
                    <Link
                      href="/"
                      onClick={closeMenu}
                      className="flex min-h-12 items-center gap-3 px-3 py-2.5 transition hover:bg-accent-soft"
                    >
                      <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />
                      <span className="font-display text-base font-bold text-ink">Front Page</span>
                    </Link>
                    {CATEGORIES.map((category) => (
                      <Link
                        key={category.slug}
                        href={`/category/${category.slug}`}
                        onClick={closeMenu}
                        className="flex min-h-14 items-center gap-3 px-3 py-2.5 transition hover:bg-accent-soft"
                      >
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: deskVar(category.slug) }}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block font-display text-base font-bold text-ink">
                            {category.name}
                          </span>
                          <span className="mt-0.5 block font-serif text-xs leading-relaxed text-muted">
                            {category.blurb}
                          </span>
                        </span>
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 20 20"
                          className="h-4 w-4 shrink-0 text-faint"
                          fill="none"
                        >
                          <path
                            d="m7 4 6 6-6 6"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </Link>
                    ))}
                  </div>
                </nav>

                <nav aria-label="Account links" className="mt-7 border-t border-rule pt-5">
                  <p className="mb-2 px-1 font-mono text-[10px] font-bold uppercase tracking-kicker text-faint">
                    Your workspace
                  </p>
                  {isSignedIn ? (
                    <div className="space-y-1">
                      <Link
                        href="/dashboard"
                        onClick={closeMenu}
                        className="flex min-h-12 items-center justify-between gap-3 px-3 py-2.5 font-display text-base font-bold text-ink transition hover:bg-accent-soft"
                      >
                        <span>My Posts</span>
                        {revisionCount > 0 && (
                          <span
                            title={`${revisionCount} post${revisionCount === 1 ? '' : 's'} needing revision`}
                            className="chip text-bad"
                          >
                            {revisionCount} {revisionCount === 1 ? 'revision' : 'revisions'}
                          </span>
                        )}
                      </Link>

                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={closeMenu}
                          className="flex min-h-12 items-center justify-between gap-3 px-3 py-2.5 font-display text-base font-bold text-ink transition hover:bg-accent-soft"
                        >
                          <span>Moderation Queue</span>
                          {pendingCount > 0 && (
                            <span
                              className="min-w-6 px-2 py-1 text-center font-mono text-[10px] font-bold"
                              style={{
                                backgroundColor: 'var(--brass)',
                                color: 'var(--on-accent)',
                              }}
                            >
                              {pendingCount > 99 ? '99+' : pendingCount}
                            </span>
                          )}
                        </Link>
                      )}

                      <Link
                        href="/write"
                        onClick={closeMenu}
                        className="btn btn-primary mt-3 min-h-12 w-full px-4 py-3 font-mono text-[10px] uppercase tracking-kicker"
                      >
                        + File a dispatch
                      </Link>

                      <form action={signOut} onSubmit={closeMenu} className="mt-3">
                        <button
                          type="submit"
                          className="flex min-h-12 w-full items-center px-3 py-2.5 font-serif text-sm text-muted transition hover:bg-bad-soft hover:text-bad"
                        >
                          Sign out
                        </button>
                      </form>
                    </div>
                  ) : (
                    <Link
                      href="/login"
                      onClick={closeMenu}
                      className="btn btn-primary mt-2 min-h-12 w-full px-4 py-3 font-mono text-[10px] uppercase tracking-kicker"
                    >
                      Contributor sign in
                    </Link>
                  )}
                </nav>
              </div>

              <div className="border-t border-rule px-5 py-3">
                <p className="truncate font-mono text-[10px] uppercase tracking-kicker text-faint">
                  {isSignedIn && username
                    ? `Signed in as ${username}`
                    : 'Community-filed · editor-verified'}
                </p>
              </div>
            </aside>
          </div>,
          document.body
        )}
    </>
  );
}
