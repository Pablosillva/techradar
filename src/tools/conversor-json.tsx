"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { ArrowRightLeft, Download, FileJson, TriangleAlert } from "lucide-react";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
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
import { cn, downloadBlob, formatBytes } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

type Format = "json" | "yaml" | "xml" | "csv";

type Primitive = string | number | boolean | null;
type JsonValue = Primitive | JsonValue[] | { [key: string]: JsonValue };

const FORMATS: { value: Format; label: string }[] = [
  { value: "json", label: "JSON" },
  { value: "yaml", label: "YAML" },
  { value: "xml", label: "XML" },
  { value: "csv", label: "CSV" },
];

const FORMAT_LABEL: Record<Format, string> = { json: "JSON", yaml: "YAML", xml: "XML", csv: "CSV" };

const MIME: Record<Format, string> = {
  json: "application/json",
  yaml: "application/yaml",
  xml: "application/xml",
  csv: "text/csv;charset=utf-8",
};

const EXTENSION: Record<Format, string> = {
  json: "json",
  yaml: "yaml",
  xml: "xml",
  csv: "csv",
};

const DEBOUNCE_MS = 250;

const SAMPLE = '{\n  "usuario": {\n    "nome": "Ana",\n    "idade": 30\n  },\n  "ativo": true\n}';

function isPlainObject(value: JsonValue): value is { [key: string]: JsonValue } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function scalarToString(value: JsonValue): string {
  return value === null ? "" : String(value);
}

/* -------------------------------------------------------------------------- */
/*  Format detection                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Structural hints first: JSON and XML are unambiguous, and a first line with a
 * comma that is not a YAML mapping/sequence is far more likely to be a header.
 */
function detectFormat(text: string): Format {
  const trimmed = text.trim();
  if (trimmed === "") return "json";

  const first = trimmed[0];
  if (first === "{" || first === "[") return "json";
  if (first === "<") return "xml";

  const firstLine = trimmed.split(/\r?\n/)[0] ?? "";
  const looksLikeYaml = /^\s*(-\s+|["'[\]{}&*][^\n]*:|[\w.$"'[\]{}-]+\s*:)/.test(firstLine);
  if (!looksLikeYaml && firstLine.includes(",")) return "csv";

  return "yaml";
}

/* -------------------------------------------------------------------------- */
/*  YAML                                                                       */
/* -------------------------------------------------------------------------- */

function fromYaml(text: string): JsonValue {
  return toJsonValue(parseYaml(text));
}

/**
 * `yaml` can hand back Dates (for timestamps) and arbitrary scalars; walk the
 * tree so the rest of the converter only ever sees JSON-shaped data.
 */
function toJsonValue(input: unknown): JsonValue {
  if (input === null) return null;
  if (typeof input === "string") return input;
  if (typeof input === "boolean") return input;
  if (typeof input === "number") return Number.isFinite(input) ? input : null;
  if (input instanceof Date) return input.toISOString();
  if (Array.isArray(input)) return input.map((item: unknown) => toJsonValue(item));
  if (typeof input === "object") {
    const out: { [key: string]: JsonValue } = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      out[key] = value === undefined ? null : toJsonValue(value);
    }
    return out;
  }
  throw new Error(`O formato de origem contém um valor do tipo "${typeof input}", sem equivalente em JSON.`);
}

function toYaml(value: JsonValue): string {
  return stringifyYaml(value);
}

/* -------------------------------------------------------------------------- */
/*  XML                                                                        */
/* -------------------------------------------------------------------------- */

/** XML text can look numeric or boolean; JSON has native types for those. */
function coerceText(text: string): JsonValue {
  const trimmed = text.trim();
  if (trimmed === "") return "";
  if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(trimmed)) return Number(trimmed);
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "null") return null;
  return text;
}

