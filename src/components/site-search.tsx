"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Newsletter signup. Posts to /api/newsletter, which validates the address and
 * is the single place to plug in an email provider (Resend, Buttondown, etc.).
 */
export function SiteSearch({
  variant = "inline",
  className,
}: {
  variant?: "inline" | "newsletter";
  className?: string;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = email.trim();
    if (!value) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      });
      const data = (await res.json()) as { message?: string };

      if (!res.ok) {
        setStatus("error");
        setMessage(data.message ?? "Não foi possível cadastrar agora.");
        return;
      }
      setStatus("done");
      setMessage(data.message ?? "Cadastro confirmado!");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Erro de conexão. Tente novamente.");
    }
  }

  if (status === "done") {
    return (
      <p
        className={cn(
          "flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2.5 text-sm text-success",
          className,
        )}
        role="status"
      >
        <Check className="size-4 shrink-0" aria-hidden="true" />
        {message}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className={className}>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Seu e-mail"
          aria-label="Seu e-mail"
          autoComplete="email"
          className="h-10 flex-1 rounded-lg border border-line bg-bg-elevated px-3 text-sm text-fg placeholder:text-subtle transition-colors focus:border-brand focus:outline-none"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-strong disabled:opacity-60"
        >
          {status === "loading" ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <ArrowRight className="size-4" aria-hidden="true" />
          )}
          {variant === "newsletter" ? "Inscrever-se" : "Assinar"}
        </button>
      </div>

      {status === "error" && (
        <p role="alert" className="mt-2 text-xs text-danger">
          {message}
        </p>
      )}
    </form>
  );
}
