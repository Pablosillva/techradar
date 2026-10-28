"use client";

import { useEffect, useMemo, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { TriangleAlert, Clock, Fingerprint, KeyRound, Trash2 } from "lucide-react";
import {
  Alert,
  ButtonRow,
  CopyButton,
  EmptyState,
  Field,
  ResultLabel,
  TextArea,
  ToolPanel,
  TwoColumns,
} from "@/components/tools/tool-ui";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Decoding                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * JWT segments use base64url: the URL-safe alphabet with no `=` padding. `atob`
 * returns a binary string, so the bytes go through `TextDecoder` to keep UTF-8
 * text (accents, emojis) intact instead of turning into mojibake.
 */
function decodeBase64Url(segment: string): string {
  const normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padding = (4 - (normalized.length % 4)) % 4;
  const binary = atob(normalized + "=".repeat(padding));

  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);

  return new TextDecoder().decode(bytes);
}

function parseSegment(segment: string, label: string): Record<string, unknown> {
  let decoded: string;
  try {
    decoded = decodeBase64Url(segment);
  } catch {
    throw new Error(`O ${label} não pôde ser decodificado: o trecho não é base64url válido.`);
  }

  let value: unknown;
  try {
    value = JSON.parse(decoded) as unknown;
  } catch {
    throw new Error(`O ${label} foi decodificado, mas não contém JSON válido.`);
  }

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`O ${label} deveria ser um objeto JSON e veio como outro tipo.`);
  }

  return value as Record<string, unknown>;
}

type Expiry =
  | { kind: "none" }
  | { kind: "invalid"; raw: string }
  | { kind: "valid"; at: number }
  | { kind: "expired"; at: number };

type Decoded =
  | { status: "empty" }
  | { status: "error"; message: string }
  | {
      status: "ok";
      header: Record<string, unknown>;
      payload: Record<string, unknown>;
      headerText: string;
      payloadText: string;
      signature: string;
      signatureFull: string;
      expiry: Expiry;
      nbf: number | null;
      iat: number | null;
    };

