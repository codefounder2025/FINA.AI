'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';

/**
 * The login menu in the nav bar: a "Sign in" link when signed out, and an
 * account disclosure (identity + sign out) when signed in.
 *
 * Built as a plain disclosure rather than a listbox/menu widget: it holds one
 * action, so a button with `aria-expanded` is both simpler and more honest than
 * claiming ARIA menu semantics that would then need arrow-key handling.
 */

const CONTROL_CLASS =
  'inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100';

const PANEL_ID = 'auth-menu-panel';

export default function AuthMenu() {
  const { session, ready, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      containerRef.current?.querySelector('button')?.focus();
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  // Same footprint as the real control, so a signed-in visitor never sees a
  // one-frame "Sign in" while the cookie is still being read.
  if (!ready) {
    return <span aria-hidden className="block h-[30px] w-[68px] rounded-lg" />;
  }

  if (!session) {
    return (
      <Link href="/login" aria-label="Sign in" className={CONTROL_CLASS}>
        <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
        </svg>
        <span className="hidden sm:inline">Sign in</span>
      </Link>
    );
  }

  const initial = session.kind === 'visitor' ? 'V' : session.name.charAt(0).toUpperCase();

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={PANEL_ID}
        aria-label={`Account menu for ${session.name}`}
        className={CONTROL_CLASS}
      >
        <span
          aria-hidden
          className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[9px] font-bold text-white dark:bg-indigo-500"
        >
          {initial}
        </span>
        <span className="hidden max-w-[9rem] truncate sm:inline">{session.name}</span>
        <svg
          aria-hidden
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={open ? 'rotate-180 transition' : 'transition'}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          id={PANEL_ID}
          className="absolute right-0 z-30 mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="border-b border-slate-100 px-3 py-2.5 dark:border-slate-800">
            <p className="truncate text-xs font-medium text-slate-900 dark:text-slate-100">
              {session.name}
            </p>
            <p className="mt-0.5 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
              {session.kind === 'visitor'
                ? 'Visitor session — sample data only'
                : 'Demo session — no password stored'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              signOut();
              // A full navigation so middleware re-checks the now-missing cookie.
              window.location.assign('/');
            }}
            className="w-full px-3 py-2.5 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-500 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
