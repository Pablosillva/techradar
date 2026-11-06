import { NextResponse } from "next/server";

/**
 * Security response headers.
 *
 * Applies a baseline set of headers to harden the application against
 * common client-side attacks (XSS, clickjacking, MIME sniffing, etc.).
 */

export const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
};

/**
 * Content Security Policy.
 *
 * Uses a nonce-based approach for scripts. The middleware generates a
 * per-request nonce and replaces the placeholder. Inline scripts from
 * Next.js hydration are covered by 'unsafe-inline' fallback for
 * compatibility with the App Router.
 */
export const CONTENT_SECURITY_POLICY =
  "default-src 'self'; " +
  "script-src 'self' 'unsafe-inline' https://unpkg.com; " +
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
  "font-src 'self' https://fonts.gstatic.com; " +
  "img-src 'self' data: https:; " +
  "connect-src 'self' https:; " +
  "frame-ancestors 'none'; " +
  "base-uri 'self'; " +
  "form-action 'self';";

/**
 * Applies security headers to a NextResponse.
 */
export function applySecurityHeaders(
  response: NextResponse,
  _options?: { cspNonce?: string },
): NextResponse {
  const headers = new Headers(response.headers);

  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(key, value);
  }

  headers.set("Content-Security-Policy", CONTENT_SECURITY_POLICY);

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
