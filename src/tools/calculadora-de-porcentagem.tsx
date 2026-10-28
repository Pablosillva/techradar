"use client";

import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import {
  Alert,
  Checkbox,
  CopyButton,
  EmptyState,
  Field,
  NumberInput,
  ResultLabel,
  ToolPanel,
  TwoColumns,
} from "@/components/tools/tool-ui";
import { cn, formatNumber } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Tipos e helpers                                                           */
/* -------------------------------------------------------------------------- */

type Modo = "aumento" | "desconto" | "porcentagem" | "diferenca";

type Nota = { tom: "info" | "warning"; texto: string };

type Resposta =
  | {
      ok: true;
      titulo: string;
      valor: number;
      sufixo: string;
      formula: string;
      substituicao: string;
      detalhe: string;
      notas: Nota[];
    }
  | { ok: false; erro: string };

/**
 * Barreira única contra degeneração numérica: devolve a mensagem de erro quando
 * a condição falha. Assim `Infinity` e `NaN` nunca chegam a ser formatados.
 */
function guard(condicao: boolean, mensagem: string): string | null {
  return condicao ? mensagem : null;
}

/** Só deixa passar números finitos para a camada de apresentação. */
function finito(valor: number): number | null {
  return Number.isFinite(valor) ? valor : null;
}

function num(valor: number, casas = 6): string {
  return formatNumber(valor, casas);
}

const MODOS: Array<{
  id: Modo;
  nome: string;
  descricao: string;
  a: string;
  b: string;
  aInvertido: string;
  bInvertido: string;
  dica: string;
}> = [
  {
    id: "aumento",
    nome: "Aumento",
    descricao: "Some uma porcentagem a um valor-base.",
    a: "Valor base",
    b: "Percentual do aumento",
    aInvertido: "Valor final (já com o aumento)",
    bInvertido: "Percentual do aumento",
    dica: "Um aumento de 15% equivale a multiplicar por 1,15.",
  },
  {
    id: "desconto",
    nome: "Desconto",
    descricao: "Retire uma porcentagem de um valor-base.",
    a: "Valor base",
    b: "Percentual do desconto",
    aInvertido: "Valor final (já descontado)",
    bInvertido: "Percentual do desconto",
    dica: "Um desconto de 15% equivale a multiplicar por 0,85.",
  },
  {
    id: "porcentagem",
    nome: "Porcentagem de",
    descricao: "Quanto vale X% de um total?",
    a: "Percentual",
    b: "Valor total",
    aInvertido: "Percentual",
    bInvertido: "Valor da parte",
    dica: "“10% de 200” pergunta pela parte; “200 é 10% de quanto” pergunta pelo todo.",
  },
  {
    id: "diferenca",
    nome: "Diferença",
    descricao: "Qual foi a variação percentual entre dois valores?",
    a: "Valor inicial",
    b: "Valor final",
    aInvertido: "Valor inicial",
    bInvertido: "Variação percentual",
    dica: "A variação usa o valor inicial como base da divisão.",
  },
];

/* -------------------------------------------------------------------------- */
/*  Cálculo                                                                   */
/* -------------------------------------------------------------------------- */

/** Curiosidade que quase todo mundo erra: 20% para cima não desfaz 20% para baixo. */
function notaPercentualSimetrico(a: number): Nota | null {
  if (a <= 0) return null;
  const ida = a * 0.8;
  const volta = ida * 1.2;
  return {
    tom: "info",
    texto: `Atenção: descontar 20% e depois subir 20% não volta ao valor original. ${num(
      a,
    )} → ${num(ida)} → ${num(volta)}.`,
  };
}

