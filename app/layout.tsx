import type { Metadata } from 'next';
import './globals.css';
import NavBar from '@/components/NavBar';
import { PortfolioProvider } from '@/components/PortfolioProvider';

export const metadata: Metadata = {
  title: 'FINA.AI — Your money, finally in one place',
  description:
    'FINA.AI aggregates bank transactions, Octopus spending and investment holdings into one dashboard, then turns the numbers into plain-language insights. Demo runs on a bundled sample dataset.',
};

/**
 * Runs before first paint so the correct palette is on <html> straight away —
 * without it, a dark-theme user would see a light flash on every reload.
 * The storage key must match `THEME_STORAGE_KEY` in components/ThemeToggle.tsx.
 */
const THEME_BOOT_SCRIPT = `(function(){try{var t=localStorage.getItem('fina-theme')||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the boot script mutates <html>'s class list
    // before React hydrates, which is intentional.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="min-h-screen">
        <PortfolioProvider>
          <NavBar />
          <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-8 sm:px-6">{children}</main>
          <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-600 dark:border-slate-800 dark:text-slate-400">
            FINA.AI · BUHack 2.0 · FinTech track · All data is a bundled sample — no live bank,
            Octopus or brokerage connections.
          </footer>
        </PortfolioProvider>
      </body>
    </html>
  );
}
