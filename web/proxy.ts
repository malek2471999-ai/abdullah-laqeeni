import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/cookies';
import { refreshSession } from '@/lib/backend';
import { applyAuthCookies, clearAuthCookies } from '@/lib/auth-route';

const AUTH_PATHS = ['/dashboard', '/devices', '/pair', '/notifications', '/security', '/settings'];

function isProtected(pathname: string): boolean {
  return AUTH_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function tokenExpiresSoon(token: string, marginSeconds = 60): boolean {
  try {
    const payloadPart = token.split('.')[1];
    if (!payloadPart) return true;
    const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const payload = JSON.parse(atob(padded)) as { exp?: number };
    if (!payload.exp) return true;
    return payload.exp * 1000 - Date.now() < marginSeconds * 1000;
  } catch {
    return true;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (!isProtected(pathname)) return NextResponse.next();

  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;

  if (!refresh) {
    const login = new URL('/login', request.url);
    login.searchParams.set('next', `${pathname}${search}`);
    return clearAuthCookies(NextResponse.redirect(login));
  }

  if (access && !tokenExpiresSoon(access)) {
    return NextResponse.next();
  }

  const auth = await refreshSession(refresh).catch(() => null);
  if (!auth?.accessToken || !auth.refreshToken) {
    const login = new URL('/login', request.url);
    login.searchParams.set('next', `${pathname}${search}`);
    login.searchParams.set('expired', '1');
    return clearAuthCookies(NextResponse.redirect(login));
  }

  request.cookies.set(ACCESS_COOKIE, auth.accessToken);
  request.cookies.set(REFRESH_COOKIE, auth.refreshToken);
  const response = NextResponse.next({ request });
  return applyAuthCookies(response, auth);
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/devices/:path*',
    '/pair/:path*',
    '/notifications/:path*',
    '/security/:path*',
    '/settings/:path*',
  ],
};
