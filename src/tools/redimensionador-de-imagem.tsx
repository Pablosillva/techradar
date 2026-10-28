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
import { Download, Scaling, ShieldCheck, Trash2 } from "lucide-react";
import {
  Alert,
  ButtonRow,
  Checkbox,
  Dropzone,
  EmptyState,
  Field,
  NumberInput,
  ResultLabel,
  Select,
  ToolPanel,
  TwoColumns,
} from "@/components/tools/tool-ui";
import { cn, downloadBlob, formatBytes, formatNumber } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Tipos e presets                                                           */
/* -------------------------------------------------------------------------- */

type Formato = "auto" | "image/jpeg" | "image/png" | "image/webp";

type Modo = "px" | "%";

const FORMATOS: Array<{ valor: Formato; nome: string; extensao: string }> = [
  { valor: "auto", nome: "Igual ao arquivo original", extensao: "" },
  { valor: "image/jpeg", nome: "JPEG", extensao: "jpg" },
  { valor: "image/png", nome: "PNG", extensao: "png" },
  { valor: "image/webp", nome: "WebP", extensao: "webp" },
];

const PRESETS: Array<{
  id: string;
  nome: string;
  largura: number;
  altura: number;
  detalhe: string;
}> = [
  { id: "", nome: "Nenhum preset (tamanho livre)", largura: 0, altura: 0, detalhe: "" },
  {
    id: "instagram-post",
    nome: "Instagram — post quadrado (1080×1080)",
    largura: 1080,
    altura: 1080,
    detalhe: "Feed do Instagram em formato quadrado.",
  },
  {
    id: "instagram-stories",
    nome: "Stories e Reels (1080×1920)",
    largura: 1080,
    altura: 1920,
    detalhe: "Formato vertical 9:16 das histórias.",
  },
  {
    id: "youtube-thumb",
    nome: "Thumbnail do YouTube (1280×720)",
    largura: 1280,
    altura: 720,
    detalhe: "Miniatura padrão do YouTube, 16:9.",
  },
  {
    id: "avatar",
    nome: "Avatar / foto de perfil (400×400)",
    largura: 400,
    altura: 400,
    detalhe: "Foto de perfil quadrada usada em redes e apps.",
  },
  {
    id: "favicon",
    nome: "Favicon (64×64)",
    largura: 64,
    altura: 64,
    detalhe: "Ícone pequeno exibido na aba do navegador.",
  },
  {
    id: "capa-facebook",
    nome: "Capa do Facebook (1200×630)",
    largura: 1200,
    altura: 630,
    detalhe: "Capa de página ou perfil, razão ~1,91:1.",
  },
];

type Fonte = {
  origem: CanvasImageSource;
  largura: number;
  altura: number;
  viaImg: boolean;
  fechar: () => void;
};

type Imagem = {
  nome: string;
  tipo: string;
  bytes: number;
  fonte: Fonte;
  urlPreview: string;
};

type Saida = {
  blob: Blob;
  bytes: number;
  largura: number;
  altura: number;
  url: string;
  arquivo: string;
};

/** Maior lado aceito pela maioria dos navegadores em um canvas 2D. */
const LIMITE_LADO = 8192;

/* -------------------------------------------------------------------------- */
/*  Leitura da imagem                                                         */
/* -------------------------------------------------------------------------- */

function ehImagem(arquivo: File): boolean {
  if (arquivo.type.startsWith("image/")) return true;
  return /\.(jpe?g|png|webp|gif|bmp|avif)$/i.test(arquivo.name);
}

/**
 * `imageOrientation: "from-image"` aplica a rotação gravada na tag EXIF, de modo
 * que fotos verticais de celular não saiam deitadas. Navegadores sem a opção
 * caem no elemento `<img>`, que não interpreta EXIF.
 */
async function abrirImagem(arquivo: File): Promise<Fonte> {
  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(arquivo, { imageOrientation: "from-image" });
      return {
        origem: bmp,
        largura: bmp.width,
        altura: bmp.height,
        viaImg: false,
        fechar: () => bmp.close(),
      };
    } catch {
      try {
        const bmp = await createImageBitmap(arquivo);
        return {
          origem: bmp,
          largura: bmp.width,
          altura: bmp.height,
          viaImg: false,
          fechar: () => bmp.close(),
        };
      } catch {
        // cai para o <img>
      }
    }
  }

  const url = URL.createObjectURL(arquivo);
  const img = new Image();
  img.src = url;
  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () =>
        reject(new Error("o arquivo está corrompido ou em um formato não suportado"));
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

