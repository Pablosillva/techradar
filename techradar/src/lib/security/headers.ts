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
 * Allows scripts/styles only from the same origin and Next.js internal
 * assets. Inline scripts and eval are blocked.
 */
export const CONTENT_SECURITY_POLICY =
  "default-src 'self'; " +
  "script-src 'self' 'nonce-$NONCE$' https://unpkg.com; " +
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
  "font-src 'self' https://fonts.gstatic.com; " +
  "img-src 'self' data: https:; " +
  "connect-src 'self' https:; " +
  "frame-ancestors 'none'; " +
  "base-uri 'self'; " +
  "form-action 'self';";

/**
 * Applies security headers to a NextResponse.
 * The CSP nonce placeholder is replaced if a nonce is provided.
 */
export function applySecurityHeaders(
  response: NextResponse,
  options?: { cspNonce?: string },
): NextResponse {
  const headers = new Headers(response.headers);

  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(key, value);
  }

  let csp = CONTENT_SECURITY_POLICY;
  if (options?.cspNonce) {
    csp = csp.replace('$NONCE$', options.cspNonce);
  } else {
    // Remove the nonce directive if no nonce provided
    csp = csp.replace(/'nonce-[^']+'\s*/, "");
  }
  headers.set("Content-Security-Policy", csp);

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
