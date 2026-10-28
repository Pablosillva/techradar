"use client";

import { useMemo, useState } from "react";
import {
  Calculator,
  ChevronDown,
  ChevronUp,
  Pin,
  PinOff,
  TrendingUp,
} from "lucide-react";
import {
  Alert,
  ButtonRow,
  Checkbox,
  CopyButton,
  Field,
  NumberInput,
  ResultLabel,
  ToolPanel,
  TwoColumns,
} from "@/components/tools/tool-ui";
import { cn, formatNumber } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Matemática do sistema Price                                               */
/* -------------------------------------------------------------------------- */

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function moeda(valor: number): string {
  return Number.isFinite(valor) ? brl.format(valor) : "—";
}

function pct(valor: number, casas = 2): string {
  return Number.isFinite(valor) ? `${formatNumber(valor, casas)}%` : "—";
}

/**
 * PMT = PV × i ÷ (1 − (1 + i)^-n)
 *
 * O denominador NÃO leva `Math.abs`: o sinal faz parte da conta e envolvê-lo em
 * valor absoluto devolveria uma parcela errada justamente nos casos limite.
 * Quando `i === 0` a fórmula explode (divisão por zero) e o correto é `PV ÷ n`.
 */
function pmt(saldo: number, i: number, meses: number): number | null {
  if (!Number.isFinite(saldo) || !Number.isFinite(i) || !Number.isFinite(meses)) {
    return null;
  }
  if (saldo <= 0 || meses <= 0) return null;
  if (i === 0) return saldo / meses;
  const denominador = 1 - (1 + i) ** -meses;
  if (!Number.isFinite(denominador) || denominador === 0) return null;
  const resultado = (saldo * i) / denominador;
  return Number.isFinite(resultado) ? resultado : null;
}

/** Taxa mensal equivalente a partir da taxa anual informada. */
function taxaMensalEquivalente(taxaAnual: number): number | null {
  if (!Number.isFinite(taxaAnual) || taxaAnual <= -100) return null;
  const mensal = (1 + taxaAnual / 100) ** (1 / 12) - 1;
  return Number.isFinite(mensal) ? mensal : null;
}

type Linha = {
  mes: number;
  juros: number;
  amortizacao: number;
  saldo: number;
};

function montarTabela(
  saldoInicial: number,
  i: number,
  meses: number,
  parcela: number,
): Linha[] {
  const linhas: Linha[] = [];
  let saldo = saldoInicial;
  for (let mes = 1; mes <= meses; mes += 1) {
    if (saldo <= 1e-9) break;
    const juros = saldo * i;
    // No último mês a amortização zera exatamente o saldo: evita o resto de
    // ponto flutuante que sobraria se continuássemos subtraindo a parcela.
    const amortizacao = mes === meses ? saldo : parcela - juros;
    const novoSaldo = mes === meses ? 0 : Math.max(0, saldo - amortizacao);
    linhas.push({ mes, juros, amortizacao: amortizacao, saldo: novoSaldo });
    saldo = novoSaldo;
  }
  return linhas;
}

/**
 * Taxa mensal que iguala as parcelas ao saldo devedor — a taxa que realmente
 * você paga, já embutidos os encargos fixos. `pmt(j)` é crescentemente monótona
 * em `j` (mais juros, parcela maior), então a bisseção converge sem derivada.
 */
function taxaEfetivaMensal(
  parcela: number,
  saldo: number,
  meses: number,
): number | null {
  const pmtMinimo = saldo / meses;
  // Parcela igual ao mínimo significa custo zero; abaixo disso, custo negativo.
  if (parcela <= pmtMinimo) return parcela === pmtMinimo ? 0 : null;

  // pmt(0) = saldo/meses < parcela, então a raiz está acima de 0: basta achar
  // um `alto` que já estoure a parcela e apertar o intervalo.
  let baixo = 0;
  let alto = 1;
  for (let passo = 0; passo < 200; passo += 1) {
    const valor = pmt(saldo, alto, meses);
    if (valor !== null && valor >= parcela) break;
    alto *= 2;
  }
  for (let passo = 0; passo < 200; passo += 1) {
    const meio = (baixo + alto) / 2;
    const valor = pmt(saldo, meio, meses);
    if (valor !== null && valor >= parcela) alto = meio;
    else baixo = meio;
  }
  return (baixo + alto) / 2;
}

