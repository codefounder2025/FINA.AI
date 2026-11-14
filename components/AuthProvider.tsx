'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  decodeSession,
  encodeSession,
  type Session,
} from '@/lib/session';

/**
 * Demo session state, mirroring the `fina-session` cookie that middleware.ts
 * checks. The cookie is the single source of truth so the server-side gate and
 * the client UI can never disagree about who is signed in.
 *
 * No credentials are validated against anything: signIn() only checks that the
 * input is well-formed, then writes a cookie. Nothing is sent anywhere.
 */

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD_LENGTH = 6;
export const MIN_NAME_LENGTH = 2;

interface AuthContextValue {
  session: Session | null;
  /** False until the cookie has been read, so the nav never flashes a wrong label. */
  ready: boolean;
  /** Returns an error message, or null when the (demo) sign-in succeeded. */
  signIn: (email: string, password: string) => string | null;
  /** Demo account creation: same rules as signIn, plus a name and a confirmation. */
  createAccount: (
    name: string,
    email: string,
    password: string,
    confirmPassword: string,
  ) => string | null;
  continueAsVisitor: () => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readSessionCookie(): Session | null {
  try {
    const prefix = `${SESSION_COOKIE}=`;
    const entry = document.cookie.split(/;\s*/).find((part) => part.startsWith(prefix));
    if (!entry) return null;
    return decodeSession(entry.slice(prefix.length));
  } catch {
    return null;
  }
}

function writeSessionCookie(session: Session) {
  document.cookie = `${SESSION_COOKIE}=${encodeSession(session)}; path=/; max-age=${SESSION_MAX_AGE_SECONDS}; samesite=lax`;
}

function clearSessionCookie() {
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

/** Shared by signIn and createAccount so both agree on what is well-formed. */
function checkCredentials(email: string, password: string): string | null {
  const trimmed = email.trim();
  if (trimmed.length === 0) return 'Enter your email address.';
  if (!EMAIL_PATTERN.test(trimmed)) return 'That does not look like an email address.';
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Your password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  // The cookie is only readable in the browser, so the real value arrives after
  // the first paint; `ready` lets consumers hold off until then.
  useEffect(() => {
    setSession(readSessionCookie());
    setReady(true);
  }, []);

  const signIn = useCallback((email: string, password: string): string | null => {
    const problem = checkCredentials(email, password);
    if (problem) return problem;

    const trimmed = email.trim();
    const next: Session = {
      kind: 'user',
      email: trimmed,
      name: trimmed,
      since: new Date().toISOString(),
    };
    writeSessionCookie(next);
    setSession(next);
    return null;
  }, []);

  const createAccount = useCallback(
    (name: string, email: string, password: string, confirmPassword: string): string | null => {
      const trimmedName = name.trim().replace(/\s+/g, ' ');
      if (trimmedName.length < MIN_NAME_LENGTH) {
        return `Enter your name (at least ${MIN_NAME_LENGTH} characters).`;
      }

      const problem = checkCredentials(email, password);
      if (problem) return problem;

      if (password !== confirmPassword) return 'The two passwords do not match.';

      const next: Session = {
        kind: 'user',
        email: email.trim(),
        name: trimmedName,
        since: new Date().toISOString(),
      };
      writeSessionCookie(next);
      setSession(next);
      return null;
    },
    [],
  );

  const continueAsVisitor = useCallback(() => {
    const next: Session = {
      kind: 'visitor',
      email: '',
      name: 'Visitor',
      since: new Date().toISOString(),
    };
    writeSessionCookie(next);
    setSession(next);
  }, []);

  const signOut = useCallback(() => {
    clearSessionCookie();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({ session, ready, signIn, createAccount, continueAsVisitor, signOut }),
    [session, ready, signIn, createAccount, continueAsVisitor, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider.');
  return value;
}
