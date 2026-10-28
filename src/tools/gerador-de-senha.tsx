"use client";

import { useCallback, useMemo, useState } from "react";
import { Dices, Download, RefreshCw, ShieldCheck } from "lucide-react";
import {
  Alert,
  ButtonRow,
  Checkbox,
  CopyButton,
  EmptyState,
  Field,
  NumberInput,
  RangeField,
  ResultLabel,
  ToolPanel,
  TwoColumns,
} from "@/components/tools/tool-ui";
import { cn, downloadBlob, formatNumber } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Character pools                                                           */
/* -------------------------------------------------------------------------- */

const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";
const SYMBOLS = "!@#$%^&*()-_=+[]{}<>:,.?/~";
/** Glyphs that are easy to confuse in print (0/O/o, I/l/1). */
const AMBIGUOUS = new Set(["0", "O", "o", "I", "l", "1"]);

const MIN_LENGTH = 8;
const MAX_LENGTH = 64;
const MIN_BATCH = 1;
const MAX_BATCH = 20;

interface PoolOptions {
  upper: boolean;
  lower: boolean;
  digits: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
}

/** Drops the ambiguous glyphs from a single class. */
function filterClass(chars: string, excludeAmbiguous: boolean): string {
  return excludeAmbiguous
    ? Array.from(chars).filter((c) => !AMBIGUOUS.has(c)).join("")
    : chars;
}

/** Returns the enabled character classes as arrays of glyphs, already filtered. */
function enabledClasses(options: PoolOptions): string[][] {
  const enabled: Array<[boolean, string]> = [
    [options.upper, UPPERCASE],
    [options.lower, LOWERCASE],
    [options.digits, DIGITS],
    [options.symbols, SYMBOLS],
  ];
  return enabled
    .filter(([isEnabled]) => isEnabled)
    .map(([, chars]) => Array.from(filterClass(chars, options.excludeAmbiguous)));
}

/* -------------------------------------------------------------------------- */
/*  CSPRNG                                                                    */
/* -------------------------------------------------------------------------- */

const UINT32_RANGE = 0x1_0000_0000; // 2 ** 32

/**
 * Cryptographically secure random integer in [0, bound).
 *
 * `crypto.getRandomValues` returns uniformly distributed 32-bit words, but a
 * plain `% bound` is *not* uniform: 2^32 is rarely divisible by `bound`, so the
 * first `2^32 % bound` indices would be reachable one draw more often than the
 * rest — a modulo bias that is easily avoidable. Instead we reject every draw
 * that lands in the incomplete final bucket of the 2^32 space and only accept
 * the `floor(2^32 / bound) * bound` perfectly divisible prefix, where each
 * residue appears exactly the same number of times.
 */
function secureRandomIndex(bound: number): number {
  if (bound <= 1) return 0;
  const usable = UINT32_RANGE - (UINT32_RANGE % bound);
  const buffer = new Uint32Array(1);
  let draw: number;
  do {
    crypto.getRandomValues(buffer);
    draw = buffer[0];
  } while (draw >= usable);
  return draw % bound;
}

function securePick(chars: string[]): string {
  return chars[secureRandomIndex(chars.length)];
}

/**
 * Builds one password. When `guaranteeEach` is on, the first positions are
 * seeded with one character per enabled class (the most common weakness of
 * naive generators) and the rest is filled from the full pool. The final pass
 * is a Fisher–Yates shuffle driven by the CSPRNG so the seeded characters do
 * not stay in a predictable place.
 */
function generatePassword(
  length: number,
  pool: string[],
  classes: string[][],
  guaranteeEach: boolean,
): string {
  const chars = new Array<string>(length);
  const pending = classes.slice();

  if (guaranteeEach && pending.length > 0 && pending.length <= length) {
    const seeded = pending.length;
    for (let i = 0; i < seeded; i += 1) {
      chars[i] = securePick(pending[i]);
    }
    for (let i = seeded; i < length; i += 1) {
      chars[i] = securePick(pool);
    }
  } else {
    for (let i = 0; i < length; i += 1) {
      chars[i] = securePick(pool);
    }
  }

  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = secureRandomIndex(i + 1);
    const tmp = chars[i];
    chars[i] = chars[j];
    chars[j] = tmp;
  }

  return chars.join("");
}

/* -------------------------------------------------------------------------- */
/*  Strength meter                                                            */
/* -------------------------------------------------------------------------- */

interface StrengthBand {
  /** Inclusive upper bound of the entropy, in bits. */
  max: number;
  label: string;
  bar: string;
  text: string;
}

