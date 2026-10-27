import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend';
import { authJson } from '@/lib/auth-route';
import type { AuthResult } from '@/lib/types';

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { idToken?: string } | null;
  if (!body?.idToken) {
    return NextResponse.json({ message: 'Google credential is required' }, { status: 400 });
  }
  const response = await backendFetch('auth/google', {
    method: 'POST',
    body: JSON.stringify({ idToken: body.idToken }),
  });
  const data = (await response.json().catch(() => ({}))) as AuthResult;
  if (!response.ok) {
    return NextResponse.json(data, { status: response.status, headers: { 'Cache-Control': 'no-store' } });
  }
  return authJson(data);
}
