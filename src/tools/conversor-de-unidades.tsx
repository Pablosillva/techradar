"use client";

import { useMemo, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import {
  Alert,
  ButtonRow,
  CopyButton,
  EmptyState,
  Field,
  NumberInput,
  ResultLabel,
  Select,
  ToolPanel,
  TwoColumns,
} from "@/components/tools/tool-ui";
import { cn, formatNumber } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Tabelas de unidades                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Uma unidade sabe entrar e sair da unidade base da sua grandeza. Temperatura
 * precisa de `toBase`/`fromBase` porque tem deslocamento de zero, não apenas
 * escala — por isso a interface é um par de funções e não um fator só.
 */
type Unidade = {
  id: string;
  nome: string;
  simbolo: string;
  paraBase: (valor: number) => number;
  daBase: (base: number) => number;
};

type Grandeza = {
  id: string;
  nome: string;
  base: string;
  resumo: string;
  unidades: Unidade[];
};

/** Unidades puramente proporcionais: um único fator resolve. */
function linear(nome: string, simbolo: string, fatorParaBase: number): Unidade {
  return {
    id: simbolo,
    nome,
    simbolo,
    paraBase: (valor) => valor * fatorParaBase,
    daBase: (base) => base / fatorParaBase,
  };
}

function temperatura(
  nome: string,
  simbolo: string,
  paraBase: (valor: number) => number,
  daBase: (base: number) => number,
): Unidade {
  return { id: simbolo, nome, simbolo, paraBase, daBase };
}

const GRANDEZAS: Grandeza[] = [
  {
    id: "comprimento",
    nome: "Comprimento",
    base: "m",
    resumo: "Distâncias curtas e longas, do milímetro à milha.",
    unidades: [
      linear("Milímetro", "mm", 0.001),
      linear("Centímetro", "cm", 0.01),
      linear("Metro", "m", 1),
      linear("Quilômetro", "km", 1000),
      linear("Polegada", "in", 0.0254),
      linear("Pé", "ft", 0.3048),
      linear("Jarda", "yd", 0.9144),
      linear("Milha", "mi", 1609.344),
    ],
  },
  {
    id: "massa",
    nome: "Massa",
    base: "kg",
    resumo: "De miligramas a toneladas, incluindo onça e libra.",
    unidades: [
      linear("Miligrama", "mg", 1e-6),
      linear("Grama", "g", 0.001),
      linear("Quilograma", "kg", 1),
      linear("Tonelada", "t", 1000),
      linear("Onça", "oz", 0.028349523125),
      linear("Libra", "lb", 0.45359237),
    ],
  },
  {
    id: "temperatura",
    nome: "Temperatura",
    base: "°C",
    resumo:
      "Escalas com zero deslocado: °C e °F usam soma de 32, K desloca 273,15.",
    unidades: [
      temperatura("Celsius", "°C", (c) => c, (c) => c),
      temperatura("Fahrenheit", "°F", (f) => (f - 32) * (5 / 9), (c) => c * (9 / 5) + 32),
      temperatura("Kelvin", "K", (k) => k - 273.15, (c) => c + 273.15),
    ],
  },
  {
    id: "area",
    nome: "Área",
    base: "m²",
    resumo: "Superfícies, do milímetro quadrado ao quilômetro quadrado.",
    unidades: [
      linear("Milímetro quadrado", "mm²", 1e-6),
      linear("Centímetro quadrado", "cm²", 1e-4),
      linear("Metro quadrado", "m²", 1),
      linear("Quilômetro quadrado", "km²", 1e6),
      linear("Hectare", "ha", 1e4),
      linear("Pé quadrado", "ft²", 0.09290304),
    ],
  },
  {
    id: "volume",
    nome: "Volume",
    base: "L",
    resumo: "Capacidades, do mililitro ao galão (galão e onça norte-americanos).",
    unidades: [
      linear("Mililitro", "mL", 0.001),
      linear("Litro", "L", 1),
      linear("Metro cúbico", "m³", 1000),
      linear("Galão", "gal", 3.785411784),
      linear("Onça (fluida)", "fl oz", 0.0295735295625),
    ],
  },
  {
    id: "velocidade",
    nome: "Velocidade",
    base: "m/s",
    resumo: "Velocidades em terra e no mar, incluindo o nó náutico.",
    unidades: [
      linear("Metro por segundo", "m/s", 1),
      linear("Quilômetro por hora", "km/h", 1 / 3.6),
      linear("Milha por hora", "mph", 0.44704),
      linear("Nó (mar knot)", "nó", 1852 / 3600),
      linear("Quilômetro por segundo", "km/s", 1000),
    ],
  },
  {
    id: "tempo",
    nome: "Tempo",
    base: "s",
    resumo: "Intervalos de milissegundos até semanas.",
    unidades: [
      linear("Milissegundo", "ms", 0.001),
      linear("Segundo", "s", 1),
      linear("Minuto", "min", 60),
      linear("Hora", "h", 3600),
      linear("Dia", "dia", 86400),
      linear("Semana", "semana", 604800),
    ],
  },
  {
    id: "dados",
    nome: "Dados",
    base: "byte",
    resumo:
      "Decimal (KB = 1.000 bytes) e binário (KiB = 1.024 bytes) lado a lado.",
    unidades: [
      linear("Bit", "bit", 1 / 8),
      linear("Byte", "B", 1),
      linear("Quilobyte", "kB", 1e3),
      linear("Megabyte", "MB", 1e6),
      linear("Gigabyte", "GB", 1e9),
      linear("Terabyte", "TB", 1e12),
      linear("Kibibyte", "KiB", 1024),
      linear("Mebibyte", "MiB", 1024 ** 2),
      linear("Gibibyte", "GiB", 1024 ** 3),
    ],
  },
];

/* -------------------------------------------------------------------------- */
/*  Formatação                                                                */
/* -------------------------------------------------------------------------- */

const LIMITE_CIENTIFICO = 1e15;
const LIMITE_MINIMO = 1e-9;

/**
 * Acima de ~1e15 ou abaixo de ~1e-9 o `Intl` vira um garrancho de zeros, então
 * nesses extremos caímos para notação científica com vírgula decimal.
 */
function formatarValor(valor: number): string {
  if (!Number.isFinite(valor)) return "—";
  if (valor === 0) return "0";
  const absoluto = Math.abs(valor);
  if (absoluto >= LIMITE_CIENTIFICO || absoluto < LIMITE_MINIMO) {
    const [mantissa, expoente] = valor.toExponential(6).split("e");
    const limpa = mantissa
      .replace(/(\.\d*?[1-9])0+$/, "$1")
      .replace(/\.0+$/, "")
      .replace(".", ",");
    return `${limpa}e${expoente}`;
  }
  return formatNumber(valor, absoluto >= 1 ? 6 : 12);
}

/* -------------------------------------------------------------------------- */
/*  Componente                                                                */
/* -------------------------------------------------------------------------- */

export default function ConversorDeUnidades() {
  const [grandezaId, setGrandezaId] = useState(GRANDEZAS[0].id);
  const [origemId, setOrigemId] = useState(GRANDEZAS[0].unidades[2].id);
  const [destinoId, setDestinoId] = useState(GRANDEZAS[0].unidades[3].id);
  const [entrada, setEntrada] = useState<number | "">(1);

  const grandeza =
    GRANDEZAS.find((g) => g.id === grandezaId) ?? GRANDEZAS[0];

  function trocarGrandeza(id: string) {
    const proxima = GRANDEZAS.find((g) => g.id === id) ?? GRANDEZAS[0];
    setGrandezaId(proxima.id);
    setOrigemId(proxima.unidades[0].id);
    setDestinoId(proxima.unidades[1]?.id ?? proxima.unidades[0].id);
  }

  function trocarUnidade(campo: "origem" | "destino", id: string) {
    if (campo === "origem") setOrigemId(id);
    else setDestinoId(id);
  }

  function inverter() {
    setOrigemId(destinoId);
    setDestinoId(origemId);
  }

  const origem =
    grandeza.unidades.find((u) => u.id === origemId) ?? grandeza.unidades[0];
  const destino =
    grandeza.unidades.find((u) => u.id === destinoId) ?? grandeza.unidades[1];

  const valor =
    typeof entrada === "number" && Number.isFinite(entrada) ? entrada : null;

  const linhas = useMemo(() => {
    if (valor === null) return [];
    const base = origem.paraBase(valor);
    return grandeza.unidades.map((unidade) => {
      const convertido = unidade.daBase(base);
      return { unidade, texto: formatarValor(convertido) };
    });
  }, [grandeza, origem, valor]);

  const linhaDestino = linhas.find((l) => l.unidade.id === destino.id);
  const resultadoPrincipal = linhaDestino?.texto ?? "—";

  const textoResultado =
    valor === null
      ? ""
      : `${formatarValor(valor)} ${origem.simbolo} = ${resultadoPrincipal} ${destino.simbolo}`;

  return (
    <div className="space-y-6">
      <ToolPanel>
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-fg">
              Conversor de Unidades
            </h2>
            <p className="mt-1 text-sm text-muted">
              Comprimento, massa, temperatura, área, volume, velocidade, tempo e
              dados. O cálculo inteiro roda no navegador.
            </p>
          </div>

          <TwoColumns>
            <Field label="Grandeza" hint={grandeza.resumo}>
              <Select
                value={grandeza.id}
                onChange={(e) => trocarGrandeza(e.target.value)}
              >
                {GRANDEZAS.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nome}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Valor"
              hint={`Unidade base da grandeza: ${grandeza.base}`}
            >
              <NumberInput
                value={entrada}
                onValueChange={setEntrada}
                placeholder="1"
                aria-label={`Valor em ${origem.nome}`}
              />
            </Field>
          </TwoColumns>

          <TwoColumns>
            <Field label="De">
              <Select
                value={origem.id}
                onChange={(e) => trocarUnidade("origem", e.target.value)}
              >
                {grandeza.unidades.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome} ({u.simbolo})
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Para">
              <Select
                value={destino.id}
                onChange={(e) => trocarUnidade("destino", e.target.value)}
              >
                {grandeza.unidades.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome} ({u.simbolo})
                  </option>
                ))}
              </Select>
            </Field>
          </TwoColumns>

          <ButtonRow>
            <button
              type="button"
              onClick={inverter}
              className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs font-semibold text-fg transition-colors hover:border-brand/50"
            >
              <ArrowLeftRight className="size-3.5" aria-hidden="true" />
              Inverter unidades
            </button>
          </ButtonRow>
        </div>
      </ToolPanel>

      {valor === null ? (
        <ToolPanel>
          <EmptyState>
            Digite um número no campo de valor para ver as conversões.
          </EmptyState>
        </ToolPanel>
      ) : (
        <TwoColumns>
          <ToolPanel>
            <ResultLabel>Resultado</ResultLabel>
            <p className="font-mono text-3xl font-bold tabular-nums text-brand">
              {resultadoPrincipal}
              <span className="ml-2 text-lg text-muted">{destino.simbolo}</span>
            </p>
            <p className="mt-2 font-mono text-xs text-subtle tabular-nums">
              {formatarValor(valor)} {origem.simbolo} = {resultadoPrincipal}{" "}
              {destino.simbolo}
            </p>
            <div className="mt-4">
              <CopyButton value={textoResultado} label="Copiar conversão" />
            </div>
          </ToolPanel>

          <ToolPanel>
            <ResultLabel>Todas as unidades de {grandeza.nome.toLowerCase()}</ResultLabel>
            <div className="max-h-[26rem] overflow-y-auto rounded-lg border border-line">
              <table className="w-full border-collapse text-sm">
                <caption className="sr-only">
                  Valor convertido em todas as unidades de {grandeza.nome}.
                </caption>
                <thead className="bg-surface-2 text-left text-xs text-muted">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-semibold">
                      Unidade
                    </th>
                    <th scope="col" className="px-3 py-2 font-semibold">
                      Valor
                    </th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">
                      Copiar
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {linhas.map(({ unidade, texto }) => {
                    const destacado = unidade.id === destino.id;
                    return (
                      <tr
                        key={unidade.id}
                        className={cn(
                          "border-t border-line",
                          destacado && "bg-brand/10",
                        )}
                      >
                        <td className="px-3 py-2">
                          <span
                            className={cn(
                              "text-fg",
                              destacado && "font-bold text-brand",
                            )}
                          >
                            {unidade.simbolo}
                          </span>
                          <span className="ml-2 text-xs text-subtle">
                            {unidade.nome}
                          </span>
                        </td>
                        <td
                          className={cn(
                            "px-3 py-2 font-mono text-xs tabular-nums",
                            destacado ? "text-brand" : "text-fg",
                          )}
                        >
                          {texto}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <CopyButton
                            value={texto}
                            label="Copiar"
                            className="px-2 py-1"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {destino.id === origem.id ? (
              <div className="mt-3">
                <Alert tone="info">
                  Origem e destino são a mesma unidade. Escolha unidades
                  diferentes para ver a conversão.
                </Alert>
              </div>
            ) : null}
          </ToolPanel>
        </TwoColumns>
      )}
    </div>
  );
}
