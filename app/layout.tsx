import type { Metadata } from 'next';
import './globals.css';
import NavBar from '@/components/NavBar';

export const metadata: Metadata = {
  title: 'FINA.AI — Your money, finally in one place',
  description:
    'FINA.AI aggregates bank transactions, Octopus spending and investment holdings into one dashboard, then turns the numbers into plain-language insights. Demo runs entirely on mock data.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <NavBar />
        <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-8 sm:px-6">{children}</main>
        <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
          FINA.AI · BUHack 2.0 · FinTech track · All data is mock — no live bank, Octopus or
          brokerage connections.
        </footer>
      </body>
    </html>
  );
}
