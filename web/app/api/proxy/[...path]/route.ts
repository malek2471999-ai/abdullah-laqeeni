import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/cookies';
import { backendFetch, refreshSession } from '@/lib/backend';
import { applyAuthCookies, clearAuthCookies } from '@/lib/auth-route';

type Context = { params: Promise<{ path: string[] }> };

const FORWARDED_REQUEST_HEADERS = [
  'content-type',
  'idempotency-key',
  'user-agent',
  'x-forwarded-for',
  'x-real-ip',
];

async function proxy(request: NextRequest, context: Context): Promise<NextResponse> {
  const { path: segments } = await context.params;
  const path = segments.join('/');
  if (path.split('/').some((part) => part === '..' || part === '')) {
    return NextResponse.json({ message: 'Invalid path' }, { status: 400 });
  }

  const url = new URL(request.url);
  const query = url.search ? url.search : '';
  const method = request.method;
  const hasBody = method !== 'GET' && method !== 'HEAD';
  const body = hasBody ? await request.text() : undefined;

  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;

  const perform = (token: string | undefined) =>
    backendFetch(`${path}${query}`, {
      method,
      body,
      headers: {
        ...forwardHeaders(request),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

  let response = await perform(access);
  let refreshed = false;
  let renewed: { accessToken?: string; refreshToken?: string } | null = null;

  if (response.status === 401 && refresh) {
    const auth = await refreshSession(refresh).catch(() => null);
    if (auth?.accessToken) {
      renewed = auth;
      refreshed = true;
      response = await perform(auth.accessToken);
    }
  }

  const text = await response.text();
  const contentType = response.headers.get('content-type') ?? 'application/json; charset=utf-8';
  const next = new NextResponse(text, {
    status: response.status,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'no-store',
    },
  });

  if (refreshed && renewed) applyAuthCookies(next, renewed);
  if (response.status === 401) clearAuthCookies(next);
  return next;
}

function forwardHeaders(request: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers[name] = value;
  }
  return headers;
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;
