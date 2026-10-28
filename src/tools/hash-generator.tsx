"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CircleAlert, FileCode, ShieldCheck, Trash2 } from "lucide-react";
// @ts-expect-error `spark-md5` v3.0.2 ships no TypeScript declarations; the
// minimal surface we use is typed right below the import.
import SparkMD5Import from "spark-md5";
import {
  Alert,
  CopyButton,
  Dropzone,
  EmptyState,
  Field,
  ResultLabel,
  Select,
  TextArea,
  TextInput,
  ToolPanel,
  TwoColumns,
} from "@/components/tools/tool-ui";
import { formatBytes } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  spark-md5 shim (the package is untyped)                                    */
/* -------------------------------------------------------------------------- */

interface SparkMD5Api {
  ArrayBuffer: {
    hash(buffer: ArrayBuffer): string;
  };
  hash(input: string): string;
}

const SparkMD5 = SparkMD5Import as SparkMD5Api;

/* -------------------------------------------------------------------------- */
/*  Algorithms                                                                */
/* -------------------------------------------------------------------------- */

type AlgorithmId = "MD5" | "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";

interface Algorithm {
  id: AlgorithmId;
  /** Digest name understood by `crypto.subtle.digest`; MD5 is handled separately. */
  webCryptoName: string | null;
  /** Digest length in bits — used for the output size column. */
  bits: number;
  note: string;
}

const ALGORITHMS: readonly Algorithm[] = [
  {
    id: "MD5",
    webCryptoName: null,
    bits: 128,
    note: "Quebrado para-resistance. Só use para conferir arquivos legados.",
  },
  { id: "SHA-1", webCryptoName: "SHA-1", bits: 160, note: "Colisão práctica demonstrada." },
  { id: "SHA-256", webCryptoName: "SHA-256", bits: 256, note: "Recomendado para verificação." },
  { id: "SHA-384", webCryptoName: "SHA-384", bits: 384, note: "Variante SHA-2 de 384 bits." },
  { id: "SHA-512", webCryptoName: "SHA-512", bits: 512, note: "Variante SHA-2 mais robusta." },
];

interface HashRow {
  id: AlgorithmId;
  hash: string;
  /** Digest length in bits. */
  bits: number;
  note: string;
}

interface LoadedFile {
  name: string;
  size: number;
  buffer: ArrayBuffer;
}

/** Files above this size are hashed fully in memory — worth warning about. */
const LARGE_FILE_THRESHOLD = 100 * 1024 * 1024;

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function toHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let out = "";
  for (let i = 0; i < bytes.length; i += 1) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out;
}

/**
 * `crypto.subtle` is only exposed in secure contexts (HTTPS or localhost).
 * On plain HTTP the property exists on the prototype but is `undefined` in the
 * page, so probing it is the only reliable check.
 */
function getSubtle(): SubtleCrypto | null {
  if (typeof window === "undefined") return null;
  const subtle = window.crypto?.subtle;
  return subtle ?? null;
}

