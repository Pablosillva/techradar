/**
 * Extracts the client IP address from a Next.js Request.
 *
 * Checks X-Forwarded-For (first IP in the chain), then X-Real-IP,
 * then falls back to "unknown".
 */

export function getIP(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    // X-Forwarded-For: client, proxy1, proxy2 — take the leftmost (client)
    return xff.split(",")[0].trim() || "unknown";
  }

  const xri = request.headers.get("x-real-ip");
  if (xri) return xri.trim();

  return "unknown";
}