function calcular(modo: Modo, a: number, b: number, invertido: boolean): Resposta {
  if (modo === "aumento") {
    const fator = 1 + b / 100;
    if (invertido) {
      const erro = guard(
        fator === 0,
        "Um aumento de -100% levaria qualquer valor a zero: não há valor-base possível para chegar ao final informado.",
      );
      if (erro) return { ok: false, erro };
      const base = finito(a / fator);
      if (base === null) return { ok: false, erro: "Não foi possível obter um valor válido." };
      const simetrico = notaPercentualSimetrico(base);
      return {
        ok: true,
        titulo: "Valor base necessário",
        valor: base,
        sufixo: "",
        formula: "valor base = valor final ÷ (1 + taxa ÷ 100)",
        substituicao: `${num(a)} ÷ (1 + ${num(b)} ÷ 100) = ${num(base)}`,
        detalhe: `Partindo de ${num(base)}, o aumento de ${num(b)}% leva o valor a ${num(a)}.`,
        notas: simetrico ? [simetrico] : [],
      };
    }
    const novo = finito(a * fator);
    if (novo === null) return { ok: false, erro: "O resultado ficou fora da faixa numérica." };
    const notas: Nota[] = [];
    const simetrico = notaPercentualSimetrico(a);
    if (simetrico) notas.push(simetrico);
    if (b < 0) {
      notas.push({
        tom: "warning",
        texto: `Aumento negativo: na prática isso é um desconto de ${num(
          Math.abs(b),
        )}%.`,
      });
    }
    return {
      ok: true,
      titulo: "Valor após o aumento",
      valor: novo,
      sufixo: "",
      formula: "novo valor = valor base × (1 + taxa ÷ 100)",
      substituicao: `${num(a)} × (1 + ${num(b)} ÷ 100) = ${num(novo)}`,
      detalhe: `O aumento corresponde a ${num(novo - a)} (${num(b)}% de ${num(a)}).`,
      notas,
    };
  }

  if (modo === "desconto") {
    const fator = 1 - b / 100;
    if (invertido) {
      const erro = guard(
        fator === 0,
        "Um desconto de 100% zera qualquer valor: não existe valor-base que resulte no final informado.",
      );
      if (erro) return { ok: false, erro };
      const base = finito(a / fator);
      if (base === null) return { ok: false, erro: "Não foi possível obter um valor válido." };
      return {
        ok: true,
        titulo: "Valor base necessário",
        valor: base,
        sufixo: "",
        formula: "valor base = valor final ÷ (1 − taxa ÷ 100)",
        substituicao: `${num(a)} ÷ (1 − ${num(b)} ÷ 100) = ${num(base)}`,
        detalhe: `Era preciso partir de ${num(base)} para chegar a ${num(a)} com ${num(
          b,
        )}% de desconto.`,
        notas: [],
      };
    }
    const novo = finito(a * fator);
    if (novo === null) return { ok: false, erro: "O resultado ficou fora da faixa numérica." };
    const notas: Nota[] = [];
    if (b > 100) {
      notas.push({
        tom: "warning",
        texto: `Desconto acima de 100% gera valor negativo (${num(
          novo,
        )}): matematicamente é um acréscimo sobre o desconto.`,
      });
    }
    const simetrico = notaPercentualSimetrico(a);
    if (simetrico) notas.push(simetrico);
    return {
      ok: true,
      titulo: "Valor após o desconto",
      valor: novo,
      sufixo: "",
      formula: "valor final = valor base × (1 − taxa ÷ 100)",
      substituicao: `${num(a)} × (1 − ${num(b)} ÷ 100) = ${num(novo)}`,
      detalhe: `Você economiza ${num(a - novo)} (${num(b)}% de ${num(a)}).`,
      notas,
    };
  }

  if (modo === "porcentagem") {
    const fracao = a / 100;
    if (invertido) {
      const erro = guard(
        fracao === 0,
        "Percentual zero não permite reconstruir o total: 0% de qualquer valor é sempre 0.",
      );
      if (erro) return { ok: false, erro };
      const total = finito(b / fracao);
      if (total === null) return { ok: false, erro: "Não foi possível obter um total válido." };
      return {
        ok: true,
        titulo: "Total de origem",
        valor: total,
        sufixo: "",
        formula: "total = parte ÷ (percentual ÷ 100)",
        substituicao: `${num(b)} ÷ (${num(a)} ÷ 100) = ${num(total)}`,
        detalhe: `${num(b)} representa ${num(a)}% de um total de ${num(total)}; o restante é ${num(
          total - b,
        )}.`,
        notas: [],
      };
    }
    const parte = finito(b * fracao);
    if (parte === null) return { ok: false, erro: "O resultado ficou fora da faixa numérica." };
    return {
      ok: true,
      titulo: `${num(a)}% de ${num(b)}`,
      valor: parte,
      sufixo: "",
      formula: "parte = total × (percentual ÷ 100)",
      substituicao: `${num(b)} × (${num(a)} ÷ 100) = ${num(parte)}`,
      detalhe: `O restante do total é ${num(b - parte)}, ou ${num(100 - a)}% de ${num(b)}.`,
      notas:
        a < 0 || a > 100
          ? [
              {
                tom: "warning",
                texto:
                  a > 100
                    ? "Acima de 100% a “parte” passa a ser maior que o total."
                    : "Percentual negativo resulta em valor negativo.",
              },
            ]
          : [],
    };
  }

  // modo === "diferenca"
  if (invertido) {
    const final = finito(a * (1 + b / 100));
    if (final === null) return { ok: false, erro: "O resultado ficou fora da faixa numérica." };
    return {
      ok: true,
      titulo: "Valor final",
      valor: final,
      sufixo: "",
      formula: "valor final = valor inicial × (1 + variação ÷ 100)",
      substituicao: `${num(a)} × (1 + ${num(b)} ÷ 100) = ${num(final)}`,
      detalhe: `A variação de ${num(b)}% representa ${num(final - a)}.`,
      notas: b < 0 ? [{ tom: "info", texto: "Variação negativa indica queda no período." }] : [],
    };
  }

  const erro = guard(
    a === 0,
    "Divisão por zero: o valor inicial é 0 e não serve de base para uma variação percentual.",
  );
  if (erro) return { ok: false, erro };

  const variacao = finito(((b - a) / a) * 100);
  if (variacao === null) return { ok: false, erro: "O resultado ficou fora da faixa numérica." };

  const notas: Nota[] = [];
  if (variacao < 0) {
    notas.push({ tom: "warning", texto: "Variação negativa: houve queda no período." });
  }
  return {
    ok: true,
    titulo: "Variação percentual",
    valor: variacao,
    sufixo: "%",
    formula: "variação % = (valor final − valor inicial) ÷ valor inicial × 100",
    substituicao: `(${num(b)} − ${num(a)}) ÷ ${num(a)} × 100 = ${num(variacao, 4)}%`,
    detalhe: `A diferença absoluta é ${num(b - a)} e representa ${num(variacao, 4)}% de ${num(a)}.`,
    notas,
  };
}

