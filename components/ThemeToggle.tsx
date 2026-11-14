'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Three-state theme control: Light -> Dark -> System.
 *
 * The chosen value is persisted in localStorage under `THEME_STORAGE_KEY` and
 * re-applied before first paint by the inline script in app/layout.tsx (see
 * that file for why). "System" follows `prefers-color-scheme` and keeps
 * following it while the page is open.
 */

export type Theme = 'light' | 'dark' | 'system';

export const THEME_STORAGE_KEY = 'fina-theme';

const ORDER: Theme[] = ['light', 'dark', 'system'];

const LABELS: Record<Theme, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};

/** Narrowed so a corrupted localStorage value can never break the toggle. */
function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark' || value === 'system';
}

function readStoredTheme(): Theme {
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(raw) ? raw : 'system';
  } catch {
    return 'system';
  }
}

function prefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/** Applies a theme to <html>. Mirrors the inline boot script exactly. */
function applyTheme(theme: Theme) {
  const dark = theme === 'dark' || (theme === 'system' && prefersDark());
  document.documentElement.classList.toggle('dark', dark);
}

function ThemeIcon({ theme }: { theme: Theme }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  if (theme === 'light') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    );
  }

  if (theme === 'dark') {
    return (
      <svg {...common}>
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

export default function ThemeToggle() {
  // Starts as "system" so the first client render matches the server render;
  // the real stored value is read in the effect below.
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    setTheme(readStoredTheme());
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // While on "System", follow live OS changes.
  useEffect(() => {
    if (theme !== 'system') return;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [theme]);

  const cycle = useCallback(() => {
    setTheme((current) => {
      const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        // Storage can be unavailable (private mode); the toggle still works
        // for this session because state drives the class.
      }
      return next;
    });
  }, []);

  const nextTheme = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
  const label = `Theme: ${LABELS[theme]}. Activate to switch to ${LABELS[nextTheme]}.`;

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={label}
      title={label}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
    >
      <ThemeIcon theme={theme} />
      <span className="hidden sm:inline">{LABELS[theme]}</span>
    </button>
  );
}