async function digestAll(
  source: ArrayBuffer,
  subtle: SubtleCrypto,
): Promise<HashRow[]> {
  const rows: HashRow[] = [];

  for (const algorithm of ALGORITHMS) {
    if (algorithm.webCryptoName === null) {
      // MD5 is not part of Web Crypto (it is not considered secure), so we use
      // spark-md5 on the very same bytes the SHA family receives.
      rows.push({
        id: algorithm.id,
        hash: SparkMD5.ArrayBuffer.hash(source),
        bits: algorithm.bits,
        note: algorithm.note,
      });
      continue;
    }

    try {
      const digest = await subtle.digest(algorithm.webCryptoName, source);
      rows.push({
        id: algorithm.id,
        hash: toHex(digest),
        bits: algorithm.bits,
        note: algorithm.note,
      });
    } catch {
      rows.push({
        id: algorithm.id,
        hash: "erro ao calcular",
        bits: algorithm.bits,
        note: `Falhou em ${algorithm.id}.`,
      });
    }
  }

  return rows;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function HashGenerator() {
  const [text, setText] = useState("");
  const [file, setFile] = useState<LoadedFile | null>(null);
  const [rows, setRows] = useState<HashRow[]>([]);
  const [inputBytes, setInputBytes] = useState(0);
  const [busy, setBusy] = useState(false);
  const [subtleMissing, setSubtleMissing] = useState(false);
  const [compareId, setCompareId] = useState<AlgorithmId>("SHA-256");
  const [expected, setExpected] = useState("");

  const runId = useRef(0);

  const handleFiles = useCallback((files: File[]) => {
    const picked = files[0];
    if (!picked) return;
    const reader = new FileReader();
    reader.onerror = () => setFile(null);
    reader.onload = () => {
      const result = reader.result;
      if (!(result instanceof ArrayBuffer)) {
        setFile(null);
        return;
      }
      setFile({ name: picked.name, size: picked.size, buffer: result });
    };
    reader.readAsArrayBuffer(picked);
  }, []);

  const clearFile = useCallback(() => setFile(null), []);

  // Recompute on every change to the input, debounced so typing stays smooth.
  // The run counter makes a slow digest of an old input a no-op once a newer
  // keystroke has already superseded it.
  useEffect(() => {
    const current = runId.current + 1;
    runId.current = current;

    // Text is encoded as UTF-8 first so accented and non-Latin characters hash
    // to the same bytes every other tool (and `sha256sum`) would produce.
    const hasText = text.length > 0;
    const source: ArrayBuffer | null = file
      ? file.buffer
      : hasText
        ? (new TextEncoder().encode(text).buffer as ArrayBuffer)
        : null;

    const timer = setTimeout(() => {
      void (async () => {
        const subtle = getSubtle();
        setSubtleMissing(subtle === null);

        if (!source) {
          setRows([]);
          setInputBytes(0);
          setBusy(false);
          return;
        }

        setBusy(true);
        setInputBytes(source.byteLength);

        if (!subtle) {
          setRows([]);
          setBusy(false);
          return;
        }

        try {
          const next = await digestAll(source, subtle);
          if (runId.current !== current) return;
          setRows(next);
        } catch {
          if (runId.current === current) setRows([]);
        } finally {
          if (runId.current === current) setBusy(false);
        }
      })();
    }, 120);

    return () => clearTimeout(timer);
  }, [file, text]);

  const compareRow = rows.find((row) => row.id === compareId);
  const expectedClean = expected.replace(/\s+/g, "").toLowerCase();
  const compareValue = compareRow?.hash ?? "";
  const hasComparison = expectedClean.length > 0 && compareValue.length > 0;
  const matches = hasComparison && expectedClean === compareValue.toLowerCase();

  const bytesToRead = file ? file.size : new TextEncoder().encode(text).byteLength;

  return (
    <ToolPanel>
      <div className="space-y-6">
        <header className="space-y-1">
          <h2 className="text-lg font-semibold text-fg">Hash Generator</h2>
          <p className="text-sm text-muted">
            Calcula MD5, SHA-1, SHA-256, SHA-384 e SHA-512 no seu navegador,
            com codificação UTF-8 e{" "}
            <code className="font-mono text-xs text-brand">crypto.subtle.digest</code>.
            Nenhum dado sai do dispositivo.
          </p>
        </header>

        {subtleMissing ? (
          <Alert tone="warning">
            A Web Crypto API não está disponível nesta página. Ela só existe em
            contextos seguros (HTTPS ou <code className="font-mono">localhost</code>),
            então os cálculos foram suspensos. Abra a ferramenta por
            <code className="font-mono"> https://</code> ou em{" "}
            <code className="font-mono">localhost</code> para habilitar MD5, SHA-1,
            SHA-256, SHA-384 e SHA-512.
          </Alert>
        ) : null}

        <Alert tone="info">
          MD5 e SHA-1 <strong>não serve para senhas</strong> — são rápidos de
          quebrar com GPUs modernas. Para guardar senhas use{" "}
          <strong>bcrypt</strong>, <strong>Argon2id</strong> ou{" "}
          <strong>scrypt</strong>. Aqui eles são úteis para conferir a integridade
          de arquivos baixados.
        </Alert>

        <TwoColumns>
          <section className="space-y-3">
            <Field
              label="Texto para calcular"
              hint={`${formatBytes(bytesToRead)} codificado em UTF-8.`}
            >
              <TextArea
                rows={7}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Cole aqui o texto que deseja hashear…"
                aria-label="Texto para calcular o hash"
              />
            </Field>
          </section>

          <section className="space-y-3">
            <ResultLabel>Ou envie um arquivo</ResultLabel>
            <Dropzone onFiles={handleFiles} accept="*/*">
              <span className="text-sm font-semibold text-fg">
                Arraste um arquivo ou clique para escolher
              </span>
              <span className="text-xs text-subtle">
                Processado no seu navegador — nada é enviado.
              </span>
            </Dropzone>

            {file ? (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2">
                <FileCode className="size-4 shrink-0 text-brand" aria-hidden="true" />
                <span className="mr-auto min-w-0">
                  <span className="block truncate text-sm font-medium text-fg">{file.name}</span>
                  <span className="block text-xs text-subtle tabular-nums">
                    {formatBytes(file.size)} · {file.size.toLocaleString("pt-BR")} bytes
                  </span>
                </span>
                <button
                  type="button"
                  onClick={clearFile}
                  aria-label="Remover arquivo"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-bg-elevated px-2.5 py-1.5 text-xs font-semibold text-fg transition-colors hover:border-danger"
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                  Remover
                </button>
              </div>
            ) : null}

            <p className="text-xs leading-relaxed text-subtle">
              O arquivo é lido inteiro na memória do navegador antes de ser
              processado. Acima de {formatBytes(LARGE_FILE_THRESHOLD)} o cálculo
              pode travar a aba ou esgotar a memória do dispositivo — nesse caso,
              prefira um utilitário de linha de comando.
            </p>
          </section>
        </TwoColumns>

        <section className="space-y-3">
          <ResultLabel>
            Resultados{" "}
            {busy ? (
              <span className="font-normal text-subtle">· calculando…</span>
            ) : null}
          </ResultLabel>

          {rows.length === 0 ? (
            <EmptyState>
              Digite um texto ou escolha um arquivo para ver os cinco hashes
              calculados em tempo real.
            </EmptyState>
          ) : (
            <div className="space-y-2">
              {rows.map((row) => (
                <div
                  key={row.id}
                  className="rounded-lg border border-line bg-surface-2 px-3 py-2"
                >
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-brand">
                      {row.id}
                    </span>
                    <span className="text-xs text-subtle tabular-nums">
                      {row.bits / 4} bytes
                    </span>
                    <span className="mr-auto hidden text-xs text-subtle sm:inline">
                      {row.note}
                    </span>
                    <CopyButton value={row.hash} label="Copiar" />
                  </div>
                  <code className="block break-all font-mono text-xs leading-relaxed text-fg">
                    {row.hash}
                  </code>
                </div>
              ))}
              <p className="text-xs text-subtle tabular-nums">
                Entrada: {formatBytes(inputBytes)} ·{" "}
                {inputBytes.toLocaleString("pt-BR")} bytes codificados
              </p>
            </div>
          )}
        </section>

        <section className="space-y-3 border-t border-line pt-5">
          <ResultLabel>Conferir hash publicado</ResultLabel>
          <p className="text-sm text-muted">
            Cole o hash que veio do fornecedor (site, manifesto{" "}
            <code className="font-mono text-xs text-brand">SHA256SUMS</code>, página
            de release) e compare com o resultado calculado.
          </p>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,14rem)_1fr]">
            <Field label="Algoritmo">
              <Select
                value={compareId}
                onChange={(e) => setCompareId(e.target.value as AlgorithmId)}
              >
                {ALGORITHMS.map((algorithm) => (
                  <option key={algorithm.id} value={algorithm.id}>
                    {algorithm.id}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Hash esperado" hint="Espaços e quebras de linha são ignorados.">
              <TextInput
                value={expected}
                onChange={(e) => setExpected(e.target.value)}
                placeholder="Cole o hash oficial aqui…"
                spellCheck={false}
                autoComplete="off"
                aria-label="Hash esperado para comparação"
              />
            </Field>
          </div>

          {hasComparison ? (
            matches ? (
              <Alert tone="success">
                <span className="inline-flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span>
                    <strong>Corresponde.</strong> O conteúdo informado bate com o{" "}
                    {compareId} publicado. O arquivo não foi alterado.
                  </span>
                </span>
              </Alert>
            ) : (
              <Alert tone="error">
                <span className="inline-flex items-start gap-2">
                  <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span>
                    <strong>Não corresponde.</strong> O hash informado é diferente do{" "}
                    {compareId} calculado. Pode ser conteúdo adulterado, link errado
                    ou algoritmo divergente.
                  </span>
                </span>
              </Alert>
            )
          ) : null}
        </section>

        <section className="border-t border-line pt-4">
          <h3 className="mb-2 text-xs font-semibold text-muted">Como conferir</h3>
          <ul className="space-y-1 text-xs leading-relaxed text-subtle">
            <li>
              Linux/macOS:{" "}
              <code className="font-mono text-fg">sha256sum arquivo.iso</code> ou{" "}
              <code className="font-mono text-fg">md5 arquivo.iso</code>.
            </li>
            <li>
              Windows: <code className="font-mono text-fg">certutil -hashfile arquivo.iso SHA256</code>.
            </li>
            <li>
              macOS: <code className="font-mono text-fg">shasum -a 256 arquivo.iso</code>.
            </li>
          </ul>
          <p className="mt-2 text-xs text-subtle">
            Referência de algoritmos: NIST FIPS 180-4 (SHA-1/SHA-2) e RFC 1321
            (MD5, apenas por compatibilidade).
          </p>
        </section>
      </div>
    </ToolPanel>
  );
}