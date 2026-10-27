import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend';
import { authJson } from '@/lib/auth-route';
import type { AuthResult } from '@/lib/types';

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | { challengeToken?: string; code?: string }
    | null;
  if (!body?.challengeToken || !body?.code) {
    return NextResponse.json({ message: 'Challenge and code are required' }, { status: 400 });
  }

  const response = await backendFetch('auth/2fa/verify', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as AuthResult;
  if (!response.ok) {
    return NextResponse.json(data, { status: response.status, headers: { 'Cache-Control': 'no-store' } });
  }
  return authJson(data);
}
