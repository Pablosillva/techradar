/**
 * Helpers de requisição para componentes client.
 *
 * Toda mutação feita pelo navegador precisa enviar o token CSRF lido do
 * cookie `csrf_token` no header `X-CSRF-Token`. Centralizar isso evita que
 * novas telas esqueçam a proteção e recebam 403.
 */

const CSRF_COOKIE_NAME = "csrf_token";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function readCsrfToken(): string | null {
  if (typeof document === "undefined") return null;

  const prefix = `${CSRF_COOKIE_NAME}=`;
  const cookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));

  if (!cookie) return null;

  return decodeURIComponent(cookie.slice(prefix.length));
}

/**
 * fetch com CSRF automático. Não define Content-Type para permitir
 * `FormData` (upload) sem quebrar o boundary.
 */
export async function apiFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);

  if (!SAFE_METHODS.has(method)) {
    const token = readCsrfToken();
    if (token) headers.set("X-CSRF-Token", token);
  }

  return fetch(url, {
    ...init,
    method,
    headers,
    credentials: init.credentials ?? "same-origin",
  });
}

/**
 * Executa a requisição e devolve `data` da resposta padrão da API
 * (`{ data }` em sucesso, `{ error }` em erro).
 */
export async function apiJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await apiFetch(url, init);
  const body = (await response.json().catch(() => null)) as
    | { data?: T; error?: string }
    | null;

  if (!response.ok) {
    throw new Error(body?.error ?? `Erro na requisição (${response.status})`);
  }

  return body?.data as T;
}
