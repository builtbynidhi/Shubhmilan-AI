/**
 * Small helpers for Vercel Node serverless handlers: Clerk auth, JSON replies,
 * method routing, and uniform error handling.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyToken } from "@clerk/backend";

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Verify the Clerk session token from the Authorization header. Returns userId. */
export async function requireUser(req: VercelRequest): Promise<string> {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) throw new HttpError(401, "Missing bearer token");

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) throw new HttpError(500, "CLERK_SECRET_KEY not configured");

  try {
    const payload = await verifyToken(token, { secretKey });
    if (!payload.sub) throw new HttpError(401, "Invalid token");
    return payload.sub;
  } catch {
    throw new HttpError(401, "Invalid or expired token");
  }
}

/** Wrap a handler with uniform error handling (HttpError → status, else 500). */
export function handle(
  fn: (req: VercelRequest, res: VercelResponse) => Promise<void>
) {
  return async (req: VercelRequest, res: VercelResponse): Promise<void> => {
    try {
      await fn(req, res);
    } catch (err) {
      if (err instanceof HttpError) {
        res.status(err.status).json({ error: err.message });
      } else {
        console.error("[api] unhandled error:", err);
        res.status(500).json({
          error: err instanceof Error ? err.message : "Internal error",
        });
      }
    }
  };
}

/** Assert the request method is one of `allowed`, else 405. */
export function assertMethod(req: VercelRequest, ...allowed: string[]): void {
  if (!allowed.includes(req.method ?? "")) {
    throw new HttpError(405, `Method ${req.method} not allowed`);
  }
}
