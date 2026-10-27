import { NextResponse } from 'next/server';
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  accessCookieOptions,
  refreshCookieOptions,
} from './cookies';
import type { AuthResult } from './types';

export function applyAuthCookies(response: NextResponse, auth: AuthResult): NextResponse {
  if (auth.accessToken) response.cookies.set(ACCESS_COOKIE, auth.accessToken, accessCookieOptions);
  if (auth.refreshToken) {
    response.cookies.set(REFRESH_COOKIE, auth.refreshToken, refreshCookieOptions);
  }
  return response;
}

export function clearAuthCookies(response: NextResponse): NextResponse {
  response.cookies.set(ACCESS_COOKIE, '', { ...accessCookieOptions, maxAge: 0 });
  response.cookies.set(REFRESH_COOKIE, '', { ...refreshCookieOptions, maxAge: 0 });
  return response;
}

export function authJson(auth: AuthResult, status = 200): NextResponse {
  const response = NextResponse.json(auth, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
  return applyAuthCookies(response, auth);
}
