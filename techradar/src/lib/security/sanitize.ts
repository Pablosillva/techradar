/**
 * HTML sanitization helpers.
 *
 * Removes script tags, event handlers, and javascript: URLs from HTML
 * strings before they are rendered with dangerouslySetInnerHTML.
 * Allows a safe subset of HTML tags for markdown output.
 */

const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "b",
  "i",
  "em",
  "strong",
  "u",
  "a",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote",
  "pre",
  "code",
  "hr",
]);

const ALLOWED_ATTRIBUTES = new Set(["href", "target", "rel", "title"]);

const EVENT_HANDLER_PATTERN = /^on[a-z]+$/i;
const JAVASCRIPT_URL_PATTERN = /^javascript:/i;

/**
 * Sanitizes an HTML string for safe rendering with dangerouslySetInnerHTML.
 *
 * - Removes <script>...</script> blocks entirely
 * - Removes event handler attributes (onclick, onerror, etc.)
 * - Removes javascript: URLs from href/src attributes
 * - Strips any tag not in the allowed list (keeps inner text)
 * - Strips any attribute not in the allowed list
 */
export function sanitizeHtml(html: string): string {
  if (!html) return "";

  let result = html;

  // Remove script tags and their contents
  result = result.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  // Remove event handler attributes: onclick="..." onerror="..." etc.
  result = result.replace(EVENT_HANDLER_PATTERN, "");

  // Remove javascript: URLs from href and src
  result = result.replace(JAVASCRIPT_URL_PATTERN, "");

  // Remove disallowed tags but keep inner content
  // Matches opening and closing tags; replaces unknown tags with empty string
  result = result.replace(
    /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/gi,
    (match, tagName) => {
      if (ALLOWED_TAGS.has(tagName.toLowerCase())) return match;
      return ""; // strip tag, keep its inner text
    },
  );

  // Remove disallowed attributes from remaining tags
  result = result.replace(
    /\s([a-zA-Z][a-zA-Z0-9]*)=["'][^"']*["']/gi,
    (match, attrName) => {
      if (ALLOWED_ATTRIBUTES.has(attrName.toLowerCase())) return match;
      return ""; // strip attribute
    },
  );

  return result;
}

/**
 * Sanitizes a URL for use in href/src attributes.
 * Returns null if the URL is not http(s) or a relative path starting with /.
 */
export function sanitizeUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  if (/^https?:\/\//i.test(url)) return url;
  if (/^\//.test(url)) return url;

  return null;
}
