'use client';

import type { ApiErrorBody } from './types';

export class ClientApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ClientApiError';
  }
}

async function parse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export async function api<T>(
  path: string,
  init: RequestInit & { idempotencyKey?: string } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...((init.headers as Record<string, string>) ?? {}),
  };
  if (init.body) headers['Content-Type'] = 'application/json';
  if (init.idempotencyKey) headers['Idempotency-Key'] = init.idempotencyKey;

  const response = await fetch(`/api/proxy/${path.replace(/^\/+/, '')}`, {
    ...init,
    headers,
    cache: 'no-store',
  });
  const body = await parse(response);
  if (!response.ok) {
    const error = body as ApiErrorBody | null;
    const message = Array.isArray(error?.message)
      ? error?.message.join(' · ')
      : error?.message || `HTTP ${response.status}`;
    throw new ClientApiError(message, response.status);
  }
  return body as T;
}

export async function sessionPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`/api/session/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  const data = await parse(response);
  if (!response.ok) {
    const error = data as ApiErrorBody | null;
    const message = Array.isArray(error?.message)
      ? error?.message.join(' · ')
      : error?.message || `HTTP ${response.status}`;
    throw new ClientApiError(message, response.status);
  }
  return data as T;
}
