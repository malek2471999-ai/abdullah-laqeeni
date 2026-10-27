import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend';

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { token?: string } | null;
  const response = await backendFetch('auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token: body?.token ?? '' }),
  });
  const data = await response.json().catch(() => ({}));
  return NextResponse.json(data, {
    status: response.status,
    headers: { 'Cache-Control': 'no-store' },
  });
}
