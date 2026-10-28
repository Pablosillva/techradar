"use client";

/* As prévias usam `blob:` URLs, que o `next/image` não sabe otimizar: o
   carregador dele só aceita fontes HTTP. O disable fica neste arquivo inteiro
   porque aqui toda imagem é local por definição. */
/* eslint-disable @next/next/no-img-element */

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Download, ImageDown, ShieldCheck, Trash2 } from "lucide-react";
import {
  Alert,
  ButtonRow,
  Checkbox,
  Dropzone,
  EmptyState,
  Field,
  NumberInput,
  RangeField,
  ResultLabel,
  Select,
  ToolPanel,
  TwoColumns,
} from "@/components/tools/tool-ui";
import { cn, downloadBlob, formatBytes, formatNumber } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Tipos                                                                     */
/* -------------------------------------------------------------------------- */

type Formato = "image/jpeg" | "image/png" | "image/webp";

const FORMATOS: Array<{
  valor: Formato;
  nome: string;
  extensao: string;
  nota: string;
}> = [
  {
    valor: "image/jpeg",
    nome: "JPEG",
    extensao: "jpg",
    nota: "Melhor para fotos. Descarta a transparência.",
  },
  {
    valor: "image/png",
    nome: "PNG",
    extensao: "png",
    nota: "Sem perda e preserva transparência, mas ignora a qualidade.",
  },
  {
    valor: "image/webp",
    nome: "WebP",
    extensao: "webp",
    nota: "Melhor custo-benefício na web, com suporte desigual.",
  },
];

/** Acima disso o canvas vira lento e o consumo de memória dispara. */
const LIMITE_PIXELS = 15_000_000;
/** Maior lado que a maioria dos navegadores aceita em um canvas 2D. */
const LIMITE_LADO = 8192;

type Fonte = {
  origem: CanvasImageSource;
  largura: number;
  altura: number;
  /** `true` quando o fallback por `<img>` foi usado (sem suporte a createImageBitmap). */
  viaImg: boolean;
  fechar: () => void;
};

type Item = {
  id: string;
  nome: string;
  bytes: number;
  fonte: Fonte;
  temTransparencia: boolean;
  urlPreview: string;
};

type Saida = {
  id: string;
  blob: Blob;
  bytes: number;
  largura: number;
  altura: number;
  url: string;
  arquivo: string;
};

type Opcoes = {
  qualidade: number;
  formato: Formato;
  larguraMaxima: number;
  permitirAmpliar: boolean;
};

/* -------------------------------------------------------------------------- */
/*  Leitura e análise da imagem                                                */
/* -------------------------------------------------------------------------- */

function ehImagem(arquivo: File): boolean {
  if (arquivo.type.startsWith("image/")) return true;
  // Alguns navegadores entregam `type` vazio; o nome do arquivo ainda salva.
  return /\.(jpe?g|png|webp|gif|bmp|avif)$/i.test(arquivo.name);
}

/**
 * WebP só pode ser detectado escrevendo nele: a API não consulta o suporte.
 * O resultado é memorizado porque a capacidade não muda durante a sessão.
 */
let cacheWebP: boolean | null = null;

function detectarWebP(): boolean {
  if (cacheWebP === null) {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      cacheWebP = canvas.toDataURL("image/webp").startsWith("data:image/webp");
    } catch {
      cacheWebP = false;
    }
  }
  return cacheWebP;
}

const semInscricao = () => () => {};

/**
 * `useSyncExternalStore` em vez de `useState` + efeito: a detecção depende do
 * DOM, que não existe durante o SSR. Assim o servidor e a primeira renderização
 * de hidratação devolvem `false`, e o valor real chega na renderização seguinte
 * sem `setState` dentro de efeito.
 */
function useSuportaWebP(): boolean {
  return useSyncExternalStore(semInscricao, detectarWebP, () => false);
}

