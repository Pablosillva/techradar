"use client";

import { useEffect, useMemo, useState, type ButtonHTMLAttributes } from "react";
import { TriangleAlert, Trash2 } from "lucide-react";
import {
  Alert,
  ButtonRow,
  CopyButton,
  EmptyState,
  Field,
  ResultLabel,
  Select,
  TextArea,
  ToolPanel,
  TwoColumns,
} from "@/components/tools/tool-ui";
import { cn, formatBytes, formatNumber } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

type Indent = 2 | 4 | "tab";

const INDENT_CHAR: Record<Indent, number | string> = { 2: 2, 4: 4, tab: "\t" };

const INDENT_OPTIONS: { value: Indent; label: string }[] = [
  { value: 2, label: "2 espaços" },
  { value: 4, label: "4 espaços" },
  { value: "tab", label: "Tabulação" },
];

/** Above this size we stop pretty-printing on every keystroke. */
const DEBOUNCE_MS = 200;

const SAMPLE = '{\n  "nome": "TechLab",\n  "versao": 1,\n  "ativo": true\n}';

/* -------------------------------------------------------------------------- */
/*  Analysis                                                                   */
/* -------------------------------------------------------------------------- */

type Analysis =
  | { status: "empty" }
  | {
      status: "error";
      message: string;
      position: number | null;
      line: number | null;
      column: number | null;
    }
  | { status: "ok"; pretty: string; minified: string };

/** Exact UTF-8 byte count — `String.length` counts UTF-16 units, not bytes. */
function byteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

/**
 * Newest V8 dropped the numeric offset and only embeds the offending region:
 * `Unexpected token '}', "{"a": }" is not valid JSON`. Matching that snippet back
 * against the raw text recovers the offset. Snippets are short and elided with
 * `...` on long inputs, so a match on a small region is a good proxy; anything
 * larger is skipped rather than risk pointing somewhere wrong.
 */
const SNIPPET_MAX = 100;

function locateFromSnippet(raw: string, message: string): number | null {
  const snippet = message.match(/"(.+)"\s+is not valid JSON/);
  if (!snippet) return null;

  const region = snippet[1].replace(/\\"/g, '"');
  if (region.length === 0 || region.length > SNIPPET_MAX) return null;

  const start = raw.indexOf(region);
  if (start === -1) return null;

  // The message names the offending token; prefer its exact offset inside the
  // region when it is found there.
  const token = message.match(/Unexpected token '(.+?)'/);
  if (token) {
    const at = raw.indexOf(token[1], start);
    if (at !== -1 && at <= start + region.length) return at;
  }

  return start;
}

/**
 * Errors surface in three shapes across engines: `(line X column Y)` appended to
 * the offset, a bare `at position N`, or the snippet-only form above. All three
 * are handled so the UI can always point at a line and column.
 */
function locate(raw: string, message: string) {
  let position: number | null = null;
  let line: number | null = null;
  let column: number | null = null;

  const lineColumn = message.match(/line (\d+)\s+column (\d+)/i);
  if (lineColumn) {
    line = Number(lineColumn[1]);
    column = Number(lineColumn[2]);
  }

  const offset = message.match(/position (\d+)/i);
  if (offset) position = Number(offset[1]);
  if (position === null) position = locateFromSnippet(raw, message);

  if (line === null && position !== null && position <= raw.length) {
    const before = raw.slice(0, position);
    line = before.split("\n").length;
    column = position - before.lastIndexOf("\n");
  }

  return { position, line, column };
}

function analyze(raw: string, indent: Indent): Analysis {
  if (raw.trim() === "") return { status: "empty" };

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { status: "error", message, ...locate(raw, message) };
  }

  // A value that came out of JSON.parse is always serializable, so neither
  // call can return undefined here.
  return {
    status: "ok",
    pretty: JSON.stringify(value, null, INDENT_CHAR[indent]),
    minified: JSON.stringify(value),
  };
}

/* -------------------------------------------------------------------------- */
/*  Local building blocks                                                      */
/* -------------------------------------------------------------------------- */

const actionBase =
  "inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-3 py-2 " +
  "text-xs font-semibold text-fg transition-colors hover:border-line-strong " +
  "disabled:pointer-events-none disabled:opacity-40";

