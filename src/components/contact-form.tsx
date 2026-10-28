"use client";

import { useState, type FormEvent } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";
import {
  Alert,
  Field,
  Select,
  TextArea,
  TextInput,
} from "@/components/tools/tool-ui";

const subjects = [
  "Dúvida sobre um artigo",
  "Erro ou informação incorreta",
  "Sugestão de pauta",
  "Sugestão de ferramenta",
  "Parceria / publicidade",
  "Outro",
];

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    setStatus("sending");
    try {
      const res = await fetch("/api/contato", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = (await res.json()) as { message?: string };

      if (!res.ok) {
        setStatus("error");
        setMessage(json.message ?? "Não foi possível enviar agora.");
        return;
      }
      setStatus("sent");
      setMessage(json.message ?? "Mensagem enviada!");
      form.reset();
    } catch {
      setStatus("error");
      setMessage("Erro de conexão. Tente novamente.");
    }
  }

  if (status === "sent") {
    return (
      <Alert tone="success">
        <span className="flex items-start gap-2">
          <Check className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {message}
        </span>
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Nome">
        <TextInput name="nome" required autoComplete="name" />
      </Field>

      <Field label="E-mail">
        <TextInput name="email" type="email" required autoComplete="email" />
      </Field>

      <Field label="Assunto">
        <Select name="assunto" required defaultValue={subjects[0]}>
          {subjects.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Mensagem">
        <TextArea
          name="mensagem"
          rows={6}
          required
          placeholder="Conte com detalhes. Quanto mais específico, mais rápido conseguimos ajudar."
          className="font-sans"
        />
      </Field>

      {status === "error" && <Alert tone="error">{message}</Alert>}

      <Button type="submit" disabled={status === "sending"}>
        {status === "sending" && (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        )}
        {status === "sending" ? "Enviando…" : "Enviar mensagem"}
      </Button>
    </form>
  );
}