const STRENGTH_BANDS: readonly StrengthBand[] = [
  { max: 40, label: "Muito fraca", bar: "bg-danger", text: "text-danger" },
  { max: 60, label: "Fraca", bar: "bg-danger", text: "text-danger" },
  { max: 80, label: "Razoável", bar: "bg-warning", text: "text-warning" },
  { max: 110, label: "Forte", bar: "bg-brand", text: "text-brand" },
  { max: Infinity, label: "Muito forte", bar: "bg-success", text: "text-success" },
];

/** Shannon entropy of a uniform password: length * log2(alphabet size). */
function estimateEntropy(length: number, poolSize: number): number {
  if (poolSize <= 1) return 0;
  return length * Math.log2(poolSize);
}

function strengthOf(bits: number): { score: number; band: StrengthBand } {
  const score = STRENGTH_BANDS.findIndex((band) => bits < band.max);
  const index = score === -1 ? STRENGTH_BANDS.length - 1 : score;
  return { score: index, band: STRENGTH_BANDS[index] };
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export default function GeradorDeSenha() {
  const [length, setLength] = useState(20);
  const [batch, setBatch] = useState(5);
  const [upper, setUpper] = useState(true);
  const [lower, setLower] = useState(true);
  const [digits, setDigits] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [guaranteeEach, setGuaranteeEach] = useState(true);
  const [passwords, setPasswords] = useState<string[]>([]);

  const options = useMemo<PoolOptions>(
    () => ({ upper, lower, digits, symbols, excludeAmbiguous }),
    [upper, lower, digits, symbols, excludeAmbiguous],
  );

  const classes = useMemo(() => enabledClasses(options), [options]);
  const poolChars = useMemo(() => classes.flat(), [classes]);
  const poolSize = poolChars.length;

  const entropy = estimateEntropy(length, poolSize);
  const { score, band } = strengthOf(entropy);

  const generate = useCallback(() => {
    if (poolSize === 0) {
      setPasswords([]);
      return;
    }
    const next = new Array<string>(batch);
    for (let i = 0; i < batch; i += 1) {
      next[i] = generatePassword(length, poolChars, classes, guaranteeEach);
    }
    setPasswords(next);
    // `passwords` is intentionally never written to storage, logs or the URL.
  }, [batch, classes, guaranteeEach, length, poolChars, poolSize]);

  const handleLengthInput = useCallback((value: number | "") => {
    if (typeof value !== "number" || !Number.isFinite(value)) return;
    setLength(clamp(Math.round(value), MIN_LENGTH, MAX_LENGTH));
  }, []);

  const handleBatchInput = useCallback((value: number | "") => {
    if (typeof value !== "number" || !Number.isFinite(value)) return;
    setBatch(clamp(Math.round(value), MIN_BATCH, MAX_BATCH));
  }, []);

  const noCharacters = poolSize === 0;
  const allCopied = passwords.join("\n");

  return (
    <ToolPanel>
      <div className="space-y-6">
        <header className="space-y-1">
          <h2 className="text-lg font-semibold text-fg">Gerador de Senha</h2>
          <p className="text-sm text-muted">
            Senhas criadas com aleatoriedade criptográfica (
            <code className="font-mono text-xs text-brand">crypto.getRandomValues</code>)
            usando amostragem por rejeição, o que elimina o viés de módulo. Nada é
            enviado para servidores e as senhas não ficam salvas no navegador.
          </p>
        </header>

        {noCharacters ? (
          <Alert tone="warning">
            Ative pelo menos uma categoria de caracteres. Com o conjunto atual
            não sobra nenhum caractere possível para compor a senha.
          </Alert>
        ) : null}

        <TwoColumns>
          <div className="space-y-5">
            <section className="space-y-4">
              <ResultLabel>Comprimento</ResultLabel>
              <RangeField
                label="Caracteres"
                value={length}
                min={MIN_LENGTH}
                max={MAX_LENGTH}
                suffix=" chars"
                onChange={setLength}
              />
              <Field label="Comprimento exato" hint={`Entre ${MIN_LENGTH} e ${MAX_LENGTH} caracteres.`}>
                <NumberInput
                  value={length}
                  onValueChange={handleLengthInput}
                  min={MIN_LENGTH}
                  max={MAX_LENGTH}
                  aria-label="Comprimento exato da senha"
                />
              </Field>
            </section>

            <section className="space-y-3">
              <ResultLabel>Categorias de caracteres</ResultLabel>
              <Checkbox label="Maiúsculas (A–Z)" checked={upper} onChange={setUpper} />
              <Checkbox label="Minúsculas (a–z)" checked={lower} onChange={setLower} />
              <Checkbox label="Números (0–9)" checked={digits} onChange={setDigits} />
              <Checkbox label="Símbolos (!@#$…)" checked={symbols} onChange={setSymbols} />
              <Checkbox
                label="Excluir caracteres ambíguos (0 O o I l 1)"
                checked={excludeAmbiguous}
                onChange={setExcludeAmbiguous}
              />
              <Checkbox
                label="Garantir ao menos um caractere de cada categoria"
                checked={guaranteeEach}
                onChange={setGuaranteeEach}
              />
            </section>
          </div>

          <div className="space-y-5">
            <section className="rounded-[var(--radius-card)] border border-line bg-surface-2 p-4">
              <ResultLabel>Força estimada</ResultLabel>
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <span className={cn("text-sm font-semibold", band.text)}>{band.label}</span>
                <span className="font-mono text-xs text-subtle tabular-nums">
                  {formatNumber(entropy, 1)} bits
                </span>
              </div>
              <div
                className="flex gap-1.5"
                role="meter"
                aria-valuemin={0}
                aria-valuemax={4}
                aria-valuenow={score}
                aria-valuetext={`${band.label}, ${formatNumber(entropy, 1)} bits`}
                aria-label="Força estimada da senha"
              >
                {STRENGTH_BANDS.map((level, index) => (
                  <span
                    key={level.label}
                    className={cn(
                      "h-2 flex-1 rounded-full transition-colors",
                      index <= score ? level.bar : "bg-line-strong",
                    )}
                  />
                ))}
              </div>
              <p className="mt-3 text-xs text-subtle">
                {formatNumber(length)} caracteres · {poolSize} símbolos disponíveis ·
                entropia = {formatNumber(length)} × log2({formatNumber(poolSize, 0)}) ≈{" "}
                {formatNumber(entropy, 1)} bits
              </p>
            </section>

            <section className="space-y-4">
              <Field
                label="Quantidade de senhas"
                hint={`Gera de ${MIN_BATCH} a ${MAX_BATCH} senhas de uma vez.`}
              >
                <NumberInput
                  value={batch}
                  onValueChange={handleBatchInput}
                  min={MIN_BATCH}
                  max={MAX_BATCH}
                  aria-label="Quantidade de senhas a gerar"
                />
              </Field>
              <ButtonRow>
                <button
                  type="button"
                  onClick={generate}
                  disabled={noCharacters}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-strong disabled:pointer-events-none disabled:opacity-40"
                >
                  <Dices className="size-3.5" aria-hidden="true" />
                  {passwords.length > 0 ? "Gerar novamente" : "Gerar senhas"}
                </button>
                <CopyButton value={allCopied} label="Copiar todas" />
                <button
                  type="button"
                  onClick={() =>
                    downloadBlob(
                      new Blob([`${allCopied}\n`], { type: "text/plain;charset=utf-8" }),
                      "senhas.txt",
                    )
                  }
                  disabled={passwords.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-bg-elevated px-3 py-2 text-xs font-semibold text-fg transition-colors hover:border-brand disabled:pointer-events-none disabled:opacity-40"
                >
                  <Download className="size-3.5" aria-hidden="true" />
                  Baixar .txt
                </button>
              </ButtonRow>
            </section>
          </div>
        </TwoColumns>

        <section className="space-y-3">
          <ResultLabel>
            {passwords.length > 0
              ? `${passwords.length} senha${passwords.length > 1 ? "s" : ""} gerada${passwords.length > 1 ? "s" : ""}`
              : "Senhas geradas"}
          </ResultLabel>

          {passwords.length === 0 ? (
            <EmptyState>
              Ajuste as opções acima e clique em “Gerar senhas” para criar as
              primeiras. Use o comprimento de 14 caracteres ou mais e uma senha
              única para cada serviço.
            </EmptyState>
          ) : (
            <ul className="space-y-2">
              {passwords.map((password, index) => (
                <li
                  key={`${index}-${password}`}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2"
                >
                  <span className="mr-auto min-w-0 break-all font-mono text-sm text-fg tabular-nums">
                    {password}
                  </span>
                  <span className="hidden text-xs text-subtle sm:inline">
                    {password.length} chars
                  </span>
                  <CopyButton value={password} label="Copiar" />
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="flex flex-wrap items-start gap-2 border-t border-line pt-4 text-xs text-subtle">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
          <p className="max-w-prose leading-relaxed">
            <RefreshCw className="mr-1 inline size-3 align-[-2px]" aria-hidden="true" />
            A força acima é uma estimativa baseada apenas no tamanho do alfabeto
            e não avalia padrões repetidos ou palavras de dicionário. Para
            contas críticas prefira um gerenciador de senhas com preenchimento
            automático e ative a autenticação em duas etapas.
          </p>
        </footer>
      </div>
    </ToolPanel>
  );
}