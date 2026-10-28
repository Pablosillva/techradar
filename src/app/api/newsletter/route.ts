import { NextResponse } from "next/server";

/**
 * Newsletter signup endpoint.
 *
 * Validates the address and returns success, but does NOT persist it yet — no
 * email provider is configured. To make this live, forward `trimmed` to your
 * provider of choice (Resend, Buttondown, Mailchimp) and return `false` when
 * the provider rejects it.
 *
 * Until then the UI confirms optimistically, so do not launch paid traffic here
 * without wiring this up first.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function subscribe(email: string): Promise<boolean> {
  // TODO: forward `email` to your ESP.
  void email;
  return true;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Requisição inválida." }, { status: 400 });
  }

  const email =
    typeof body === "object" && body !== null && "email" in body
      ? String((body as { email: unknown }).email ?? "")
      : "";

  const trimmed = email.trim().toLowerCase();

  if (!EMAIL_RE.test(trimmed) || trimmed.length > 254) {
    return NextResponse.json(
      { message: "Informe um e-mail válido." },
      { status: 422 },
    );
  }

  const ok = await subscribe(trimmed);
  if (!ok) {
    return NextResponse.json(
      { message: "Não foi possível cadastrar agora. Tente mais tarde." },
      { status: 502 },
    );
  }

  return NextResponse.json({ message: "Cadastro confirmado! Até breve." });
}