async function abrirImagem(blob: Blob): Promise<Fonte> {
  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(blob, { imageOrientation: "from-image" });
      return {
        origem: bmp,
        largura: bmp.width,
        altura: bmp.height,
        viaImg: false,
        fechar: () => bmp.close(),
      };
    } catch {
      // Navegadores antigos não conhecem `imageOrientation`: tenta sem a opção.
    }
    try {
      const bmp = await createImageBitmap(blob);
      return {
        origem: bmp,
        largura: bmp.width,
        altura: bmp.height,
        viaImg: false,
        fechar: () => bmp.close(),
      };
    } catch {
      // Sem decodificação por bitmap: cai para o elemento <img>.
    }
  }

  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.src = url;
  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () =>
        reject(new Error("o arquivo está corrompido ou em um formato que o navegador não decodifica"));
    });
  } catch (erro) {
    URL.revokeObjectURL(url);
    throw erro;
  }
  return {
    origem: img,
    largura: img.naturalWidth,
    altura: img.naturalHeight,
    viaImg: true,
    fechar: () => URL.revokeObjectURL(url),
  };
}

/**
 * Amostra 32×32 pixels procurando alfa menor que 255. Barato o bastante para
 * rodar na hora e suficiente para saber se a imagem "tem" transparência.
 */
function possuiTransparencia(fonte: Fonte): boolean {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return false;
    ctx.drawImage(fonte.origem, 0, 0, 32, 32);
    const dados = ctx.getImageData(0, 0, 32, 32).data;
    for (let i = 3; i < dados.length; i += 4) {
      if (dados[i] < 250) return true;
    }
    return false;
  } catch {
    return false;
  }
}

/* -------------------------------------------------------------------------- */
/*  Compressão                                                                */
/* -------------------------------------------------------------------------- */

function calcularEscala(
  larguraOriginal: number,
  larguraMaxima: number,
  permitirAmpliar: boolean,
): number {
  if (larguraOriginal <= 0) return 1;
  if (!Number.isFinite(larguraMaxima) || larguraMaxima <= 0) return 1;
  if (larguraOriginal > larguraMaxima) return larguraMaxima / larguraOriginal;
  return permitirAmpliar ? larguraMaxima / larguraOriginal : 1;
}

async function comprimir(
  item: Item,
  opcoes: Opcoes,
  extensao: string,
): Promise<Saida> {
  let escala = calcularEscala(
    item.fonte.largura,
    opcoes.larguraMaxima,
    opcoes.permitirAmpliar,
  );

  let largura = Math.max(1, Math.round(item.fonte.largura * escala));
  let altura = Math.max(1, Math.round(item.fonte.altura * escala));

  const maiorLado = Math.max(largura, altura);
  if (maiorLado > LIMITE_LADO) {
    escala *= LIMITE_LADO / maiorLado;
    largura = Math.max(1, Math.round(largura * escala));
    altura = Math.max(1, Math.round(altura * escala));
  }

  const canvas = document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("o navegador não liberou um contexto 2D para desenhar a imagem");
  }

  if (opcoes.formato === "image/jpeg") {
    // JPEG não tem canal alfa: sem um fundo explícito, o transparente vira preto.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, largura, altura);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(item.fonte.origem, 0, 0, largura, altura);

  const qualidade =
    opcoes.formato === "image/png" ? undefined : opcoes.qualidade / 100;

  const blob = await new Promise<Blob | null>((resolve) => {
    try {
      canvas.toBlob((resultado) => resolve(resultado), opcoes.formato, qualidade);
    } catch {
      resolve(null);
    }
  });

  // Safari e alguns WebKit mobile devolvem `null` em vez de lançar erro.
  canvas.width = 0;
  canvas.height = 0;

  if (!blob) {
    throw new Error("o navegador não conseguiu gerar o arquivo comprimido (toBlob devolveu vazio)");
  }

  const base = item.nome.replace(/\.[^.]+$/, "");
  return {
    id: item.id,
    blob,
    bytes: blob.size,
    largura,
    altura,
    url: URL.createObjectURL(blob),
    arquivo: `${base}-comprimido.${extensao}`,
  };
}

/* -------------------------------------------------------------------------- */
/*  Componente                                                                */
/* -------------------------------------------------------------------------- */