function elementToValue(element: Element): JsonValue {
  const node: { [key: string]: JsonValue } = {};

  for (let i = 0; i < element.attributes.length; i += 1) {
    const attribute = element.attributes.item(i);
    if (attribute) node[`@${attribute.name}`] = coerceText(attribute.value);
  }

  const groups = new Map<string, Element[]>();
  for (const child of Array.from(element.children)) {
    const bucket = groups.get(child.tagName);
    if (bucket) bucket.push(child);
    else groups.set(child.tagName, [child]);
  }

  for (const [tag, elements] of groups) {
    const values = elements.map(elementToValue);
    node[tag] = values.length === 1 ? values[0] : values;
  }

  // A leaf element carries only text — return the scalar itself.
  if (Object.keys(node).length === 0) return coerceText(element.textContent ?? "");

  return node;
}

function xmlErrorMessage(text: string): string {
  const cleaned = text
    .replace(/^[\s\S]*?(error on line|parsererror)/i, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned === "" ? "o documento não é XML válido." : cleaned;
}

function fromXml(text: string): JsonValue {
  const doc = new DOMParser().parseFromString(text, "text/xml");
  const failure = doc.getElementsByTagName("parsererror")[0];
  if (failure) throw new Error(`XML inválido: ${xmlErrorMessage(failure.textContent ?? "")}`);

  const root = doc.documentElement;
  if (!root) throw new Error("XML inválido: o documento não tem elemento raiz.");

  return { [root.tagName]: elementToValue(root) };
}

/** XML names cannot start with a digit or contain spaces / punctuation. */
function xmlTagName(raw: string): string {
  const cleaned = raw.replace(/[^A-Za-z0-9_.\-]/g, "_");
  if (cleaned === "") return "_";
  return /^[A-Za-z_]/.test(cleaned) ? cleaned : `_${cleaned}`;
}

function fillElement(doc: Document, element: Element, value: JsonValue): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      const child = doc.createElement("item");
      fillElement(doc, child, item);
      element.appendChild(child);
    }
    return;
  }

  if (isPlainObject(value)) {
    for (const [key, child] of Object.entries(value)) {
      if (key.startsWith("@")) {
        element.setAttribute(key.slice(1) || "attr", scalarToString(child));
        continue;
      }
      const node = doc.createElement(xmlTagName(key));
      fillElement(doc, node, child);
      element.appendChild(node);
    }
    return;
  }

  element.textContent = scalarToString(value);
}

function toXml(value: JsonValue): string {
  let rootName = "root";
  let body = value;

  // Round-trips `<user><name>Ana</name></user>` back to the same shape.
  if (isPlainObject(value)) {
    const keys = Object.keys(value);
    if (keys.length === 1) {
      rootName = xmlTagName(keys[0]);
      body = value[keys[0]];
    }
  }

  const doc = document.implementation.createDocument(null, rootName, null);
  fillElement(doc, doc.documentElement, body);
  return new XMLSerializer().serializeToString(doc);
}

/* -------------------------------------------------------------------------- */
/*  CSV — RFC 4180                                                             */
/* -------------------------------------------------------------------------- */

function escapeCsv(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/**
 * Splits CSV into records honouring quoted fields, embedded separators and
 * escaped `""`, so multi-line values survive intact.
 */
function readRecords(text: string): string[][] {
  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  let quoted = false;
  let index = 0;

  while (index < text.length) {
    const char = text[index];

    if (quoted) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 2;
          continue;
        }
        quoted = false;
        index += 1;
        continue;
      }
      field += char;
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = true;
      index += 1;
      continue;
    }
    if (char === ",") {
      record.push(field);
      field = "";
      index += 1;
      continue;
    }
    if (char === "\r" || char === "\n") {
      record.push(field);
      field = "";
      records.push(record);
      record = [];
      index += char === "\r" && text[index + 1] === "\n" ? 2 : 1;
      continue;
    }

    field += char;
    index += 1;
  }

  if (quoted) throw new Error('CSV inválido: existe uma aspa de campo ("") sem fechamento.');
  if (field !== "" || record.length > 0) {
    record.push(field);
    records.push(record);
  }

  return records;
}

