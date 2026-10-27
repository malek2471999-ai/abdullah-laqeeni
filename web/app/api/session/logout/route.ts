import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/cookies';
import { backendFetch } from '@/lib/backend';
import { clearAuthCookies } from '@/lib/auth-route';

export async function POST(request: NextRequest) {
  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  if (access) {
    await backendFetch('auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${access}` },
    }).catch(() => undefined);
  }
  const response = NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  // Explicitly overwrite both cookies; also makes sign-out work if the API is down.
  void request.cookies.get(REFRESH_COOKIE);
  return clearAuthCookies(response);
}