function ActionButton({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className={cn(actionBase, className)} {...props} />;
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface-2 px-3 py-2.5">
      <div className="text-xs text-subtle">{label}</div>
      <div className="font-mono text-sm font-bold text-fg tabular-nums">{value}</div>
      {hint ? <div className="mt-0.5 text-[11px] text-muted">{hint}</div> : null}
    </div>
  );
}

function readOnlyBox({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <ResultLabel>{label}</ResultLabel>
      <TextArea
        readOnly
        rows={12}
        value={value}
        aria-label={label}
        className="resize-y bg-surface-2"
        spellCheck={false}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tool                                                                       */
/* -------------------------------------------------------------------------- */

export default function FormatadorJson() {
  const [input, setInput] = useState("");
  const [debounced, setDebounced] = useState("");
  const [indent, setIndent] = useState<Indent>(2);

  // Re-parsing a large blob on every keystroke is what makes these tools feel
  // laggy, so the analysis always runs on a settled value.
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(input), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [input]);

  const result = useMemo(() => analyze(debounced, indent), [debounced, indent]);

  const pretty = result.status === "ok" ? result.pretty : "";
  const minified = result.status === "ok" ? result.minified : "";

  const stats = useMemo(() => {
    const inputBytes = byteLength(debounced);
    const prettyBytes = byteLength(pretty);
    const minifiedBytes = byteLength(minified);
    const reduction = inputBytes > 0 ? Math.max(0, (1 - minifiedBytes / inputBytes) * 100) : 0;
    return { inputBytes, prettyBytes, minifiedBytes, reduction };
  }, [debounced, pretty, minified]);

  return (
    <ToolPanel>
      <div className="space-y-5">
        <Field
          label="JSON de entrada"
          hint="Cole ou digite seu JSON. A formatação é aplicada automaticamente enquanto você escreve."
        >
          <TextArea
            rows={12}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={SAMPLE}
            aria-label="JSON de entrada"
          />
        </Field>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <Field label="Indentação" className="w-full sm:w-52">
            <Select
              value={String(indent)}
              onChange={(event) => setIndent(event.target.value as Indent)}
            >
              {INDENT_OPTIONS.map((option) => (
                <option key={option.value} value={String(option.value)}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>

          <ButtonRow>
            <CopyButton value={pretty} label="Copiar formatado" />
            <CopyButton value={minified} label="Copiar minificado" />
            <ActionButton
              onClick={() => setInput("")}
              disabled={input === ""}
              aria-label="Limpar o campo de entrada e o resultado"
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              Limpar
            </ActionButton>
          </ButtonRow>
        </div>

        {result.status === "empty" ? (
          <EmptyState>
            Cole um JSON acima para ver o resultado formatado e minificado.
          </EmptyState>
        ) : null}

        {result.status === "error" ? (
          <Alert tone="error">
            <div className="flex items-start gap-2">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <p className="font-semibold">Não foi possível formatar o JSON.</p>
                <p className="mt-1 break-words font-mono text-xs">{result.message}</p>
                {result.line !== null || result.position !== null ? (
                  <p className="mt-2 text-xs font-semibold">
                    Linha {result.line ?? "?"}
                    {result.column !== null ? `, coluna ${result.column}` : ""}
                    {result.position !== null ? ` · posição ${result.position}` : ""}
                  </p>
                ) : null}
              </div>
            </div>
          </Alert>
        ) : null}

        {result.status === "ok" ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat
                label="Entrada"
                value={formatBytes(stats.inputBytes)}
                hint={`${formatNumber(debounced.split("\n").length)} linha(s)`}
              />
              <Stat
                label="Formatado"
                value={formatBytes(stats.prettyBytes)}
                hint={`indentação de ${indent === "tab" ? "tabulação" : `${indent} espaços`}`}
              />
              <Stat label="Minificado" value={formatBytes(stats.minifiedBytes)} />
              <Stat
                label="Redução"
                value={`${formatNumber(stats.reduction, 1)}%`}
                hint="minificado ÷ entrada"
              />
            </div>

            <TwoColumns>
              {readOnlyBox({ label: "Formatado", value: pretty })}
              {readOnlyBox({ label: "Minificado", value: minified })}
            </TwoColumns>
          </div>
        ) : null}
      </div>
    </ToolPanel>
  );
}