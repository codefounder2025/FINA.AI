'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { MIN_NAME_LENGTH, MIN_PASSWORD_LENGTH, useAuth } from '@/components/AuthProvider';
import { safeNextPath } from '@/lib/session';

/**
 * Demo sign-in / create-account screen.
 *
 * Both panels behave like the real thing — labels, autofill hints, inline
 * validation, an alert region — but nothing is verified against a backend and
 * nothing is transmitted. `?next=` is read from the URL at submit time rather
 * than through `useSearchParams`, which keeps the page statically rendered
 * instead of forcing it behind a Suspense boundary.
 */

type Mode = 'signin' | 'signup';

const DEMO_EMAIL = 'student@fina.ai';
const DEMO_PASSWORD = 'demo1234';

const FIELD_CLASS =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus-visible:border-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';

const LABEL_CLASS = 'block text-xs font-medium text-slate-700 dark:text-slate-300';

function resolveTarget(): string {
  const requested = new URLSearchParams(window.location.search).get('next');
  return safeNextPath(requested) ?? '/dashboard';
}

export default function LoginPage() {
  const { signIn, createAccount, continueAsVisitor } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignUp = mode === 'signup';

  // A full navigation rather than router.push: middleware is guaranteed to
  // re-run, and a pre-sign-in redirect cannot linger in the router cache.
  function enter() {
    window.location.assign(resolveTarget());
  }

  /** Switching panels must not carry the previous panel's error across. */
  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setShowPassword(false);
    if (next === 'signup') {
      setPassword('');
      setEmail('');
    } else {
      setEmail(DEMO_EMAIL);
      setPassword(DEMO_PASSWORD);
    }
    setConfirmPassword('');
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = isSignUp
      ? createAccount(name, email, password, confirmPassword)
      : signIn(email, password);
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
          {isSignUp ? 'Create your FINA' : 'Sign in to FINA'}
          <span className="text-indigo-600 dark:text-indigo-400">.AI</span>
          {isSignUp ? ' account' : ''}
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {isSignUp
            ? 'Pick any name, email and password — this demo stores none of them.'
            : 'Use the email/password panel below, or skip it and continue as a visitor.'}
        </p>

        <div
          role="group"
          aria-label="Sign in or create an account"
          className="mt-5 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800"
        >
          {(
            [
              ['signin', 'Sign in'],
              ['signup', 'Create account'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              onClick={() => switchMode(value)}
              className={
                mode === value
                  ? 'rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-500 dark:bg-slate-950 dark:text-slate-100'
                  : 'rounded-md px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-500 dark:text-slate-400 dark:hover:text-slate-100'
              }
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} noValidate className="mt-5 space-y-4">
          {isSignUp && (
            <div>
              <label htmlFor="name" className={LABEL_CLASS}>
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                aria-describedby={error ? 'login-error' : undefined}
                className={`mt-1.5 ${FIELD_CLASS}`}
                placeholder="Ka Ming Chan"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className={LABEL_CLASS}>
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
              className={`mt-1.5 ${FIELD_CLASS}`}
              placeholder="you@university.edu.hk"
            />
          </div>

          <div>
            <label htmlFor="password" className={LABEL_CLASS}>
              Password
            </label>
            <div className="relative mt-1.5">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-describedby={error ? 'login-error' : undefined}
                className={`${FIELD_CLASS} pr-16`}
                placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
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

          {isSignUp && (
            <div>
              <label htmlFor="confirm-password" className={LABEL_CLASS}>
                Confirm password
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                aria-describedby={error ? 'login-error' : undefined}
                className={`mt-1.5 ${FIELD_CLASS}`}
                placeholder="Type it once more"
              />
            </div>
          )}

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
            {isSignUp ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
          {isSignUp ? (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="font-medium text-indigo-600 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:text-indigo-400"
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              New to FINA.AI?{' '}
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className="font-medium text-indigo-600 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:text-indigo-400"
              >
                Create an account
              </button>
            </>
          )}
        </p>

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
          This sign-in and sign-up are a front-end demo
        </h2>
        <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
          No account is created, no password is stored and no request is sent anywhere — the
          session is a cookie in your own browser that lasts 12 hours. Signing in accepts any
          valid email and any password of {MIN_PASSWORD_LENGTH} or more characters; creating an
          account additionally asks for a name of {MIN_NAME_LENGTH} or more characters and a
          matching confirmation. An obviously malformed email address or a mismatched
          confirmation is still rejected, because the validation itself is real.
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