function numericClaim(payload: Record<string, unknown>, key: string): number | null {
  const value = payload[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function decodeToken(token: string): Decoded {
  const trimmed = token.trim().replace(/^Bearer\s+/i, "");
  if (trimmed === "") return { status: "empty" };

  const segments = trimmed.split(".");
  if (segments.length !== 3) {
    return {
      status: "error",
      message:
        "Um JWT tem exatamente 3 partes separadas por ponto (header.payload.assinatura) e este " +
        `token tem ${segments.length}.`,
    };
  }

  const [rawHeader, rawPayload, rawSignature] = segments as [string, string, string];

  try {
    const header = parseSegment(rawHeader, "header");
    const payload = parseSegment(rawPayload, "payload");

    const exp = payload.exp;
    let expiry: Expiry;
    if (exp === undefined) {
      expiry = { kind: "none" };
    } else if (typeof exp !== "number" || !Number.isFinite(exp)) {
      expiry = { kind: "invalid", raw: String(exp) };
    } else {
      expiry = { kind: "valid", at: exp * 1000 };
    }

    return {
      status: "ok",
      header,
      payload,
      headerText: JSON.stringify(header, null, 2),
      payloadText: JSON.stringify(payload, null, 2),
      signature: rawSignature,
      signatureFull:
        rawSignature.length > 48
          ? `${rawSignature.slice(0, 48)}… (${rawSignature.length} caracteres)`
          : rawSignature,
      expiry,
      iat: numericClaim(payload, "iat"),
      nbf: numericClaim(payload, "nbf"),
    };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : String(error) };
  }
}

/* -------------------------------------------------------------------------- */
/*  Formatting                                                                 */
/* -------------------------------------------------------------------------- */

/** Re-parsing on every keystroke is what makes these tools feel laggy. */
const DEBOUNCE_MS = 200;

/** Keeps the countdown honest without re-rendering on every frame. */
const TICK_MS = 30_000;

function humanizeDuration(ms: number): string {
  const total = Math.floor(Math.abs(ms) / 1000);
  const days = Math.floor(total / 86_400);
  const hours = Math.floor((total % 86_400) / 3_600);
  const minutes = Math.floor((total % 3_600) / 60);
  const seconds = total % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} ${days === 1 ? "dia" : "dias"}`);
  if (hours > 0) parts.push(`${hours} h`);
  if (minutes > 0) parts.push(`${minutes} min`);
  if (parts.length === 0) parts.push(`${seconds} s`);

  return parts.slice(0, 2).join(" e ");
}

function formatDateTime(timestamp: number, ready: boolean): string {
  // Server and client disagree on locale formatting, so this only runs post-mount.
  if (!ready) return "—";
  return new Date(timestamp).toLocaleString("pt-BR");
}

function claimValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map((item) => String(item)).join(", ");
  return JSON.stringify(value) ?? String(value);
}

/* -------------------------------------------------------------------------- */
/*  Local building blocks                                                      */
/* -------------------------------------------------------------------------- */

const actionBase =
  "inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-3 py-2 " +
  "text-xs font-semibold text-fg transition-colors hover:border-line-strong " +
  "disabled:pointer-events-none disabled:opacity-40";

function ActionButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className={cn(actionBase, className)} {...props} />;
}

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-line bg-surface-2 p-4">
      <h3 className="flex items-center gap-2 text-xs font-semibold text-muted">
        <span className="text-brand">{icon}</span>
        {title}
      </h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tool                                                                       */
/* -------------------------------------------------------------------------- */

export default function JwtDecoder() {
  const [input, setInput] = useState("");
  const [debounced, setDebounced] = useState("");
  // Relative times depend on the wall clock, which differs between the server
  // render and hydration — so they stay hidden until `mounted` flips to true.
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(input), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [input]);

  useEffect(() => {
    // Deferred by a tick: the server render and the first hydration pass must
    // agree on the placeholder, and reading the clock straight from the effect
    // body would cascade a render during commit.
    const start = setTimeout(() => {
      setMounted(true);
      setNow(Date.now());
    }, 0);
    const timer = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => {
      clearTimeout(start);
      clearInterval(timer);
    };
  }, []);

  const result = useMemo(() => decodeToken(debounced), [debounced]);

  const clock = mounted ? now : null;
  const claims: { key: string; label: string; value: string }[] = [];

  if (result.status === "ok") {
    const { payload } = result;

    if (payload.iss !== undefined) {
      claims.push({ key: "iss", label: "Emissor", value: claimValue(payload.iss) });
    }
    if (payload.aud !== undefined) {
      claims.push({ key: "aud", label: "Audiência", value: claimValue(payload.aud) });
    }
    if (result.iat !== null) {
      const issued = formatDateTime(result.iat * 1000, mounted);
      const relative = clock !== null ? ` (há ${humanizeDuration(clock - result.iat * 1000)})` : "";
      claims.push({ key: "iat", label: "Emitido em", value: `${issued}${relative}` });
    }
    if (result.nbf !== null) {
      const notBefore = formatDateTime(result.nbf * 1000, mounted);
      const pending = clock !== null && clock < result.nbf * 1000 ? " (ainda não válido)" : "";
      claims.push({ key: "nbf", label: "Válido a partir de", value: `${notBefore}${pending}` });
    }
  }

  const expiry = result.status === "ok" ? result.expiry : null;
  const relativeExpiry =
    expiry !== null &&
    (expiry.kind === "valid" || expiry.kind === "expired") &&
    clock !== null
      ? humanizeDuration(expiry.at - clock)
      : null;

  return (
    <ToolPanel>
      <div className="space-y-5">
        <Field
          label="Token JWT"
          hint="Cole o token completo (header.payload.assinatura). O prefixo Bearer é removido automaticamente."
        >
          <TextArea
            rows={8}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0…"
            aria-label="Token JWT completo"
            className="break-all"
          />
        </Field>

        <ButtonRow>
          <ActionButton
            onClick={() => setDebounced(input)}
            disabled={input.trim() === ""}
            aria-label="Decodificar o token imediatamente"
          >
            <Fingerprint className="size-3.5" aria-hidden="true" />
            Decodificar
          </ActionButton>
          <ActionButton
            onClick={() => setInput("")}
            disabled={input === ""}
            aria-label="Limpar o token e o resultado"
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
            Limpar
          </ActionButton>
        </ButtonRow>

        {result.status === "empty" ? (
          <EmptyState>Cole um token JWT acima para inspecionar header, payload e validade.</EmptyState>
        ) : null}

        {result.status === "error" ? (
          <Alert tone="error">
            <div className="flex items-start gap-2">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <p className="font-semibold">Não foi possível decodificar o token.</p>
                <p className="mt-1 break-words font-mono text-xs">{result.message}</p>
              </div>
            </div>
          </Alert>
        ) : null}

        {result.status === "ok" && expiry !== null ? (
          <div className="space-y-4">
            <section className="rounded-lg border border-line bg-surface-2 p-4">
              <h3 className="flex items-center gap-2 text-xs font-semibold text-muted">
                <Clock className="size-4 text-brand" aria-hidden="true" />
                Validade do token
              </h3>

              {expiry.kind === "none" ? (
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  O payload não define <span className="font-mono">exp</span> —{" "}
                  <span className="font-semibold text-fg">sem exp</span>. A validade passa a depender de
                  como o servidor valida o token.
                </p>
              ) : expiry.kind === "invalid" ? (
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  O claim <span className="font-mono">exp</span> vale{" "}
                  <span className="font-mono font-semibold text-fg">{expiry.raw}</span>, que não é um
                  timestamp numérico em segundos.
                </p>
              ) : expiry.kind === "valid" ? (
                <>
                  <p className="mt-2 font-mono text-xl font-bold text-success tabular-nums">
                    expira em {relativeExpiry ?? "…"}
                  </p>
                  <p className="mt-1 text-xs text-subtle">{formatDateTime(expiry.at, mounted)}</p>
                </>
              ) : (
                <>
                  <p className="mt-2 font-mono text-xl font-bold text-danger tabular-nums">
                    expirado há {relativeExpiry ?? "…"}
                  </p>
                  <p className="mt-1 text-xs text-subtle">
                    Venceu em {formatDateTime(expiry.at, mounted)}
                  </p>
                </>
              )}
            </section>

            {claims.length > 0 ? (
              <div>
                <ResultLabel>Claims</ResultLabel>
                <dl className="grid gap-2 sm:grid-cols-2">
                  {claims.map((claim) => (
                    <div
                      key={claim.key}
                      className="rounded-lg border border-line bg-surface-2 px-3 py-2.5"
                    >
                      <dt className="font-mono text-xs text-subtle">{claim.key}</dt>
                      <dd className="text-[11px] text-subtle">{claim.label}</dd>
                      <dd className="break-words font-mono text-sm text-fg">{claim.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : (
              <EmptyState>
                Este payload não tem as claims padrão <span className="font-mono">iat</span>,{" "}
                <span className="font-mono">nbf</span>, <span className="font-mono">iss</span> ou{" "}
                <span className="font-mono">aud</span>.
              </EmptyState>
            )}

            <TwoColumns>
              <SectionCard icon={<KeyRound className="size-4" aria-hidden="true" />} title="Header">
                <TextArea
                  readOnly
                  rows={10}
                  value={result.headerText}
                  aria-label="Header decodificado"
                  className="resize-y bg-surface"
                />
                <div className="mt-2">
                  <CopyButton value={result.headerText} label="Copiar header" />
                </div>
              </SectionCard>

              <SectionCard icon={<KeyRound className="size-4" aria-hidden="true" />} title="Payload">
                <TextArea
                  readOnly
                  rows={10}
                  value={result.payloadText}
                  aria-label="Payload decodificado"
                  className="resize-y bg-surface"
                />
                <div className="mt-2">
                  <CopyButton value={result.payloadText} label="Copiar payload" />
                </div>
              </SectionCard>
            </TwoColumns>

            <SectionCard icon={<Fingerprint className="size-4" aria-hidden="true" />} title="Assinatura">
              {result.signature === "" ? (
                <p className="text-sm leading-relaxed text-muted">
                  Assinatura vazia — este token usa{" "}
                  <span className="font-mono">alg: {String(result.header.alg ?? "none")}</span>.
                </p>
              ) : (
                <p className="break-all font-mono text-xs text-muted">{result.signatureFull}</p>
              )}
              <p className="mt-2 text-xs leading-relaxed text-subtle">
                A assinatura é um valor binário codificado em base64url, não um dado legível — decodificá-la
                não revela nada. Ela só confirma a integridade do token quando verificada pelo servidor, e
                qualquer pessoa com o token consegue ler header e payload.
              </p>
            </SectionCard>
          </div>
        ) : null}
      </div>
    </ToolPanel>
  );
}