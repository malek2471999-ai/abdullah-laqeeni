import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend';
import { authJson } from '@/lib/auth-route';
import type { AuthResult } from '@/lib/types';

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | { email?: string; password?: string }
    | null;
  if (!body?.email || !body?.password) {
    return NextResponse.json({ message: 'E-mail and password are required' }, { status: 400 });
  }

  const response = await backendFetch('auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: body.email, password: body.password }),
    headers: forwardedHeaders(request),
  });
  const data = (await response.json().catch(() => ({}))) as AuthResult;
  if (!response.ok) {
    return NextResponse.json(data, { status: response.status, headers: { 'Cache-Control': 'no-store' } });
  }
  if (data.twoFactorRequired) {
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
  }
  return authJson(data);
}

function forwardedHeaders(request: NextRequest): Record<string, string> {
  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip');
  return ip ? { 'X-Forwarded-For': ip } : {};
}