/* -------------------------------------------------------------------------- */
/*  Simulação                                                                 */
/* -------------------------------------------------------------------------- */

type Cenario = {
  valor: number;
  entrada: number;
  meses: number;
  taxaAnual: number;
  taxaMensal: number;
};

type Simulacao = {
  saldo: number;
  i: number;
  taxaMensal: number;
  pmt: number;
  parcela: number;
  totalPago: number;
  totalJuros: number;
  encargos: number;
  relacaoCusto: number;
  percentualJuros: number;
  cet: number | null;
  tabela: Linha[];
};

function simular(cenario: Cenario): Simulacao | null {
  const { valor, entrada, meses, taxaAnual, taxaMensal } = cenario;
  const saldo = valor - entrada;
  const i = taxaMensalEquivalente(taxaAnual);
  if (i === null || saldo <= 0 || meses <= 0) return null;

  const principal = pmt(saldo, i, meses);
  if (principal === null) return null;

  const parcela = principal + taxaMensal;
  const tabela = montarTabela(saldo, i, meses, principal);
  const totalPago = parcela * meses;
  const totalJuros = principal * meses - saldo;
  const encargos = taxaMensal * meses;
  const percentualJuros = (totalJuros / saldo) * 100;

  // CET estimado: taxa anual que iguala as parcelas ao saldo recebido, já com os
  // encargos fixos dentro. Anunciar esse número como o custo total pago daria
  // um resultado irreal — a razão abaixo é exibida à parte, como métrica própria.
  const razao = totalPago / saldo;
  const efetivaMensal = taxaEfetivaMensal(parcela, saldo, meses);
  const cetAnual =
    efetivaMensal === null ? null : ((1 + efetivaMensal) ** 12 - 1) * 100;

  return {
    saldo,
    i,
    taxaMensal,
    pmt: principal,
    parcela,
    totalPago,
    totalJuros,
    encargos,
    relacaoCusto: razao,
    percentualJuros: Number.isFinite(percentualJuros) ? percentualJuros : 0,
    cet: cetAnual !== null && Number.isFinite(cetAnual) ? cetAnual : null,
    tabela,
  };
}

/* -------------------------------------------------------------------------- */
/*  Validação                                                                 */
/* -------------------------------------------------------------------------- */

function validar(cenario: Cenario): string[] {
  const campos = [
    cenario.valor,
    cenario.entrada,
    cenario.meses,
    cenario.taxaAnual,
    cenario.taxaMensal,
  ];
  // Sem esta porta, um campo em branco viraria `NaN`, `simular` devolveria `null`
  // e a tela ficaria vazia sem nenhuma explicação.
  if (!campos.every(Number.isFinite)) {
    return ["Preencha todos os campos com números válidos antes de simular."];
  }

  const erros: string[] = [];
  if (!(cenario.valor > 0)) {
    erros.push("Informe um valor financiado maior que zero.");
  }
  if (cenario.entrada < 0) {
    erros.push("A entrada não pode ser negativa.");
  }
  if (cenario.entrada >= cenario.valor && cenario.valor > 0) {
    erros.push(
      "A entrada precisa ser menor que o valor financiado — do contrário não sobra saldo devedor.",
    );
  }
  if (!Number.isInteger(cenario.meses) || cenario.meses < 1 || cenario.meses > 480) {
    erros.push("O prazo precisa ser um número inteiro entre 1 e 480 meses (40 anos).");
  }
  if (cenario.taxaAnual < 0 || cenario.taxaAnual > 300) {
    erros.push("Informe uma taxa anual entre 0% e 300%.");
  }
  if (cenario.taxaMensal < 0) {
    erros.push("A taxa mensal adicional (seguro, taxa de administration) não pode ser negativa.");
  }
  return erros;
}

