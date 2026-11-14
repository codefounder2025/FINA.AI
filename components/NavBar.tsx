'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/transactions', label: 'Transactions' },
  { href: '/connections', label: 'Connections' },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white dark:bg-slate-100 dark:text-slate-900">
            F
          </span>
          <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            FINA<span className="text-indigo-600 dark:text-indigo-400">.AI</span>
          </span>
          <span className="hidden rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500 sm:inline dark:bg-slate-800 dark:text-slate-400">
            Mock data
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <nav className="flex items-center gap-1 text-sm">
            {LINKS.map((link) => {
              const active =
                link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3 py-1.5 font-medium transition ${
                    active
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* After the nav links in DOM order, as specified. */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
