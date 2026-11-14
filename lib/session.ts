/**
 * Demo session model.
 *
 * This is a front-end gate, not authentication. There are no accounts, no
 * password store and no server-side user record: the cookie this module encodes
 * holds nothing but a display name and a timestamp, and the browser issues it
 * itself. It exists so the app has a real "signed in" surface to demo, and so a
 * visitor can always get in through the visitor path.
 *
 * Kept dependency-free on purpose: `middleware.ts` runs on the edge runtime and
 * imports from here.
 */

export const SESSION_COOKIE = 'fina-session';
export const LOGIN_PATH = '/login';

/** 12 hours — long enough for a demo session, short enough to expire. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

export type SessionKind = 'user' | 'visitor';

export interface Session {
  kind: SessionKind;
  /** Email address for a user session; empty for a visitor session. */
  email: string;
  /** What the nav shows: the email, or "Visitor". */
  name: string;
  /** ISO timestamp of when the session was created. */
  since: string;
}

export function encodeSession(session: Session): string {
  return encodeURIComponent(JSON.stringify(session));
}

function isSession(value: unknown): value is Session {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    (candidate.kind === 'user' || candidate.kind === 'visitor') &&
    typeof candidate.email === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.since === 'string'
  );
}

function decodeComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Accepts the raw cookie value in either its encoded or already-decoded form.
 * Some cookie parsers decode automatically and some do not, and getting that
 * wrong would lock a signed-in visitor out, so both are tried.
 */
export function decodeSession(raw: string | undefined | null): Session | null {
  if (!raw) return null;
  for (const candidate of [decodeComponent(raw), raw]) {
    try {
      const parsed: unknown = JSON.parse(candidate);
      if (isSession(parsed)) return parsed;
    } catch {
      // Try the next candidate.
    }
  }
  return null;
}

/** Routes that require a session. The landing page and /login stay public. */
const PROTECTED_PREFIXES = ['/dashboard', '/transactions', '/connections'];

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Only same-site absolute paths are allowed as a post-sign-in destination, so a
 * crafted `?next=` cannot bounce a visitor to another origin.
 */
export function safeNextPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return null;
  return value;
}
