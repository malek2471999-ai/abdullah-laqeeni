import type { AuthResult } from './types';

export const API_INTERNAL_URL = (
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:4000'
).replace(/\/+$/, '');

export class BackendError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown,
  ) {
    super(message);
    this.name = 'BackendError';
  }
}

export async function backendFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const url = `${API_INTERNAL_URL}/${path.replace(/^\/+/, '')}`;
  return fetch(url, {
    cache: 'no-store',
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });
}

export function messageFromBody(body: unknown, fallback: string): string {
  if (!body || typeof body !== 'object') return fallback;
  const message = (body as { message?: unknown }).message;
  if (Array.isArray(message)) return message.join(' · ');
  if (typeof message === 'string' && message.trim()) return message;
  return fallback;
}

export async function refreshSession(
  refreshToken: string,
): Promise<AuthResult | null> {
  const response = await backendFetch('auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
  if (!response.ok) return null;
  return (await response.json()) as AuthResult;
}

export async function jsonResponse(
  data: unknown,
  status = 200,
  headers?: Record<string, string>,
): Promise<Response> {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...headers,
    },
  });
}
