import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const response = await backendFetch('auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(body ?? {}),
  });
  const data = await response.json().catch(() => ({ ok: true }));
  return NextResponse.json(data, {
    status: response.status,
    headers: { 'Cache-Control': 'no-store' },
  });
}
