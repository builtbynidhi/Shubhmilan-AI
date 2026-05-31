/**
 * API client for the Vercel `/api` backend.
 *
 * `apiFetch` attaches the Clerk session JWT (via a token getter registered by
 * the Clerk→store bridge in useAuth) and returns parsed JSON. It's the single
 * choke-point all data hooks use to talk to the backend.
 */

let tokenGetter: (() => Promise<string | null>) | null = null;

/** Registered once by useAuth so non-hook code can fetch a fresh Clerk token. */
export function setTokenGetter(fn: (() => Promise<string | null>) | null): void {
  tokenGetter = fn;
}

export interface ApiFetchOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  /** Skip attaching the auth token (for public endpoints). */
  public?: boolean;
}

export async function apiFetch<T = unknown>(
  path: string,
  opts: ApiFetchOptions = {}
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (!opts.public && tokenGetter) {
    const token = await tokenGetter();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(path, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body != null ? JSON.stringify(opts.body) : undefined,
  });

  if (!res.ok) {
    const detail = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(detail.error || `Request failed: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