/* -------------------------------------------------------------------------- */
/*  Componente                                                                */
/* -------------------------------------------------------------------------- */

export default function CalculadoraDePorcentagem() {
  const [modo, setModo] = useState<Modo>("aumento");
  const [valorA, setValorA] = useState<number | "">(1000);
  const [valorB, setValorB] = useState<number | "">(15);
  const [invertido, setInvertido] = useState(false);

  const config = MODOS.find((m) => m.id === modo) ?? MODOS[0];

  const a = typeof valorA === "number" && Number.isFinite(valorA) ? valorA : null;
  const b = typeof valorB === "number" && Number.isFinite(valorB) ? valorB : null;

  const resposta: Resposta | null =
    a === null || b === null ? null : calcular(modo, a, b, invertido);

  const resumo =
    resposta && resposta.ok
      ? [
          `${resposta.titulo}: ${num(resposta.valor, 4)}${resposta.sufixo}`,
          `Fórmula: ${resposta.formula}`,
          `Substituição: ${resposta.substituicao}`,
          resposta.detalhe,
        ].join("\n")
      : "";

  return (
    <div className="space-y-6">
      <ToolPanel>
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-fg">
              Calculadora de Porcentagem
            </h2>
            <p className="mt-1 text-sm text-muted">
              Aumento, desconto, proporção e variação — sempre com a fórmula e a
              substituição passo a passo.
            </p>
          </div>

          <div
            role="group"
            aria-label="Tipo de cálculo"
            className="flex flex-wrap gap-2"
          >
            {MODOS.map((m) => (
              <button
                key={m.id}
                type="button"
                aria-pressed={modo === m.id}
                onClick={() => setModo(m.id)}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                  modo === m.id
                    ? "bg-brand text-white"
                    : "border border-line bg-surface-2 text-muted hover:border-brand/50 hover:text-fg",
                )}
              >
                {m.nome}
              </button>
            ))}
          </div>

          <p className="text-sm text-muted">{config.descricao}</p>

          <TwoColumns>
            <Field
              label={invertido ? config.aInvertido : config.a}
              hint="Digite o número. Use vírgula para os decimais."
            >
              <NumberInput value={valorA} onValueChange={setValorA} />
            </Field>

            <Field
              label={invertido ? config.bInvertido : config.b}
              hint={config.dica}
            >
              <NumberInput value={valorB} onValueChange={setValorB} />
            </Field>
          </TwoColumns>

          <Checkbox
            label="Inverter o cálculo (resolver a incógnita no sentido contrário)"
            checked={invertido}
            onChange={setInvertido}
          />
        </div>
      </ToolPanel>

      {resposta === null ? (
        <ToolPanel>
          <EmptyState>Preencha os dois campos para ver o resultado.</EmptyState>
        </ToolPanel>
      ) : !resposta.ok ? (
        <ToolPanel>
          <Alert tone="error">{resposta.erro}</Alert>
        </ToolPanel>
      ) : (
        <TwoColumns>
          <ToolPanel>
            <ResultLabel>{resposta.titulo}</ResultLabel>
            <p className="font-mono text-3xl font-bold tabular-nums text-brand">
              {num(resposta.valor, 4)}
              <span className="ml-1 text-lg text-muted">{resposta.sufixo}</span>
            </p>
            <p className="mt-2 text-sm text-muted">{resposta.detalhe}</p>
            <div className="mt-4">
              <CopyButton value={resumo} label="Copiar cálculo" />
            </div>
          </ToolPanel>

          <ToolPanel>
            <ResultLabel>Como o resultado é obtido</ResultLabel>
            <code className="block rounded-lg border border-line bg-surface-2 px-3 py-2.5 font-mono text-xs leading-relaxed text-fg">
              {resposta.formula}
            </code>
            <div className="mt-3">
              <ResultLabel>Substituindo os seus números</ResultLabel>
              <code className="block rounded-lg border border-line bg-surface-2 px-3 py-2.5 font-mono text-xs leading-relaxed text-brand">
                {resposta.substituicao}
              </code>
            </div>
            {resposta.notas.length > 0 ? (
              <div className="mt-3 space-y-2">
                {resposta.notas.map((nota) => (
                  <Alert key={nota.texto} tone={nota.tom}>
                    {nota.texto}
                  </Alert>
                ))}
              </div>
            ) : null}
          </ToolPanel>
        </TwoColumns>
      )}

      <ToolPanel>
        <ResultLabel>
          <span className="inline-flex items-center gap-1.5">
            <ArrowLeftRight className="size-3.5" aria-hidden="true" />
            Regras rápidas
          </span>
        </ResultLabel>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted">
          <li>
            Descontar 20% e depois subir 20% não devolve o valor original: o
            resultado é 96% do ponto de partida.
          </li>
          <li>
            Para desfazer um desconto, divida pelo fator: um cupom de 20% sobre
            R$ 80 saiu de R$ 100, porque 100 × 0,8 = 80.
          </li>
          <li>
            Variação percentual e percentual de valor não são a mesma conta —
            a primeira divide pelo inicial, a segunda multiplica pelo total.
          </li>
        </ul>
      </ToolPanel>
    </div>
  );
}
