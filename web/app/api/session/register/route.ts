import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend';
import { authJson } from '@/lib/auth-route';
import type { AuthResult } from '@/lib/types';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
  }

  const response = await backendFetch('auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: request.headers.get('x-forwarded-for')
      ? { 'X-Forwarded-For': request.headers.get('x-forwarded-for') as string }
      : {},
  });
  const data = (await response.json().catch(() => ({}))) as AuthResult;
  if (!response.ok) {
    return NextResponse.json(data, { status: response.status, headers: { 'Cache-Control': 'no-store' } });
  }
  return authJson(data, response.status);
}