function fromCsv(text: string): JsonValue {
  const records = readRecords(text.replace(/^\uFEFF/, "")).filter((record) =>
    record.some((cell) => cell.trim() !== ""),
  );
  if (records.length === 0) throw new Error("O CSV está vazio.");

  const header = records[0];
  const counters = new Map<string, number>();
  const columns = header.map((cell, index) => {
    const name = cell.trim() === "" ? `coluna ${index + 1}` : cell.trim();
    const seen = counters.get(name) ?? 0;
    counters.set(name, seen + 1);
    return seen === 0 ? name : `${name} (${seen + 1})`;
  });

  return records.slice(1).map((record) => {
    const row: { [key: string]: JsonValue } = {};
    columns.forEach((name, index) => {
      row[name] = record[index] ?? "";
    });
    return row;
  });
}

/** Nested objects become dotted column names (`user.name`), per RFC 4180 rows. */
function flattenRow(record: { [key: string]: JsonValue }, path: string): { [key: string]: string } {
  const flat: { [key: string]: string } = {};

  for (const [key, value] of Object.entries(record)) {
    const name = path === "" ? key : `${path}.${key}`;

    if (Array.isArray(value)) {
      if (value.some(isPlainObject)) {
        throw new Error(
          `O array em "${name}" contém objetos. CSV é um formato de tabela e não sabe representar ` +
            "listas de objetos — achate esse trecho ou converta para JSON ou YAML.",
        );
      }
      flat[name] = value.map(scalarToString).join("; ");
      continue;
    }

    if (isPlainObject(value)) {
      Object.assign(flat, flattenRow(value, name));
      continue;
    }

    flat[name] = scalarToString(value);
  }

  return flat;
}

function toCsv(value: JsonValue): string {
  const rows: { [key: string]: string }[] = [];

  if (Array.isArray(value)) {
    if (value.length === 0) throw new Error("O array está vazio: não há linhas para exportar em CSV.");
    for (const item of value) {
      rows.push(isPlainObject(item) ? flattenRow(item, "") : { valor: scalarToString(item) });
    }
  } else if (isPlainObject(value)) {
    rows.push(flattenRow(value, ""));
  } else {
    throw new Error(
      "CSV representa linhas e colunas. O conteúdo precisa ser um objeto ou um array de objetos, " +
        "não um valor simples.",
    );
  }

  const headers: string[] = [];
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!headers.includes(key)) headers.push(key);
    }
  }
  if (headers.length === 0) throw new Error("Não há colunas para exportar: o conteúdo está vazio.");

  const lines = [headers, ...rows.map((row) => headers.map((header) => row[header] ?? ""))];
  return lines.map((line) => line.map(escapeCsv).join(",")).join("\r\n");
}

/* -------------------------------------------------------------------------- */
/*  Conversion                                                                 */
/* -------------------------------------------------------------------------- */

type Conversion =
  | { status: "empty" }
  | { status: "error"; message: string }
  | { status: "ok"; from: Format; to: Format; output: string };

