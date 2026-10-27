import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ACCESS_COOKIE } from './cookies';
import { backendFetch, messageFromBody } from './backend';
import type { User } from './types';

export async function getAccessToken(): Promise<string | null> {
  return (await cookies()).get(ACCESS_COOKIE)?.value ?? null;
}

export async function getSessionUser(): Promise<User | null> {
  const token = await getAccessToken();
  if (!token) return null;
  try {
    const response = await backendFetch('auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return null;
    return (await response.json()) as User;
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<User> {
  const user = await getSessionUser();
  if (!user) redirect('/login?expired=1');
  return user;
}

export class ServerApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function serverApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  if (!token) redirect('/login?expired=1');
  let response: Response;
  try {
    response = await backendFetch(path, {
      ...init,
      headers: { ...init.headers, Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new ServerApiError('network', 0);
  }
  if (response.status === 401) redirect('/login?expired=1');
  if (response.status === 404) throw new ServerApiError('notFound', 404);
  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    throw new ServerApiError(messageFromBody(body, 'requestFailed'), response.status);
  }
  return (await response.json()) as T;
}

/**
 * Best-effort fetch used for optional dashboard data (unread counters and the
 * like). It never redirects; the caller renders a sensible fallback instead.
 */
export async function tryServerApi<T>(path: string, init: RequestInit = {}): Promise<T | null> {
  const token = await getAccessToken();
  if (!token) return null;
  try {
    const response = await backendFetch(path, {
      ...init,
      headers: { ...init.headers, Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}
