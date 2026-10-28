"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { Alert, Field, TextInput } from "@/components/tools/tool-ui";

/**
 * Sign-in / sign-up shell.
 *
 * The forms validate input and render realistic states, but no auth backend is
 * connected — the submit handler is intentionally inert. Wire it to your auth
 * provider (Auth.js, Clerk, Supabase) before shipping, and see
 * `src/app/entrar` / `src/app/cadastrar`.
 */
export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [notice, setNotice] = useState<string | null>(null);
  const isRegister = mode === "register";

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setNotice(
      "Autenticação ainda não está conectada nesta versão do site. As ferramentas e os artigos funcionam sem cadastro.",
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {isRegister && (
        <Field label="Nome">
          <TextInput name="nome" required autoComplete="name" />
        </Field>
      )}

      <Field label="E-mail">
        <TextInput name="email" type="email" required autoComplete="email" />
      </Field>

      <Field
        label="Senha"
        hint={
          isRegister
            ? "Mínimo de 12 caracteres. Use o gerador de senhas se quiser."
            : undefined
        }
      >
        <TextInput
          name="senha"
          type="password"
          required
          minLength={isRegister ? 12 : undefined}
          autoComplete={isRegister ? "new-password" : "current-password"}
        />
      </Field>

      {notice && <Alert tone="info">{notice}</Alert>}

      <Button type="submit" className="w-full">
        {isRegister ? "Criar conta" : "Entrar"}
      </Button>

      <p className="text-center text-xs text-subtle">
        {isRegister ? (
          <>
            Já tem conta?{" "}
            <Link href="/entrar" className="text-brand hover:underline">
              Entrar
            </Link>
          </>
        ) : (
          <>
            Não tem conta?{" "}
            <Link href="/cadastrar" className="text-brand hover:underline">
              Cadastre-se
            </Link>
          </>
        )}
      </p>

      <p className="text-center text-xs text-subtle">
        Ou continue lendo sem cadastro —{" "}
        <Link href="/ferramentas" className="text-brand hover:underline">
          use as ferramentas grátis
        </Link>
        .
      </p>
    </form>
  );
}