function convert(text: string, to: Format): Conversion {
  const trimmed = text.trim();
  if (trimmed === "") return { status: "empty" };

  const from = detectFormat(trimmed);

  try {
    let value: JsonValue;
    switch (from) {
      case "json":
        value = toJsonValue(JSON.parse(trimmed) as unknown);
        break;
      case "yaml":
        value = fromYaml(trimmed);
        break;
      case "xml":
        value = fromXml(trimmed);
        break;
      case "csv":
        value = fromCsv(trimmed);
        break;
    }

    let output: string;
    switch (to) {
      case "json":
        output = JSON.stringify(value, null, 2);
        break;
      case "yaml":
        output = toYaml(value);
        break;
      case "xml":
        output = toXml(value);
        break;
      case "csv":
        output = toCsv(value);
        break;
    }

    return { status: "ok", from, to, output };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { status: "error", message };
  }
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

function ErrorNote({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Alert tone="error">
      <div className="flex items-start gap-2">
        <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <div className="min-w-0">
          <p className="font-semibold">{title}</p>
          <p className="mt-1 break-words font-mono text-xs">{children}</p>
        </div>
      </div>
    </Alert>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tool                                                                       */
/* -------------------------------------------------------------------------- */

export default function ConversorJson() {
  const [input, setInput] = useState("");
  const [debounced, setDebounced] = useState("");
  const [to, setTo] = useState<Format>("json");

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(input), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [input]);

  const detected = useMemo(() => detectFormat(debounced), [debounced]);
  const result = useMemo(() => convert(debounced, to), [debounced, to]);

  const output = result.status === "ok" ? result.output : "";
  const hasInput = debounced.trim() !== "";

  return (
    <ToolPanel>
      <TwoColumns>
        <Field
          label="Conteúdo de origem"
          hint="O formato é detectado automaticamente: começa com { ou [ vira JSON, com < vira XML, uma primeira linha com vírgula vira CSV e o resto é YAML."
        >
          <TextArea
            rows={18}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={SAMPLE}
            aria-label="Conteúdo de origem"
          />
        </Field>

        <div className="flex flex-col gap-4">
          <div>
            <ResultLabel>Formato detectado</ResultLabel>
            <p className="flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-sm font-semibold text-brand">
              <FileJson className="size-4" aria-hidden="true" />
              {hasInput ? FORMAT_LABEL[detected] : "aguardando conteúdo"}
            </p>
          </div>

          <Field
            label="Formato de destino"
            hint="CSV achata objetos aninhados em colunas com caminho (user.name) e não representa arrays de objetos."
          >
            <Select value={to} onChange={(event) => setTo(event.target.value as Format)}>
              {FORMATS.map((format) => (
                <option key={format.value} value={format.value}>
                  {format.label}
                </option>
              ))}
            </Select>
          </Field>

          <div className="flex items-center justify-center gap-2 py-1 text-xs font-semibold text-subtle">
            <ArrowRightLeft className="size-4" aria-hidden="true" />
            {hasInput ? `${FORMAT_LABEL[detected]} para ${FORMAT_LABEL[to]}` : "escolha o destino"}
          </div>

          <div>
            <ResultLabel>Resultado</ResultLabel>
            {result.status === "empty" ? (
              <EmptyState>Cole o conteúdo ao lado para ver a conversão.</EmptyState>
            ) : result.status === "error" ? (
              <ErrorNote
                title={
                  detected === to
                    ? `Não foi possível ler o conteúdo como ${FORMAT_LABEL[detected]}.`
                    : `Não foi possível converter de ${FORMAT_LABEL[detected]} para ${FORMAT_LABEL[to]}.`
                }
              >
                {result.message}
              </ErrorNote>
            ) : (
              <>
                <TextArea
                  readOnly
                  rows={14}
                  value={output}
                  aria-label={`Resultado em ${FORMAT_LABEL[to]}`}
                  className="resize-y bg-surface-2"
                />
                <p className="mt-1 text-xs text-subtle">
                  Saída de {formatBytes(new TextEncoder().encode(output).length)}.
                </p>
              </>
            )}
          </div>

          <ButtonRow>
            <CopyButton
              value={output}
              label={result.status === "ok" ? `Copiar ${FORMAT_LABEL[to]}` : "Copiar"}
            />
            <ActionButton
              disabled={!output}
              onClick={() =>
                downloadBlob(
                  new Blob([output], { type: MIME[to] }),
                  `convertido.${EXTENSION[to]}`,
                )
              }
            >
              <Download className="size-3.5" aria-hidden="true" />
              Baixar .{EXTENSION[to]}
            </ActionButton>
            <ActionButton onClick={() => setInput("")} disabled={input === ""}>
              Limpar
            </ActionButton>
          </ButtonRow>
        </div>
      </TwoColumns>
    </ToolPanel>
  );
}