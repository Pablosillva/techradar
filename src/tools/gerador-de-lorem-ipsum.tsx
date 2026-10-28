"use client";

import { useCallback, useMemo, useState } from "react";
import { Download, RefreshCw, Type } from "lucide-react";
import {
  ButtonRow,
  Checkbox,
  CopyButton,
  Field,
  NumberInput,
  RangeField,
  ResultLabel,
  Select,
  TextArea,
  ToolPanel,
  TwoColumns,
} from "@/components/tools/tool-ui";
import { downloadBlob } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Word bank                                                                 */
/* -------------------------------------------------------------------------- */

/** ~180 short Latin-ish words; the filler reads as prose without meaning. */
const WORDS = [
  "a", "ac", "accumsan", "ad", "adipiscing", "aenean", "aliquam", "aliquet",
  "amet", "ante", "aptent", "arcu", "at", "augue", "bibendum", "blandit",
  "class", "commodo", "condimentum", "congue", "consectetur", "convallis",
  "cras", "cubilia", "curabitur", "curae", "cursus", "dapibus", "diam",
  "dictum", "dictumst", "dignissim", "dis", "dolor", "donec", "dui",
  "egestas", "eget", "elementum", "eleifend", "elit", "enim", "eros", "est",
  "et", "etiam", "eu", "euismod", "ex", "facilisi", "facilisis", "fames",
  "faucibus", "felis", "fermentum", "feugiat", "finibus", "fringilla",
  "fusce", "gravida", "habitant", "habitasse", "hac", "hendrerit", "hymenaeos",
  "iaculis", "imperdiet", "in", "inceptos", "integer", "interdum", "ipsum",
  "justo", "lacinia", "lacus", "laoreet", "lectus", "leo", "libero", "ligula",
  "lobortis", "lorem", "luctus", "maecenas", "magna", "magnis", "malesuada",
  "massa", "mattis", "mauris", "metus", "mi", "molestie", "mollis", "montes",
  "morbi", "mus", "nam", "nascetur", "natoque", "nec", "neque", "netus",
  "nibh", "nisi", "nisl", "non", "nostra", "nulla", "nullam", "nunc", "odio",
  "orci", "ornare", "parturient", "pede", "pellentesque", "penatibus", "per",
  "pharetra", "phasellus", "placerat", "platea", "porta", "porttitor",
  "posuere", "potenti", "praesent", "pretium", "primis", "proin", "pulvinar",
  "purus", "quam", "quis", "quisque", "rhoncus", "ridiculus", "risus",
  "rutrum", "sagittis", "sapien", "scelerisque", "sed", "sem", "semper",
  "senectus", "sit", "sociis", "sociosqu", "sodales", "sollicitudin",
  "suscipit", "suspendisse", "taciti", "tellus", "tempor", "tempus",
  "tincidunt", "torquent", "tortor", "tristique", "turpis", "ullamcorper",
  "ultrices", "ultricies", "urna", "ut", "varius", "vehicula", "vel",
  "velit", "venenatis", "vestibulum", "vitae", "vivamus", "viverra",
  "volutpat", "vulputate",
] as const;

/** The traditional opening, reused so mockups match the classic look. */
const CLASSIC_START = ["Lorem", "ipsum", "dolor", "sit", "amet"] as const;

/* -------------------------------------------------------------------------- */
/*  Units                                                                     */
/* -------------------------------------------------------------------------- */

type UnitId = "paragraphs" | "sentences" | "words" | "lists";

interface UnitSpec {
  id: UnitId;
  label: string;
  min: number;
  max: number;
  step: number;
  initial: number;
  hint: string;
}

const UNITS: readonly UnitSpec[] = [
  {
    id: "paragraphs",
    label: "Parágrafos",
    min: 1,
    max: 20,
    step: 1,
    initial: 5,
    hint: "Cada parágrafo tem de 3 a 6 frases.",
  },
  {
    id: "sentences",
    label: "Frases",
    min: 1,
    max: 60,
    step: 1,
    initial: 10,
    hint: "Cada frase tem de 6 a 18 palavras.",
  },
  {
    id: "words",
    label: "Palavras",
    min: 10,
    max: 1000,
    step: 10,
    initial: 100,
    hint: "Gera exatamente a quantidade de palavras informada.",
  },
  {
    id: "lists",
    label: "Listas",
    min: 1,
    max: 30,
    step: 1,
    initial: 8,
    hint: "Cada item tem de 5 a 9 palavras.",
  },
];

/** Chooses between the plain and the HTML rendering of the generated blocks. */
function renderPlainOrHtml(unit: UnitId, blocks: string[], html: boolean): string {
  return html ? renderHtml(unit, blocks) : renderPlain(unit, blocks);
}