/** Ver `detectarWebP` no compressor: mesma técnica, mesmo motivo. */
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

function useSuportaWebP(): boolean {
  return useSyncExternalStore(semInscricao, detectarWebP, () => false);
}

/* -------------------------------------------------------------------------- */
/*  Cálculo das dimensões                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Amostra 32×32 pixels procurando alfa abaixo de 255. Só é usado para escolher o
 * formato automático quando o original não é PNG.
 */
function imagemTemAlfa(fonte: Fonte): boolean {
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

function numero(valor: number | ""): number {
  return typeof valor === "number" && Number.isFinite(valor) ? valor : Number.NaN;
}

function arredondar(valor: number): number {
  return Math.max(1, Math.round(valor));
}

function dimensoesAlvo(
  modo: Modo,
  largura: number | "",
  altura: number | "",
  percentual: number | "",
  manterProporcao: boolean,
  original: { largura: number; altura: number },
): { largura: number; altura: number } {
  if (modo === "%") {
    const fator = numero(percentual);
    const escala = (Number.isFinite(fator) && fator > 0 ? fator : 100) / 100;
    return {
      largura: arredondar(original.largura * escala),
      altura: arredondar(original.altura * escala),
    };
  }

  const l = numero(largura);
  const a = numero(altura);
  const temLargura = Number.isFinite(l) && l > 0;
  const temAltura = Number.isFinite(a) && a > 0;
  const razao = original.altura / original.largura;

  if (temLargura && temAltura && !manterProporcao) {
    return { largura: arredondar(l), altura: arredondar(a) };
  }
  if (temLargura) {
    return { largura: arredondar(l), altura: arredondar(l * razao) };
  }
  if (temAltura) {
    return { largura: arredondar(a / razao), altura: arredondar(a) };
  }
  return { largura: original.largura, altura: original.altura };
}

/* -------------------------------------------------------------------------- */
/*  Componente                                                                */
/* -------------------------------------------------------------------------- */

export default function RedimensionadorDeImagem() {
  const [arquivo, setArquivo] = useState<Imagem | null>(null);
  const [falha, setFalha] = useState<string | null>(null);
  const [saida, setSaida] = useState<Saida | null>(null);
  const [processando, setProcessando] = useState(false);

  const [modo, setModo] = useState<Modo>("px");
  const [preset, setPreset] = useState("");
  const [largura, setLargura] = useState<number | "">("");
  const [altura, setAltura] = useState<number | "">("");
  const [percentual, setPercentual] = useState<number | "">(50);
  const [manterProporcao, setManterProporcao] = useState(true);
  const [permitirAmpliar, setPermitirAmpliar] = useState(false);
  const [formato, setFormato] = useState<Formato>("auto");

  const webpSuportado = useSuportaWebP();

  const imagemRef = useRef<Imagem | null>(null);
  const saidaRef = useRef<Saida | null>(null);

  useEffect(() => {
    imagemRef.current = arquivo;
  }, [arquivo]);

  useEffect(() => {
    saidaRef.current = saida;
  }, [saida]);

  useEffect(() => {
    // Refs lidos no cleanup: no setup a lista ainda está vazia.
    return () => {
      const atual = imagemRef.current;
      const gerada = saidaRef.current;
      if (atual) {
        atual.fonte.fechar();
        URL.revokeObjectURL(atual.urlPreview);
      }
      if (gerada) URL.revokeObjectURL(gerada.url);
    };
  }, []);

  function limpar() {
    const atual = imagemRef.current;
    const gerada = saidaRef.current;
    if (atual) {
      atual.fonte.fechar();
      URL.revokeObjectURL(atual.urlPreview);
    }
    if (gerada) URL.revokeObjectURL(gerada.url);
    setArquivo(null);
    setSaida(null);
    setFalha(null);
    setPreset("");
    setLargura("");
    setAltura("");
  }

  async function receber(lista: File[]) {
    const escolhido = lista[0];
    if (!escolhido) return;
    setFalha(null);

    if (!ehImagem(escolhido)) {
      setFalha(`“${escolhido.name}” não é uma imagem.`);
      return;
    }
    if (escolhido.size === 0) {
      setFalha(`“${escolhido.name}” está vazio.`);
      return;
    }

    const anterior = imagemRef.current;
    if (anterior) {
      anterior.fonte.fechar();
      URL.revokeObjectURL(anterior.urlPreview);
    }
    const anteriorSaida = saidaRef.current;
    if (anteriorSaida) URL.revokeObjectURL(anteriorSaida.url);
    setSaida(null);

    try {
      const fonte = await abrirImagem(escolhido);
      const nova: Imagem = {
        nome: escolhido.name,
        tipo: escolhido.type,
        bytes: escolhido.size,
        fonte,
        urlPreview: URL.createObjectURL(escolhido),
      };
      setArquivo(nova);
      setPreset("");
      setLargura(fonte.largura);
      setAltura(fonte.altura);
      setPercentual(100);
    } catch (erro) {
      setArquivo(null);
      setFalha(
        `“${escolhido.name}” não pôde ser lida: ${
          erro instanceof Error ? erro.message : "erro desconhecido"
        }.`,
      );
    }
  }

  function aplicarPreset(id: string) {
    setPreset(id);
    const alvo = PRESETS.find((p) => p.id === id);
    if (!alvo || alvo.largura === 0) return;
    setModo("px");
    setLargura(alvo.largura);
    setAltura(alvo.altura);
    // Um preset é um alvo fixo: manter a proporção aqui quebraria a razão dele.
    setManterProporcao(false);
  }

  function alterarLargura(valor: number | "") {
    setPreset("");
    setLargura(valor);
    if (!manterProporcao || !arquivo) return;
    const l = numero(valor);
    if (!Number.isFinite(l) || l <= 0) return;
    setAltura(arredondar((l * arquivo.fonte.altura) / arquivo.fonte.largura));
  }

  function alterarAltura(valor: number | "") {
    setPreset("");
    setAltura(valor);
    if (!manterProporcao || !arquivo) return;
    const a = numero(valor);
    if (!Number.isFinite(a) || a <= 0) return;
    setLargura(arredondar((a * arquivo.fonte.largura) / arquivo.fonte.altura));
  }

  /* ---------------------------------------------------------------------- */
  /*  Dimensões e redimensionamento                                         */
  /* ---------------------------------------------------------------------- */

  const alvo = useMemo(() => {
    if (!arquivo) return null;
    return dimensoesAlvo(modo, largura, altura, percentual, manterProporcao, {
      largura: arquivo.fonte.largura,
      altura: arquivo.fonte.altura,
    });
  }, [arquivo, modo, percentual, largura, altura, manterProporcao]);

  /** `null` enquanto não há imagem carregada — evita cumprir o alvo no escuro. */
  const precisaAmpliar = useMemo(() => {
    if (!arquivo || !alvo) return null;
    return (
      Math.max(alvo.largura, alvo.altura) >
      Math.max(arquivo.fonte.largura, arquivo.fonte.altura)
    );
  }, [arquivo, alvo]);

  const efetiva = useMemo(() => {
    if (!arquivo || !alvo) return null;
    if (!precisaAmpliar || permitirAmpliar) return alvo;
    // Ampliação bloqueada: o export respeita o tamanho original em cada eixo.
    return {
      largura: Math.min(alvo.largura, arquivo.fonte.largura),
      altura: Math.min(alvo.altura, arquivo.fonte.altura),
    };
  }, [alvo, arquivo, precisaAmpliar, permitirAmpliar]);

  useEffect(() => {
    let cancelado = false;

    async function gerar() {
      setProcessando(true);
      if (!arquivo || !efetiva) {
        setProcessando(false);
        return;
      }

      let largura = efetiva.largura;
      let altura = efetiva.altura;
      const maior = Math.max(largura, altura);
      if (maior > LIMITE_LADO) {
        const fator = LIMITE_LADO / maior;
        largura = arredondar(largura * fator);
        altura = arredondar(altura * fator);
      }

      const mime =
        formato === "auto"
          ? arquivo.tipo === "image/png"
            ? "image/png"
            : imagemTemAlfa(arquivo.fonte)
              ? "image/png"
              : "image/jpeg"
          : formato;

      const canvas = document.createElement("canvas");
      canvas.width = largura;
      canvas.height = altura;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setProcessando(false);
        setFalha("O navegador não liberou um contexto 2D para desenhar a imagem.");
        return;
      }
      if (mime === "image/jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, largura, altura);
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(arquivo.fonte.origem, 0, 0, largura, altura);

      const blob = await new Promise<Blob | null>((resolve) => {
        try {
          canvas.toBlob((b) => resolve(b), mime, 0.92);
        } catch {
          resolve(null);
        }
      });
      canvas.width = 0;
      canvas.height = 0;

      if (cancelado) return;

      if (!blob) {
        setSaida(null);
        setProcessando(false);
        setFalha(
          "O navegador não conseguiu gerar o arquivo redimensionado (toBlob devolveu vazio). Tente outro formato de saída.",
        );
        return;
      }

      const extensao =
        mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
      const base = arquivo.nome.replace(/\.[^.]+$/, "");
      const anteriorSaida = saidaRef.current;
      if (anteriorSaida) URL.revokeObjectURL(anteriorSaida.url);

      setSaida({
        blob,
        bytes: blob.size,
        largura,
        altura,
        url: URL.createObjectURL(blob),
        arquivo: `${base}-${largura}x${altura}.${extensao}`,
      });
      setFalha(null);
      setProcessando(false);
    }

    void gerar();
    return () => {
      cancelado = true;
    };
  }, [arquivo, efetiva, formato]);

  return (
    <div className="space-y-6">
      <ToolPanel>
        <div className="space-y-5">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-fg">
              <Scaling className="size-5 text-brand" aria-hidden="true" />
              Redimensionador de Imagem
            </h2>
            <p className="mt-1 text-sm text-muted">
              Defina o tamanho em pixels ou por porcentagem, com presets prontos
              para as redes sociais.
            </p>
          </div>

          <Alert tone="info">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
              O processamento é 100% local e a imagem é redesenhada em um canvas,
              o que remove os metadados EXIF (câmera, GPS e data de disparo) do
              arquivo exportado.
            </span>
          </Alert>

          <Dropzone
            accept="image/*"
            multiple={false}
            onFiles={(lista) => void receber(lista)}
          />

          {falha ? <Alert tone="error">{falha}</Alert> : null}
        </div>
      </ToolPanel>

      {!arquivo || !alvo || !efetiva ? (
        <ToolPanel>
          <EmptyState>
            Envie uma imagem para ver as dimensões originais e começar a
            redimensionar.
          </EmptyState>
        </ToolPanel>
      ) : (
        <>
          <ToolPanel>
            <div className="space-y-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="truncate text-sm font-bold text-fg">
                  {arquivo.nome}
                </h3>
                <span className="font-mono text-xs text-subtle tabular-nums">
                  {arquivo.fonte.largura}×{arquivo.fonte.altura} px ·{" "}
                  {formatBytes(arquivo.bytes)}
                </span>
              </div>

              {!arquivo.fonte.viaImg ? null : (
                <Alert tone="warning">
                  Este navegador não oferece createImageBitmap com leitura de
                  orientação EXIF. Se a foto saiu deitada no lugar de em pé, o
                  limite vem do próprio navegador.
                </Alert>
              )}

              <TwoColumns>
                <Field label="Preset" hint="Preenche largura e altura de uma vez.">
                  <Select
                    value={preset}
                    onChange={(e) => aplicarPreset(e.target.value)}
                  >
                    {PRESETS.map((p) => (
                      <option key={p.id || "livre"} value={p.id}>
                        {p.nome}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Modo de entrada">
                  <Select
                    value={modo}
                    onChange={(e) => setModo(e.target.value as Modo)}
                  >
                    <option value="px">Dimensões em pixels</option>
                    <option value="%">Porcentagem do tamanho original</option>
                  </Select>
                </Field>
              </TwoColumns>

              {PRESETS.find((p) => p.id === preset)?.detalhe ? (
                <p className="text-xs text-subtle">
                  {PRESETS.find((p) => p.id === preset)?.detalhe}
                </p>
              ) : null}

              {modo === "px" ? (
                <TwoColumns>
                  <Field label="Largura (px)">
                    <NumberInput
                      value={largura}
                      onValueChange={alterarLargura}
                      placeholder={String(arquivo.fonte.largura)}
                    />
                  </Field>

                  <Field label="Altura (px)">
                    <NumberInput
                      value={altura}
                      onValueChange={alterarAltura}
                      placeholder={String(arquivo.fonte.altura)}
                    />
                  </Field>
                </TwoColumns>
              ) : (
                <Field
                  label="Porcentagem (%)"
                  hint={`Equivale a ${alvo.largura}×${alvo.altura} px.`}
                >
                  <NumberInput
                    value={percentual}
                    onValueChange={setPercentual}
                    placeholder="50"
                  />
                </Field>
              )}

              <div className="space-y-3">
                <Checkbox
                  label="Manter proporção do arquivo original"
                  checked={manterProporcao}
                  onChange={setManterProporcao}
                />
                <Checkbox
                  label="Permitir ampliar (a imagem perde detalhe real ao aumentar)"
                  checked={permitirAmpliar}
                  onChange={setPermitirAmpliar}
                />
              </div>

              <Field
                label="Formato de saída"
                hint="PNG mantém a transparência; JPEG serve para fotos e pesa menos."
              >
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
            </div>
          </ToolPanel>

          <TwoColumns>
            <ToolPanel>
              <ResultLabel>Antes</ResultLabel>
              <p className="font-mono text-2xl font-bold tabular-nums text-fg">
                {arquivo.fonte.largura}×{arquivo.fonte.altura}
              </p>
              <p className="mt-1 font-mono text-xs text-subtle tabular-nums">
                {formatBytes(arquivo.bytes)}
              </p>
              <img
                src={arquivo.urlPreview}
                alt={`Imagem original ${arquivo.nome}`}
                className="mt-3 max-h-56 w-full rounded-lg border border-line bg-surface-2 object-contain"
              />
            </ToolPanel>

            <ToolPanel>
              <ResultLabel>Depois</ResultLabel>
              <p className="font-mono text-2xl font-bold tabular-nums text-brand">
                {efetiva.largura}×{efetiva.altura}
              </p>
              <p className="mt-1 font-mono text-xs text-subtle tabular-nums">
                {saida
                  ? `${formatBytes(saida.bytes)}${
                      saida.bytes < arquivo.bytes
                        ? ` (${formatNumber((1 - saida.bytes / arquivo.bytes) * 100, 1)}% menor)`
                        : saida.bytes > arquivo.bytes
                          ? ` (${formatNumber((saida.bytes / arquivo.bytes - 1) * 100, 1)}% maior)`
                          : ""
                    }`
                  : processando
                    ? "gerando…"
                    : "—"}
              </p>
              {saida ? (
                <img
                  src={saida.url}
                  alt={`Imagem redimensionada de ${arquivo.nome}`}
                  className="mt-3 max-h-56 w-full rounded-lg border border-line bg-surface-2 object-contain"
                />
              ) : (
                <div className="mt-3 grid max-h-56 w-full place-items-center rounded-lg border border-dashed border-line px-3 text-xs text-subtle">
                  {processando ? "Gerando…" : "Sem saída"}
                </div>
              )}
            </ToolPanel>
          </TwoColumns>

          {precisaAmpliar && !permitirAmpliar ? (
            <Alert tone="warning">
              Você pediu {alvo.largura}×{alvo.altura} px, maior que o original de{" "}
              {arquivo.fonte.largura}×{arquivo.fonte.altura} px. Como a ampliação
              está desativada, o arquivo será exportado em{" "}
              {efetiva.largura}×{efetiva.altura} px. Ative “Permitir ampliar” se
              quiser forçar o tamanho pedido, sabendo que o resultado será
              interpolado.
            </Alert>
          ) : null}

          {precisaAmpliar && permitirAmpliar ? (
            <Alert tone="info">
              Ampliação de {arquivo.fonte.largura}×{arquivo.fonte.altura} para{" "}
              {alvo.largura}×{alvo.altura} px: nenhum pixel novo é criado, o
              navegador apenas interpola os existentes e o arquivo costuma ficar
              maior.
            </Alert>
          ) : null}

          <ToolPanel>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <ResultLabel>Exportar</ResultLabel>
              <ButtonRow>
                <button
                  type="button"
                  disabled={!saida || processando}
                  onClick={() => {
                    if (saida) downloadBlob(saida.blob, saida.arquivo);
                  }}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-strong",
                    !saida && "pointer-events-none opacity-40",
                  )}
                >
                  <Download className="size-3.5" aria-hidden="true" />
                  Baixar {saida ? saida.arquivo : "imagem"}
                </button>

                <button
                  type="button"
                  onClick={limpar}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs font-semibold text-fg transition-colors hover:border-danger/50"
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                  Trocar de imagem
                </button>
              </ButtonRow>
            </div>
            {saida ? (
              <p className="mt-2 text-xs leading-relaxed text-subtle">
                Exportado em {saida.largura}×{saida.altura} px ·{" "}
                {saida.blob.type.replace("image/", "").toUpperCase()} ·{" "}
                {formatBytes(saida.bytes)}. Os metadados EXIF do arquivo original
                não são carregados para esta nova imagem.
              </p>
            ) : null}
          </ToolPanel>
        </>
      )}
    </div>
  );
}
