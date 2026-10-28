import { NextResponse } from "next/server";

/**
 * Contact form endpoint.
 *
 * Validates input and rate-limits per in-memory bucket, but does NOT deliver the
 * message yet — no provider is wired up. Connect `deliver()` to an email service
 * (Resend, SES, Postmark) before relying on it; otherwise messages are accepted
 * and discarded.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_LENGTH = 4000;
const RATE_LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000;

// Note: in-memory only. On serverless this resets per cold start and is not a
// durable rate limit — put a real limit at the edge/CDN for production.
const buckets = new Map<string, number[]>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= RATE_LIMIT) {
    buckets.set(key, hits);
    return true;
  }
  hits.push(now);
  buckets.set(key, hits);
  return false;
}

async function deliver(payload: {
  nome: string;
  email: string;
  assunto: string;
  mensagem: string;
}): Promise<boolean> {
  // TODO: forward `payload` to your transactional email provider.
  void payload;
  return true;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";

  if (rateLimited(ip)) {
    return NextResponse.json(
      { message: "Muitas mensagens enviadas. Tente novamente em alguns minutos." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Requisição inválida." }, { status: 400 });
  }

  const get = (key: string) => {
    const raw =
      typeof body === "object" && body !== null && key in body
        ? String((body as Record<string, unknown>)[key] ?? "")
        : "";
    return raw.trim();
  };

  const nome = get("nome");
  const email = get("email");
  const assunto = get("assunto");
  const mensagem = get("mensagem");

  if (!nome || nome.length > 120) {
    return NextResponse.json({ message: "Informe seu nome." }, { status: 422 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { message: "Informe um e-mail válido." },
      { status: 422 },
    );
  }
  if (!mensagem || mensagem.length > MAX_LENGTH) {
    return NextResponse.json(
      { message: "Escreva uma mensagem com até 4000 caracteres." },
      { status: 422 },
    );
  }

  const ok = await deliver({ nome, email, assunto, mensagem });
  if (!ok) {
    return NextResponse.json(
      { message: "Não foi possível enviar agora. Tente mais tarde." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    message: "Mensagem enviada! Respondemos em até 3 dias úteis.",
  });
}