export default function CompressorDeImagem() {
  const [itens, setItens] = useState<Item[]>([]);
  const [resultados, setResultados] = useState<Saida[]>([]);
  const [processando, setProcessando] = useState(false);
  const [rejeicoes, setRejeicoes] = useState<string[]>([]);
  const [erros, setErros] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(false);

  const [qualidade, setQualidade] = useState(75);
  const [formato, setFormato] = useState<Formato>("image/jpeg");
  const [larguraMaxima, setLarguraMaxima] = useState<number | "">(0);
  const [permitirAmpliar, setPermitirAmpliar] = useState(false);

  const webpSuportado = useSuportaWebP();

  const itensRef = useRef<Item[]>([]);
  const resultadosRef = useRef<Saida[]>([]);
  const contador = useRef(0);

  useEffect(() => {
    itensRef.current = itens;
  }, [itens]);

  useEffect(() => {
    resultadosRef.current = resultados;
  }, [resultados]);

  useEffect(() => {
    // Os refs são lidos dentro do cleanup, e não no setup: no momento em que o
    // efeito roda a lista ainda está vazia, e os refs só recebem valor depois.
    return () => {
      for (const item of itensRef.current) {
        item.fonte.fechar();
        URL.revokeObjectURL(item.urlPreview);
      }
      for (const resultado of resultadosRef.current) {
        URL.revokeObjectURL(resultado.url);
      }
    };
  }, []);

  /* ---------------------------------------------------------------------- */
  /*  Carga dos arquivos                                                    */
  /* ---------------------------------------------------------------------- */

  async function receber(arquivos: File[]) {
    setCarregando(true);
    const novos: Item[] = [];
    const rejeitados: string[] = [];

    for (const arquivo of arquivos) {
      if (!ehImagem(arquivo)) {
        rejeitados.push(`“${arquivo.name}” não é uma imagem.`);
        continue;
      }
      if (arquivo.size === 0) {
        rejeitados.push(`“${arquivo.name}” está vazio.`);
        continue;
      }
      try {
        const fonte = await abrirImagem(arquivo);
        novos.push({
          id: `img-${contador.current++}`,
          nome: arquivo.name,
          bytes: arquivo.size,
          fonte,
          temTransparencia: possuiTransparencia(fonte),
          urlPreview: URL.createObjectURL(arquivo),
        });
      } catch (erro) {
        rejeitados.push(
          `“${arquivo.name}” não pôde ser lida: ${
            erro instanceof Error ? erro.message : "erro desconhecido"
          }.`,
        );
      }
    }

    setRejeicoes(rejeitados);
    setErros([]);
    setItens((atuais) => [...atuais, ...novos]);
    setCarregando(false);
  }

  function limpar() {
    for (const item of itensRef.current) {
      item.fonte.fechar();
      URL.revokeObjectURL(item.urlPreview);
    }
    for (const resultado of resultadosRef.current) {
      URL.revokeObjectURL(resultado.url);
    }
    setItens([]);
    setResultados([]);
    setRejeicoes([]);
    setErros([]);
  }

  /* ---------------------------------------------------------------------- */
  /*  (Re)compressão a cada mudança de configuração                         */
  /* ---------------------------------------------------------------------- */

  const extensao = useMemo(
    () => FORMATOS.find((f) => f.valor === formato)?.extensao ?? "jpg",
    [formato],
  );

  useEffect(() => {
    let cancelado = false;

    async function rodar() {
      if (itens.length === 0) {
        setResultados([]);
        setProcessando(false);
        return;
      }

      setProcessando(true);
      const opcoes: Opcoes = {
        qualidade,
        formato,
        larguraMaxima:
          typeof larguraMaxima === "number" && Number.isFinite(larguraMaxima)
            ? larguraMaxima
            : 0,
        permitirAmpliar,
      };

      const saidas: Saida[] = [];
      const erros: string[] = [];

      for (const item of itens) {
        if (cancelado) break;
        try {
          saidas.push(await comprimir(item, opcoes, extensao));
        } catch (erro) {
          erros.push(
            `“${item.nome}” não foi comprimida: ${
              erro instanceof Error ? erro.message : "erro desconhecido"
            }.`,
          );
        }
      }

      if (cancelado) {
        for (const saida of saidas) URL.revokeObjectURL(saida.url);
        return;
      }

      for (const anterior of resultadosRef.current) {
        URL.revokeObjectURL(anterior.url);
      }
      setResultados(saidas);
      setErros(erros);
      setProcessando(false);
    }

    void rodar();
    return () => {
      cancelado = true;
    };
  }, [itens, qualidade, formato, larguraMaxima, permitirAmpliar, extensao]);

  /* ---------------------------------------------------------------------- */
  /*  Totais                                                                */
  /* ---------------------------------------------------------------------- */

  const totalAntes = useMemo(
    () => itens.reduce((soma, item) => soma + item.bytes, 0),
    [itens],
  );
  const totalDepois = useMemo(
    () => resultados.reduce((soma, saida) => soma + saida.bytes, 0),
    [resultados],
  );
  const economia =
    totalAntes > 0 && totalDepois > 0 ? (1 - totalDepois / totalAntes) * 100 : 0;

  const descricaoFormato = FORMATOS.find((f) => f.valor === formato)?.nota ?? "";

  return (
    <div className="space-y-6">
      <ToolPanel>
        <div className="space-y-5">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-fg">
              <ImageDown className="size-5 text-brand" aria-hidden="true" />
              Compressor de Imagem
            </h2>
            <p className="mt-1 text-sm text-muted">
              Reencode a imagem no seu próprio navegador com a Canvas API.
            </p>
          </div>

          <Alert tone="info">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
              Tudo acontece localmente: nenhuma imagem é enviada para servidor
              nenhum. Você pode até desligar a internet depois que a página
              carregar.
            </span>
          </Alert>

          <Dropzone
            accept="image/*"
            multiple
            onFiles={(arquivos) => void receber(arquivos)}
          >
            <span className="text-sm font-semibold text-fg">
              Arraste uma ou várias imagens, ou clique para escolher
            </span>
            <span className="text-xs text-subtle">
              JPEG, PNG e WebP. Selecionar de novo adiciona à lista atual.
            </span>
          </Dropzone>

          {carregando ? <Alert tone="info">Lendo os arquivos…</Alert> : null}

          {[...rejeicoes, ...erros].map((falha) => (
            <Alert key={falha} tone="error">
              {falha}
            </Alert>
          ))}

          {itens.length > 0 ? (
            <TwoColumns>
              <div className="space-y-4">
                {/* PNG ignora a qualidade: o controle fica inerte e a nota abaixo explica. */}
                <div
                  className={
                    formato === "image/png" ? "pointer-events-none opacity-50" : undefined
                  }
                >
                  <RangeField
                    label="Qualidade"
                    value={qualidade}
                    min={10}
                    max={100}
                    suffix="%"
                    onChange={setQualidade}
                  />
                </div>

                <Field
                  label="Largura máxima (px)"
                  hint="Deixe 0 para manter o tamanho original. A altura é ajustada sozinha."
                >
                  <NumberInput
                    value={larguraMaxima}
                    onValueChange={setLarguraMaxima}
                    placeholder="0"
                  />
                </Field>

                <Checkbox
                  label="Permitir ampliar até a largura máxima"
                  checked={permitirAmpliar}
                  onChange={setPermitirAmpliar}
                />
              </div>

              <div className="space-y-4">
                <Field label="Formato de saída" hint={descricaoFormato}>
                  <Select
                    value={formato}
                    onChange={(e) => setFormato(e.target.value as Formato)}
                  >
                    {FORMATOS.map((f) => (
                      <option
                        key={f.valor}
                        value={f.valor}
                        disabled={f.valor === "image/webp" && !webpSuportado}
                      >
                        {f.nome}
                        {f.valor === "image/webp" && !webpSuportado
                          ? " (não suportado neste navegador)"
                          : ""}
                      </option>
                    ))}
                  </Select>
                </Field>

                <ButtonRow>
                  <button
                    type="button"
                    onClick={limpar}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs font-semibold text-fg transition-colors hover:border-danger/50"
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                    Limpar tudo
                  </button>
                </ButtonRow>

                {formato === "image/png" ? (
                  <Alert tone="info">
                    PNG é um formato sem perda: a compressão do navegador não usa
                    o controle de qualidade. Para reduzir o peso de uma foto,
                    escolha JPEG ou WebP.
                  </Alert>
                ) : null}

                {itens.some((item) => item.temTransparencia) && formato === "image/jpeg" ? (
                  <Alert tone="warning">
                    Uma ou mais imagens têm transparência. JPEG não guarda canal
                    alfa: as áreas transparentes serão preenchidas com branco
                    neste processamento.
                  </Alert>
                ) : null}
              </div>
            </TwoColumns>
          ) : null}
        </div>
      </ToolPanel>

      {itens.length === 0 ? (
        <ToolPanel>
          <EmptyState>
            Nenhuma imagem carregada ainda. Escolha um arquivo para ver o
            antes e o depois.
          </EmptyState>
        </ToolPanel>
      ) : (
        <>
          <ToolPanel>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <ResultLabel>
                Resumo ({itens.length}{" "}
                {itens.length === 1 ? "imagem" : "imagens"})
              </ResultLabel>
              <span
                className={cn(
                  "font-mono text-sm font-bold tabular-nums",
                  economia > 0 ? "text-success" : "text-warning",
                )}
              >
                {formatBytes(totalAntes)} → {formatBytes(totalDepois)}
                {economia !== 0 ? ` (${formatNumber(economia, 1)}% menor)` : ""}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-subtle">
              Entre as imagens carregadas e os arquivos gerados com a
              configuração atual.
            </p>
          </ToolPanel>

          <div className="space-y-4">
            {itens.map((item) => {
              const saida = resultados.find((r) => r.id === item.id);
              const pixels = item.fonte.largura * item.fonte.altura;
              const grande = pixels > LIMITE_PIXELS;
              const reducao = saida ? (1 - saida.bytes / item.bytes) * 100 : 0;
              const piorou = saida !== undefined && saida.bytes > item.bytes;

              return (
                <ToolPanel key={item.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="truncate text-sm font-bold text-fg">
                      {item.nome}
                    </h3>
                    <span className="font-mono text-xs text-subtle tabular-nums">
                      {item.fonte.largura}×{item.fonte.altura} px ·{" "}
                      {formatNumber(pixels / 1_000_000, 2)} MP
                    </span>
                  </div>

                  {grande ? (
                    <div className="mt-3">
                      <Alert tone="warning">
                        Imagem acima de 15 megapixels: o processamento pode levar
                        alguns segundos e usar bastante memória. Se o navegador
                        travar, reduza a largura máxima.
                      </Alert>
                    </div>
                  ) : null}

                  {!item.fonte.viaImg ? null : (
                    <p className="mt-2 text-xs text-subtle">
                      Esta imagem foi decodificada por um elemento img porque
                      createImageBitmap não está disponível neste navegador.
                    </p>
                  )}

                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <figure>
                      <figcaption className="mb-1.5 text-xs font-semibold text-muted">
                        Original — {formatBytes(item.bytes)}
                      </figcaption>
                      <img
                        src={item.urlPreview}
                        alt={`Pré-visualização da imagem original ${item.nome}`}
                        className="max-h-64 w-full rounded-lg border border-line bg-surface-2 object-contain"
                      />
                    </figure>

                    <figure>
                      <figcaption className="mb-1.5 text-xs font-semibold text-muted">
                        Comprimida —{" "}
                        {saida
                          ? `${formatBytes(saida.bytes)}${
                              reducao > 0
                                ? ` (${formatNumber(reducao, 1)}% menor)`
                                : " (ficou maior)"
                            }`
                          : processando
                            ? "processando…"
                            : "indisponível"}
                      </figcaption>
                      {saida ? (
                        <img
                          src={saida.url}
                          alt={`Pré-visualização da imagem comprimida de ${item.nome}`}
                          className="max-h-64 w-full rounded-lg border border-line bg-surface-2 object-contain"
                        />
                      ) : (
                        <div className="grid max-h-64 w-full place-items-center rounded-lg border border-dashed border-line px-3 text-xs text-subtle">
                          {processando ? "Gerando…" : "Sem resultado"}
                        </div>
                      )}
                    </figure>
                  </div>

                  {saida ? (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <span className="font-mono text-xs text-muted tabular-nums">
                        {saida.largura}×{saida.altura} px ·{" "}
                        {saida.blob.type.replace("image/", "").toUpperCase()}
                      </span>
                      <button
                        type="button"
                        onClick={() => downloadBlob(saida.blob, saida.arquivo)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-strong"
                      >
                        <Download className="size-3.5" aria-hidden="true" />
                        Baixar {saida.arquivo}
                      </button>
                    </div>
                  ) : null}

                  {saida && piorou ? (
                    <div className="mt-3">
                      <Alert tone="warning">
                        Esta configuração deixou o arquivo maior que o original
                        ({formatBytes(item.bytes)} → {formatBytes(saida!.bytes)}).
                        Formatos sem perda ou qualidades muito altas quase sempre
                        aumentam o peso — tente JPEG ou WebP.
                      </Alert>
                    </div>
                  ) : null}
                </ToolPanel>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
