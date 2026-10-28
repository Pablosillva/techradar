"use client";

import { useEffect, useMemo, useState, type ButtonHTMLAttributes } from "react";
import { Check, Copy, Download, Hash, RefreshCw, TriangleAlert } from "lucide-react";
import {
  Alert,
  ButtonRow,
  Checkbox,
  CopyButton,
  EmptyState,
  Field,
  ResultLabel,
  Select,
  TextArea,
  ToolPanel,
} from "@/components/tools/tool-ui";
import { cn, copyToClipboard, downloadBlob, formatNumber } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Generation                                                                 */
/* -------------------------------------------------------------------------- */

const DEFAULTS = { count: 1, upper: false, stripHyphens: false } as const;

const COUNT_OPTIONS = [1, 5, 10, 25, 50, 100] as const;

/** Upper bound per batch — keeps rendering snappy and the textarea usable. */
const MAX_BATCH = 100;

function generateUuid(): string {
  const webCrypto: Crypto | undefined = globalThis.crypto;

  if (webCrypto && typeof webCrypto.randomUUID === "function") {
    return webCrypto.randomUUID();
  }

  if (!webCrypto || typeof webCrypto.getRandomValues !== "function") {
    throw new Error(
      "Este navegador não expõe crypto.randomUUID nem crypto.getRandomValues, então não é possível " +
        "gerar UUIDs seguros aqui.",
    );
  }

  // RFC 4122 §4.4: force the version nibble to 4 and the variant bits to 10xx.
  const bytes = new Uint8Array(16);
  webCrypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-");
}

function createBatch(count: number, upper: boolean, stripHyphens: boolean): string[] {
  const total = Math.min(Math.max(Math.trunc(count) || DEFAULTS.count, 1), MAX_BATCH);
  return Array.from({ length: total }, () => {
    const raw = stripHyphens ? generateUuid().replace(/-/g, "") : generateUuid();
    return upper ? raw.toUpperCase() : raw;
  });
}

function parseCount(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return DEFAULTS.count;
  return Math.min(Math.max(parsed, 1), MAX_BATCH);
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

/** Same confirm-for-a-moment affordance as CopyButton, for the whole batch. */
function CopyAllButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function handle() {
    if (!(await copyToClipboard(value))) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={handle}
      disabled={value === ""}
      className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-strong disabled:pointer-events-none disabled:opacity-40"
    >
      {copied ? (
        <Check className="size-3.5" aria-hidden="true" />
      ) : (
        <Copy className="size-3.5" aria-hidden="true" />
      )}
      {copied ? "Copiado!" : "Copiar todos"}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tool                                                                       */
/* -------------------------------------------------------------------------- */

export default function GeradorDeUuid() {
  const [count, setCount] = useState<string>(String(DEFAULTS.count));
  const [upper, setUpper] = useState<boolean>(DEFAULTS.upper);
  const [stripHyphens, setStripHyphens] = useState<boolean>(DEFAULTS.stripHyphens);
  const [uuids, setUuids] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Filling the first batch makes the tool useful straight away. It runs a tick
  // after mount so the server HTML stays empty and hydration matches.
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        setUuids(createBatch(DEFAULTS.count, DEFAULTS.upper, DEFAULTS.stripHyphens));
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : String(cause));
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  /** Applies an option change and the new batch in one go, so they never drift. */
  function regenerate(nextCount: string, nextUpper: boolean, nextStripHyphens: boolean) {
    setCount(nextCount);
    setUpper(nextUpper);
    setStripHyphens(nextStripHyphens);
    try {
      setUuids(createBatch(parseCount(nextCount), nextUpper, nextStripHyphens));
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  }

  const text = useMemo(() => uuids.join("\n"), [uuids]);

  function handleDownload() {
    const blob = new Blob([`${text}\n`], { type: "text/plain;charset=utf-8" });
    downloadBlob(blob, `uuids-${formatNumber(uuids.length)}.txt`);
  }

  return (
    <ToolPanel>
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Quantidade" hint={`Entre 1 e ${MAX_BATCH} identificadores por lote.`}>
            <Select
              value={count}
              onChange={(event) => regenerate(event.target.value, upper, stripHyphens)}
            >
              {COUNT_OPTIONS.map((option) => (
                <option key={option} value={String(option)}>
                  {option}
                </option>
              ))}
            </Select>
          </Field>

          <div className="flex flex-col justify-center gap-3 sm:pb-1">
            <Checkbox
              label="Maiúsculas"
              checked={upper}
              onChange={(checked) => regenerate(count, checked, stripHyphens)}
            />
            <Checkbox
              label="Remover hífens"
              checked={stripHyphens}
              onChange={(checked) => regenerate(count, upper, checked)}
            />
          </div>

          <div className="flex items-end">
            <ActionButton
              onClick={() => regenerate(count, upper, stripHyphens)}
              className="w-full justify-center"
            >
              <RefreshCw className="size-3.5" aria-hidden="true" />
              Gerar novos
            </ActionButton>
          </div>
        </div>

        {error !== null ? (
          <Alert tone="error">
            <div className="flex items-start gap-2">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <p className="min-w-0 font-mono text-xs">{error}</p>
            </div>
          </Alert>
        ) : null}

        <div>
          <ResultLabel>
            {uuids.length > 0
              ? `${formatNumber(uuids.length)} UUID v4 gerado${uuids.length > 1 ? "s" : ""}`
              : "Resultado"}
          </ResultLabel>
          {uuids.length === 0 ? (
            <EmptyState>Clique em “Gerar novos” para criar identificadores.</EmptyState>
          ) : (
            <TextArea
              readOnly
              rows={Math.min(14, Math.max(3, uuids.length))}
              value={text}
              aria-label="UUIDs gerados"
              className="resize-y text-xs"
            />
          )}
        </div>

        <ButtonRow>
          <CopyAllButton value={text} />
          <ActionButton onClick={handleDownload} disabled={uuids.length === 0}>
            <Download className="size-3.5" aria-hidden="true" />
            Baixar .txt
          </ActionButton>
        </ButtonRow>

        {uuids.length > 0 ? (
          <div>
            <ResultLabel>Copiar um por um</ResultLabel>
            <ul className="max-h-80 divide-y divide-line overflow-y-auto rounded-lg border border-line">
              {uuids.map((uuid, index) => (
                <li
                  key={`${uuid}-${index}`}
                  className="flex items-center justify-between gap-3 bg-surface-2 px-3 py-2"
                >
                  <span className="flex min-w-0 items-center gap-2 font-mono text-xs text-fg">
                    <Hash className="size-3.5 shrink-0 text-subtle" aria-hidden="true" />
                    <span className="break-all">{uuid}</span>
                  </span>
                  <span className="shrink-0">
                    <CopyButton value={uuid} label="Copiar" />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </ToolPanel>
  );
}