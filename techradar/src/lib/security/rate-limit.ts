import { NextResponse } from "next/server";
import { getIP } from "./ip";

/** In-memory rate-limit store. One entry per (ip, endpoint). */
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

/** Cleanup interval: remove expired entries every 5 minutes. */
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now > entry.resetTime) store.delete(key);
    }
  }, 5 * 60 * 1000);
  cleanupTimer.unref?.();
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Simple fixed-window rate limiter.
 *
 * @param identifier - Unique key (e.g. "127.0.0.1:/api/entrar")
 * @param limit - Max requests per window
 * @param windowMs - Window size in milliseconds
 */
export function rateLimit(
  identifier: string,
  { limit = 60, windowMs = 60_000 }: { limit?: number; windowMs?: number } = {},
): RateLimitResult {
  ensureCleanup();
  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || now > entry.resetTime) {
    store.set(identifier, { count: 1, resetTime: now + windowMs });
    return { allowed: true, limit, remaining: limit - 1, reset: now + windowMs };
  }

  entry.count += 1;
  const remaining = Math.max(0, limit - entry.count);
  return { allowed: entry.count <= limit, limit, remaining, reset: entry.resetTime };
}

/** Builds standard rate-limit response headers. */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "RateLimit-Limit": String(result.limit),
    "RateLimit-Remaining": String(result.remaining),
    "RateLimit-Reset": String(Math.ceil(result.reset / 1000)),
  };
}

/**
 * Wraps a route handler with rate limiting.
 * Returns a 429 response when the limit is exceeded.
 */
export async function withRateLimit(
  identifier: string,
  handler: () => Promise<NextResponse>,
  options?: { limit?: number; windowMs?: number },
): Promise<NextResponse> {
  const result = rateLimit(identifier, options);
  if (!result.allowed) {
    return NextResponse.json(
      { error: "Muitas requisições. Tente novamente mais tarde.", code: "RATE_LIMITED" },
      { status: 429, headers: rateLimitHeaders(result) },
    );
  }

  const response = await handler();

  // Merge rate-limit headers into the response.
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(rateLimitHeaders(result))) {
    headers.set(key, value);
  }

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
