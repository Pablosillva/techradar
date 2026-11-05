import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * CSRF protection utilities.
 *
 * The CSRF token is stored in a non-httpOnly cookie (`csrf_token`) so the
 * client can read it and send it back as the `X-CSRF-Token` header on
 * state-changing requests. The cookie is SameSite=Strict so it is not sent
 * cross-site by the browser, and the header check defends against
 * cross-origin form submissions that bypass SameSite.
 */

export const CSRF_COOKIE_NAME = "csrf_token";

/** Generates a cryptographically random CSRF token. */
export function generateCsrfToken(): string {
  const buf = new Uint8Array(32);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Reads the CSRF token cookie from the current request context. */
export async function getCsrfTokenFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(CSRF_COOKIE_NAME);
  return cookie ? cookie.value : null;
}

/** Sets the CSRF token cookie on a NextResponse. */
export function setCsrfTokenCookie(response: NextResponse, token: string): void {
  response.headers.set(
    "Set-Cookie",
    `${CSRF_COOKIE_NAME}=${token}; Path=/; SameSite=Strict${
      process.env.NODE_ENV === "production" ? "; Secure; HttpOnly" : ""
    }; Max-Age=604800`,
  );
}

/**
 * Validates that the request includes a CSRF token matching the cookie.
 * Should be called for POST/PUT/PATCH/DELETE endpoints.
 * Returns a discriminated result: { valid: true } or { valid: false; reason: string }.
 */
export function validateCsrfRequest(
  request: Request,
  cookieToken: string | null,
): { valid: true } | { valid: false; reason: string } {
  const headerToken = request.headers.get("X-CSRF-Token");

  if (!cookieToken) {
    return { valid: false, reason: "CSRF token cookie missing" };
  }

  if (!headerToken) {
    return { valid: false, reason: "X-CSRF-Token header missing" };
  }

  // Constant-time comparison to prevent timing attacks.
  if (headerToken.length !== cookieToken.length) {
    return { valid: false, reason: "CSRF token mismatch" };
  }

  let difference = 0;
  for (let i = 0; i < cookieToken.length; i++) {
    difference |= cookieToken.charCodeAt(i) ^ headerToken.charCodeAt(i);
  }

  if (difference !== 0) {
    return { valid: false, reason: "CSRF token mismatch" };
  }

  return { valid: true };
}
