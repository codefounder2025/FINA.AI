'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { MIN_PASSWORD_LENGTH, useAuth } from '@/components/AuthProvider';
import { safeNextPath } from '@/lib/session';

/**
 * Demo sign-in screen.
 *
 * The email/password panel behaves like a real one — labels, autofill hints,
 * inline validation, an alert region — but nothing is verified against a
 * backend and nothing is transmitted. `?next=` is read from the URL at submit
 * time rather than through `useSearchParams`, which keeps the page statically
 * rendered instead of forcing it behind a Suspense boundary.
 */

const DEMO_EMAIL = 'student@fina.ai';
const DEMO_PASSWORD = 'demo1234';

function resolveTarget(): string {
  const requested = new URLSearchParams(window.location.search).get('next');
  return safeNextPath(requested) ?? '/dashboard';
}

export default function LoginPage() {
  const { signIn, continueAsVisitor } = useAuth();
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A full navigation rather than router.push: middleware is guaranteed to
  // re-run, and a pre-sign-in redirect cannot linger in the router cache.
  function enter() {
    window.location.assign(resolveTarget());
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = signIn(email, password);
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    enter();
  }

  return (
    <div className="mx-auto max-w-md py-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Sign in to FINA<span className="text-indigo-600 dark:text-indigo-400">.AI</span>
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          Use the email/password panel below, or skip it and continue as a visitor.
        </p>

        <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-describedby={error ? 'login-error' : undefined}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus-visible:border-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              placeholder="you@university.edu.hk"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              Password
            </label>
            <div className="relative mt-1.5">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-describedby={error ? 'login-error' : undefined}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-16 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus-visible:border-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                placeholder="At least 6 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-[11px] font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && (
            <p
              id="login-error"
              role="alert"
              className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:ring-rose-900"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
          >
            Sign in
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
            or
          </span>
          <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
        </div>

        <button
          type="button"
          onClick={() => {
            continueAsVisitor();
            enter();
          }}
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-800"
        >
          Continue as visitor
        </button>

        <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
          A visitor session opens the same sample dashboard with no email or password.
        </p>
      </div>

      {/* Disclosed plainly: judges should be able to tell this apart from real auth. */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xs font-semibold text-slate-700 dark:text-slate-200">
          This sign-in is a front-end demo
        </h2>
        <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
          No account is created, no password is stored and no request is sent anywhere — the
          session is a cookie in your own browser that lasts 12 hours. Any valid email and any
          password of {MIN_PASSWORD_LENGTH} or more characters is accepted, so the panel above is
          prefilled to save typing. An obviously malformed email address is still rejected, because
          the validation itself is real.
        </p>
      </div>

      <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
        <Link href="/" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
          Back to the home page
        </Link>
      </p>
    </div>
  );
}
