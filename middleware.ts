import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { LOGIN_PATH, SESSION_COOKIE, decodeSession, isProtectedPath, safeNextPath } from '@/lib/session';

/**
 * Route gate for the demo session.
 *
 * Runs before the page is served, so an unauthenticated request to a protected
 * route never receives the dashboard HTML — the redirect happens at the edge and
 * the browser only ever sees /login. The check itself is deliberately shallow:
 * see lib/session.ts for why this is a demo gate rather than authentication.
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = decodeSession(request.cookies.get(SESSION_COOKIE)?.value);

  if (isProtectedPath(pathname) && !session) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.search = '';
    url.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  // A signed-in visitor has no reason to see the form again.
  if (pathname === LOGIN_PATH && session) {
    const url = request.nextUrl.clone();
    url.pathname = safeNextPath(request.nextUrl.searchParams.get('next')) ?? '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // /api and every static asset stay untouched: the gate is about pages.
  matcher: ['/dashboard/:path*', '/transactions/:path*', '/connections/:path*', '/login'],
};