/* -------------------------------------------------------------------------- */
/*  Text builders                                                             */
/* -------------------------------------------------------------------------- */

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pickWord(): string {
  return WORDS[randomInt(0, WORDS.length - 1)];
}

/**
 * Draws `total` words, optionally overwriting the first five with the classic
 * opening. `variation` offsets the first word so every click on "Gerar
 * novamente" visibly produces a different text instead of relying purely on
 * chance.
 */
function buildWords(total: number, classic: boolean, variation: number): string[] {
  const words: string[] = [];
  for (let i = 0; i < total; i += 1) {
    words.push(i === 0 ? WORDS[variation % WORDS.length] : pickWord());
  }
  if (classic) {
    for (let i = 0; i < CLASSIC_START.length && i < words.length; i += 1) {
      words[i] = CLASSIC_START[i];
    }
  }
  return words;
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/** Splits `count` random sentence lengths, then emits exactly `count` sentences. */
function buildSentences(count: number, classic: boolean, variation: number): string[] {
  const lengths: number[] = [];
  let total = 0;
  for (let i = 0; i < count; i += 1) {
    const length = randomInt(6, 18);
    lengths.push(length);
    total += length;
  }

  const words = buildWords(total, classic, variation);
  const sentences: string[] = [];
  let cursor = 0;
  for (const length of lengths) {
    const chunk = words.slice(cursor, cursor + length);
    cursor += length;
    sentences.push(`${capitalize(chunk[0])} ${chunk.slice(1).join(" ")}.`);
  }
  return sentences;
}

function buildParagraphs(count: number, classic: boolean, variation: number): string[] {
  const perParagraph: number[] = [];
  let totalSentences = 0;
  for (let i = 0; i < count; i += 1) {
    const size = randomInt(3, 6);
    perParagraph.push(size);
    totalSentences += size;
  }

  const sentences = buildSentences(totalSentences, classic, variation);
  const paragraphs: string[] = [];
  let cursor = 0;
  for (const size of perParagraph) {
    paragraphs.push(sentences.slice(cursor, cursor + size).join(" "));
    cursor += size;
  }
  return paragraphs;
}

function buildListItems(count: number, classic: boolean, variation: number): string[] {
  const lengths: number[] = [];
  let total = 0;
  for (let i = 0; i < count; i += 1) {
    const length = randomInt(5, 9);
    lengths.push(length);
    total += length;
  }

  const words = buildWords(total, classic, variation);
  const items: string[] = [];
  let cursor = 0;
  for (const length of lengths) {
    const chunk = words.slice(cursor, cursor + length);
    cursor += length;
    items.push(`${capitalize(chunk[0])} ${chunk.slice(1).join(" ")}`);
  }
  return items;
}

function renderPlain(unit: UnitId, blocks: string[]): string {
  switch (unit) {
    case "paragraphs":
      return blocks.join("\n\n");
    case "sentences":
      return blocks.join(" ");
    case "lists":
      return blocks.map((item) => `- ${item}`).join("\n");
    default:
      return blocks.join(" ");
  }
}

function renderHtml(unit: UnitId, blocks: string[]): string {
  if (unit === "lists") {
    return ["<ul>", ...blocks.map((item) => `  <li>${item}</li>`), "</ul>"].join("\n");
  }
  if (unit === "words") {
    return `<p>${blocks.join(" ")}</p>`;
  }
  return blocks.map((block) => `<p>${block}</p>`).join("\n");
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export default function GeradorDeLoremIpsum() {
  const [unit, setUnit] = useState<UnitId>("paragraphs");
  const [amount, setAmount] = useState(UNITS[0].initial);
  const [classic, setClassic] = useState(true);
  const [html, setHtml] = useState(false);
  const [variation, setVariation] = useState(0);

  const spec = UNITS.find((item) => item.id === unit) ?? UNITS[0];

  const handleUnit = useCallback((next: UnitId) => {
    const target = UNITS.find((item) => item.id === next) ?? UNITS[0];
    setUnit(next);
    // Re-clamp so switching from "1000 palavras" to "Parágrafos" stays valid.
    setAmount((current) => clamp(current, target.min, target.max));
  }, []);

  const handleAmount = useCallback(
    (value: number) => {
      setAmount((current) => clamp(value, spec.min, spec.max) || current || spec.min);
    },
    [spec.max, spec.min],
  );

  const handleAmountInput = useCallback(
    (value: number | "") => {
      if (typeof value !== "number" || !Number.isFinite(value)) return;
      setAmount((current) => {
        const next = Math.round(value);
        // While the field is being cleared or is mid-typing a small number,
        // keep the last valid quantity so the output never collapses to zero.
        if (next < spec.min) return current < spec.min ? spec.min : current;
        return Math.min(next, spec.max);
      });
    },
    [spec.max, spec.min],
  );

  const output = useMemo(() => {
    switch (unit) {
      case "sentences":
        return renderPlainOrHtml(unit, buildSentences(amount, classic, variation), html);
      case "words": {
        const text = buildWords(amount, classic, variation).join(" ");
        return html ? `<p>${capitalize(text)}</p>` : capitalize(text);
      }
      case "lists":
        return renderPlainOrHtml(unit, buildListItems(amount, classic, variation), html);
      default:
        return renderPlainOrHtml(unit, buildParagraphs(amount, classic, variation), html);
    }
  }, [amount, classic, html, unit, variation]);

  const stats = useMemo(() => {
    const plain = html ? output.replace(/<[^>]+>/g, " ") : output;
    const wordCount = plain.split(/\s+/).filter(Boolean).length;
    return { wordCount, charCount: plain.trim().length };
  }, [html, output]);

  const download = useCallback(() => {
    downloadBlob(
      new Blob([output], { type: "text/plain;charset=utf-8" }),
      "lorem-ipsum.txt",
    );
  }, [output]);

  return (
    <ToolPanel>
      <div className="space-y-6">
        <header className="space-y-1">
          <h2 className="text-lg font-semibold text-fg">Gerador de Lorem Ipsum</h2>
          <p className="text-sm text-muted">
            Texto de preenchimento para mockups e protótipos, gerado no navegador a
            partir de um banco de {WORDS.length} palavras. Ideal para reservar
            espaço enquanto o conteúdo real não está pronto.
          </p>
        </header>

        <TwoColumns>
          <div className="space-y-4">
            <Field label="Unidade" hint={spec.hint}>
              <Select value={unit} onChange={(e) => handleUnit(e.target.value as UnitId)}>
                {UNITS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </Field>

            <RangeField
              label={`Quantidade de ${spec.label.toLowerCase()}`}
              value={amount}
              min={spec.min}
              max={spec.max}
              step={spec.step}
              suffix={unit === "words" ? " palavras" : ""}
              onChange={handleAmount}
            />

            <Field
              label="Quantidade exata"
              hint={`Entre ${spec.min} e ${spec.max} ${spec.label.toLowerCase()}.`}
            >
              <NumberInput
                value={amount}
                onValueChange={handleAmountInput}
                min={spec.min}
                max={spec.max}
                aria-label={`Quantidade de ${spec.label.toLowerCase()}`}
              />
            </Field>

            <div className="space-y-3">
              <ResultLabel>Opções</ResultLabel>
              <Checkbox
                label='Começar com "Lorem ipsum dolor sit amet"'
                checked={classic}
                onChange={setClassic}
              />
              <Checkbox
                label="Incluir marcação HTML (<p> por parágrafo)"
                checked={html}
                onChange={setHtml}
              />
            </div>

            <ButtonRow>
              <button
                type="button"
                onClick={() => setVariation((value) => value + 1)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-strong"
              >
                <RefreshCw className="size-3.5" aria-hidden="true" />
                Gerar novamente
              </button>
              <span className="self-center font-mono text-xs text-subtle tabular-nums">
                variação {variation}
              </span>
              <CopyButton value={output} label="Copiar texto" />
              <button
                type="button"
                onClick={download}
                disabled={output.length === 0}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-bg-elevated px-3 py-2 text-xs font-semibold text-fg transition-colors hover:border-brand disabled:pointer-events-none disabled:opacity-40"
              >
                <Download className="size-3.5" aria-hidden="true" />
                Baixar .txt
              </button>
            </ButtonRow>
          </div>

          <div className="space-y-3">
            <ResultLabel>
              Resultado{" "}
              <span className="font-normal text-subtle tabular-nums">
                · {stats.wordCount} palavras · {stats.charCount} caracteres
              </span>
            </ResultLabel>
            <TextArea
              rows={16}
              readOnly
              value={output}
              aria-label="Texto gerado"
              className="text-xs"
            />
            <p className="flex items-start gap-2 text-xs leading-relaxed text-subtle">
              <Type className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                O texto é recalculado a cada mudança de configuração. Use o botão
                “Gerar novamente” quando quiser sortear uma nova variação com os
                mesmos parâmetros.
              </span>
            </p>
          </div>
        </TwoColumns>
      </div>
    </ToolPanel>
  );
}