function numero(valor: number | ""): number {
  return typeof valor === "number" && Number.isFinite(valor) ? valor : Number.NaN;
}

/* -------------------------------------------------------------------------- */
/*  Componente                                                                */
/* -------------------------------------------------------------------------- */

function Cartao({
  titulo,
  valor,
  rodape,
}: {
  titulo: string;
  valor: string;
  rodape?: string;
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-surface-2 px-3 py-3">
      <p className="text-xs font-semibold text-muted">{titulo}</p>
      <p className="mt-1 font-mono text-lg font-bold tabular-nums text-fg">{valor}</p>
      {rodape ? <p className="mt-0.5 text-xs leading-relaxed text-subtle">{rodape}</p> : null}
    </div>
  );
}

export default function CalculadoraDeFinanciamento() {
  const [valor, setValor] = useState<number | "">(40000);
  const [entrada, setEntrada] = useState<number | "">(8000);
  const [meses, setMeses] = useState<number | "">(60);
  const [taxaAnual, setTaxaAnual] = useState<number | "">(12);
  const [taxaMensal, setTaxaMensal] = useState<number | "">(0);
  const [mostrarTodas, setMostrarTodas] = useState(false);
  const [mostrarTaxa, setMostrarTaxa] = useState(false);
  const [fixado, setFixado] = useState<Simulacao | null>(null);
  const [mesesExtras, setMesesExtras] = useState<number | "">(12);

  const cenario: Cenario = useMemo(
    () => ({
      valor: numero(valor),
      entrada: numero(entrada),
      meses: numero(meses),
      taxaAnual: numero(taxaAnual),
      taxaMensal: numero(taxaMensal),
    }),
    [valor, entrada, meses, taxaAnual, taxaMensal],
  );

  const erros = useMemo(() => validar(cenario), [cenario]);
  const resultado = erros.length === 0 ? simular(cenario) : null;

  const extras = numero(mesesExtras);
  const cenarioEstendido = useMemo(() => {
    if (!resultado || !Number.isFinite(extras) || extras <= 0) return null;
    return simular({ ...cenario, meses: cenario.meses + Math.round(extras) });
  }, [cenario, extras, resultado]);

  const linhasVisiveis = mostrarTodas
    ? (resultado?.tabela ?? [])
    : (resultado?.tabela ?? []).slice(0, 12);

  const textoCopiar = resultado
    ? [
        `Parcela mensal: ${moeda(resultado.parcela)}`,
        `Total pago: ${moeda(resultado.totalPago)}`,
        `Total de juros: ${moeda(resultado.totalJuros)}`,
        `Juros sobre o saldo devedor: ${pct(resultado.percentualJuros)}`,
        `CET estimado (a.a.): ${
          resultado.cet === null ? "—" : pct(resultado.cet)
        }`,
        `Saldo devedor inicial: ${moeda(resultado.saldo)}`,
        `Taxa mensal equivalente: ${pct(resultado.i * 100, 4)}`,
      ].join("\n")
    : "";

  return (
    <div className="space-y-6">
      <ToolPanel>
        <div className="space-y-5">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-fg">
              <Calculator className="size-5 text-brand" aria-hidden="true" />
              Calculadora de Financiamento
            </h2>
            <p className="mt-1 text-sm text-muted">
              Sistema Price (parcelas fixas). Simule a parcela, o custo total e
              compare o efeito de mexer no prazo ou na taxa.
            </p>
          </div>

          <TwoColumns>
            <Field label="Valor financiado" hint="Preço total do bem ou imóvel.">
              <NumberInput value={valor} onValueChange={setValor} placeholder="40000" />
            </Field>

            <Field
              label="Entrada"
              hint={`Saldo devedor inicial: ${
                resultado ? moeda(resultado.saldo) : "valor menos a entrada"
              }`}
            >
              <NumberInput value={entrada} onValueChange={setEntrada} placeholder="8000" />
            </Field>
          </TwoColumns>

          <TwoColumns>
            <Field label="Prazo (meses)" hint="Entre 1 e 480 meses.">
              <NumberInput value={meses} onValueChange={setMeses} placeholder="60" />
            </Field>

            <Field
              label="Taxa de juros ao ano (%)"
              hint={
                resultado
                  ? `Equivale a ${pct(resultado.i * 100, 4)} ao mês (taxa efetiva).`
                  : "A taxa mensal é derivada da anual por equivalência composta."
              }
            >
              <NumberInput
                value={taxaAnual}
                onValueChange={setTaxaAnual}
                placeholder="12"
              />
            </Field>
          </TwoColumns>

          <Field
            label="Taxa mensal adicional (R$)"
            hint="Seguro, tarifa de administração ou qualquer encargo fixo somado à parcela."
          >
            <NumberInput
              value={taxaMensal}
              onValueChange={setTaxaMensal}
              placeholder="0"
            />
          </Field>
        </div>
      </ToolPanel>

      {erros.length > 0 ? (
        <ToolPanel className="space-y-2">
          {erros.map((erro) => (
            <Alert key={erro} tone="error">
              {erro}
            </Alert>
          ))}
        </ToolPanel>
      ) : null}

      {!resultado ? null : (
        <>
          <TwoColumns>
            <ToolPanel>
              <ResultLabel>Parcela mensal</ResultLabel>
              <p className="font-mono text-3xl font-bold tabular-nums text-brand">
                {moeda(resultado.parcela)}
              </p>
              <p className="mt-2 text-sm text-muted">
                {moeda(resultado.pmt)} de juros e amortização
                {resultado.taxaMensal > 0
                  ? ` + ${moeda(resultado.taxaMensal)} de encargos fixos`
                  : ""}
                , em {cenario.meses} parcelas.
              </p>
              <div className="mt-4">
                <CopyButton value={textoCopiar} label="Copiar simulação" />
              </div>
            </ToolPanel>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Cartao
                titulo="Total pago"
                valor={moeda(resultado.totalPago)}
                rodape={`${cenario.meses} parcelas de ${moeda(resultado.parcela)} · ${
                  formatNumber(resultado.relacaoCusto, 2)
                }× o valor financiado`}
              />
              <Cartao
                titulo="Total de juros"
                valor={moeda(resultado.totalJuros)}
                rodape={
                  resultado.taxaMensal > 0
                    ? `Só juros. Os encargos fixos somam mais ${moeda(resultado.encargos)} à parte.`
                    : "Somente juros sobre o saldo devedor"
                }
              />
              <Cartao
                titulo="Juros sobre o valor financiado"
                valor={pct(resultado.percentualJuros)}
                rodape={`Sobre o saldo devedor de ${moeda(resultado.saldo)}`}
              />
              <Cartao
                titulo="CET estimado (a.a.)"
                valor={resultado.cet === null ? "—" : pct(resultado.cet)}
                rodape="Estimativa: taxa que iguala as parcelas ao valor recebido. Não inclui IPTU, seguros, tarifas ou carência."
              />
            </div>
          </TwoColumns>

          <ToolPanel>
            <ResultLabel>Fórmulas usadas</ResultLabel>
            <div className="space-y-2">
              <code className="block rounded-lg border border-line bg-surface-2 px-3 py-2.5 font-mono text-xs leading-relaxed text-fg">
                Taxa mensal efetiva: i = (1 + taxa anual ÷ 100)^(1/12) − 1 ={" "}
                {pct(resultado.i * 100, 4)}
              </code>
              <code className="block rounded-lg border border-line bg-surface-2 px-3 py-2.5 font-mono text-xs leading-relaxed text-fg">
                PMT = PV × i ÷ (1 − (1 + i)^−n)
              </code>
              <code className="block rounded-lg border border-line bg-surface-2 px-3 py-2.5 font-mono text-xs leading-relaxed text-brand">
                = {moeda(resultado.saldo)} × {resultado.i.toFixed(6)} ÷ (1 − (1 +{" "}
                {resultado.i.toFixed(6)})^−{cenario.meses}) = {moeda(resultado.pmt)}
              </code>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-subtle">
              Quando a taxa é zero a fórmula acima não se aplica e a parcela vira
              simplesmente PV ÷ n. O denominador nunca é normalizado em valor
              absoluto, porque o sinal é parte da conta.
            </p>
          </ToolPanel>

          <ToolPanel>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <ResultLabel>Planilha de amortização ({resultado.tabela.length} meses)</ResultLabel>
              <ButtonRow>
                <button
                  type="button"
                  onClick={() => setMostrarTodas((v) => !v)}
                  aria-expanded={mostrarTodas}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs font-semibold text-fg transition-colors hover:border-brand/50"
                >
                  {mostrarTodas ? (
                    <ChevronUp className="size-3.5" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="size-3.5" aria-hidden="true" />
                  )}
                  {mostrarTodas ? "Mostrar só os 12 primeiros" : "Ver todos"}
                </button>
              </ButtonRow>
            </div>

            <div className="max-h-[28rem] overflow-y-auto rounded-lg border border-line">
              <table className="w-full border-collapse text-sm">
                <caption className="sr-only">
                  Planilha de amortização do sistema Price, mês a mês.
                </caption>
                <thead className="sticky top-0 bg-surface-2 text-left text-xs text-muted">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-semibold">Mês</th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">Juros</th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">Amortização</th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">Saldo devedor</th>
                  </tr>
                </thead>
                <tbody>
                  {linhasVisiveis.map((linha) => (
                    <tr key={linha.mes} className="border-t border-line">
                      <td className="px-3 py-1.5 font-mono text-xs tabular-nums text-muted">
                        {linha.mes}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono text-xs tabular-nums text-danger">
                        {moeda(linha.juros)}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono text-xs tabular-nums text-success">
                        {moeda(linha.amortizacao)}
                      </td>
                      <td
                        className={cn(
                          "px-3 py-1.5 text-right font-mono text-xs tabular-nums",
                          linha.saldo === 0 ? "text-success" : "text-fg",
                        )}
                      >
                        {moeda(linha.saldo)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!mostrarTodas && resultado.tabela.length > 12 ? (
              <p className="mt-2 text-xs text-subtle">
                Mostrando os 12 primeiros meses de {resultado.tabela.length}. Use
                “Ver todos” para abrir a planilha completa.
              </p>
            ) : null}
          </ToolPanel>

          <ToolPanel>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <ResultLabel>Comparar cenários</ResultLabel>
              <ButtonRow>
                <button
                  type="button"
                  onClick={() => setFixado(resultado)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-strong"
                >
                  <Pin className="size-3.5" aria-hidden="true" />
                  Fixar cenário atual
                </button>
                {fixado ? (
                  <button
                    type="button"
                    onClick={() => setFixado(null)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs font-semibold text-fg transition-colors hover:border-brand/50"
                  >
                    <PinOff className="size-3.5" aria-hidden="true" />
                    Limpar referência
                  </button>
                ) : null}
              </ButtonRow>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Cartao
                titulo="Cenário atual"
                valor={moeda(resultado.parcela)}
                rodape={`${cenario.meses} meses · ${pct(cenario.taxaAnual)} a.a. · ${moeda(
                  resultado.totalJuros,
                )} de juros`}
              />

              {fixado ? (
                <Cartao
                  titulo="Cenário fixado (referência)"
                  valor={moeda(fixado.parcela)}
                  rodape={`${moeda(fixado.totalJuros)} de juros no total`}
                />
              ) : (
                <Cartao
                  titulo="Sem referência fixada"
                  valor="—"
                  rodape="Use “Fixar cenário atual” e depois mude o prazo ou a taxa para ver a diferença."
                />
              )}
            </div>

            {fixado ? (
              <div className="mt-3">
                <Alert
                  tone={
                    resultado.parcela < fixado.parcela ? "warning" : "info"
                  }
                >
                  {resultado.parcela < fixado.parcela
                    ? `A parcela caiu ${moeda(fixado.parcela - resultado.parcela)} (${moeda(
                        fixado.parcela,
                      )} → ${moeda(resultado.parcela)}), e o total de juros subiu ${moeda(
                        resultado.totalJuros - fixado.totalJuros,
                      )}. Parcela menor por mais tempo é exatamente como o Price cobra juros.`
                    : `A parcela subiu ${moeda(resultado.parcela - fixado.parcela)} (${moeda(
                        fixado.parcela,
                      )} → ${moeda(resultado.parcela)}), e o total de juros ${(
                        resultado.totalJuros <= fixado.totalJuros ? "caiu" : "subiu"
                      )} ${moeda(Math.abs(resultado.totalJuros - fixado.totalJuros))}.`}
                </Alert>
              </div>
            ) : null}

            <div className="mt-4 max-w-xs">
              <Field
                label="Estender o prazo em (meses)"
                hint="Simula o que acontece se você esticar o contrato por esse tempo."
              >
                <NumberInput
                  value={mesesExtras}
                  onValueChange={setMesesExtras}
                  placeholder="12"
                />
              </Field>
            </div>

            {cenarioEstendido ? (
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Se você estender o prazo em {Math.round(extras)}{" "}
                {Math.round(extras) === 1 ? "mês" : "meses"}, a parcela cai para{" "}
                <strong className="font-mono tabular-nums text-brand">
                  {moeda(cenarioEstendido.parcela)}
                </strong>{" "}
                e você paga{" "}
                <strong className="font-mono tabular-nums text-danger">
                  {moeda(cenarioEstendido.totalJuros - resultado.totalJuros)}
                </strong>{" "}
                a mais de juros —{" "}
                <span className="tabular-nums">
                  {moeda(resultado.totalJuros)} → {moeda(cenarioEstendido.totalJuros)}
                </span>{" "}
                no total.
              </p>
            ) : (
              <div className="mt-3">
                <Alert tone="info">
                  Informe quantos meses a mais você quer somar ao prazo para ver a
                  projeção.
                </Alert>
              </div>
            )}

            <div className="mt-4">
              <Checkbox
                label="Mostrar a taxa mensal equivalente em todas as simulações"
                checked={mostrarTaxa}
                onChange={setMostrarTaxa}
              />
            </div>
            {mostrarTaxa ? (
              <p className="mt-2 font-mono text-xs leading-relaxed text-subtle">
                i = (1 + {formatNumber(cenario.taxaAnual)} ÷ 100)^(1/12) − 1 ={" "}
                {pct(resultado.i * 100, 4)} a.m. · Parcela de juros no 1º mês:{" "}
                {moeda(resultado.saldo * resultado.i)}
              </p>
            ) : null}
          </ToolPanel>

          <ToolPanel>
            <ResultLabel>
              <span className="inline-flex items-center gap-1.5">
                <TrendingUp className="size-3.5" aria-hidden="true" />
                O que costuma surpreender nas simulações
              </span>
            </ResultLabel>
            <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted">
              <li>
                A taxa informada ao ano é nominal; a taxa efetiva de {pct(
                  resultado.i * 100,
                  4,
                )} ao mês é o que incide de fato sobre o saldo devedor.
              </li>
              <li>
                A primeira parcela carrega {moeda(resultado.saldo * resultado.i)} de
                juros sobre quase todo o saldo — a parte que se amortiza é pequena
                no começo e só cresce no fim.
              </li>
              <li>
                Entrada e prazo derrubam o total pago de forma muito mais forte do
                que a taxa: trocar {moeda(resultado.saldo * 0.1)} de entrada costuma
                valer mais que negociar meio ponto de juros.
              </li>
            </ul>
          </ToolPanel>
        </>
      )}
    </div>
  );
}
