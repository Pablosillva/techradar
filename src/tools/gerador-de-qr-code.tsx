"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CircleAlert, Dices, FileCode, Image as ImageIcon } from "lucide-react";
// @ts-expect-error `qrcode` v1.5.4 ships no TypeScript declarations; the
// surface we rely on is typed right below the import.
import QRCodeImport from "qrcode";
import {
  Alert,
  ButtonRow,
  CopyButton,
  EmptyState,
  Field,
  RangeField,
  ResultLabel,
  Select,
  TextArea,
  TextInput,
  ToolPanel,
  TwoColumns,
} from "@/components/tools/tool-ui";
import { cn, downloadBlob } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  qrcode shim (the package ships without TypeScript declarations)            */
/* -------------------------------------------------------------------------- */

type EcLevel = "L" | "M" | "Q" | "H";

interface RenderOptions {
  errorCorrectionLevel: EcLevel;
  margin: number;
  width: number;
  color: { dark: string; light: string };
}

interface QRCodeApi {
  toCanvas(canvas: HTMLCanvasElement, text: string, opts: RenderOptions): Promise<void>;
  toDataURL(text: string, opts: RenderOptions): Promise<string>;
  toString(text: string, opts: RenderOptions & { type: "svg" }): Promise<string>;
}

const QRCode = QRCodeImport as QRCodeApi;

/** Upper bound of a QR payload in byte mode (version 40, lowest EC level). */
const MAX_PAYLOAD_BYTES = 2953;

/* -------------------------------------------------------------------------- */
/*  Payload builders                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Escapes the structural characters of a WIFI payload. Without this a password
 * containing `;` silently truncates every field that follows it.
 */
function escapeWifi(value: string): string {
  return value.replace(/([\\;,:"])/g, "\\$1");
}

/** Escapes the separators used by vCard property values (RFC 2426, §3.4). */
function escapeVCard(value: string): string {
  return value.replace(/([\\;,])/g, "\\$1").replace(/\r?\n/g, "\\n");
}

type ContentType = "url" | "text" | "vcard" | "wifi" | "email" | "tel";

interface Contact {
  firstName: string;
  lastName: string;
  org: string;
  phone: string;
  email: string;
}

/** Everything produced by the last successful render, tagged with its input. */
interface Rendered {
  payload: string;
  dataUrl: string;
  svg: string;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function GeradorDeQrCode() {
  const [type, setType] = useState<ContentType>("url");
  const [url, setUrl] = useState("https://exemplo.com.br");
  const [text, setText] = useState("");
  const [contact, setContact] = useState<Contact>({
    firstName: "",
    lastName: "",
    org: "",
    phone: "",
    email: "",
  });
  const [ssid, setSsid] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [wifiAuth, setWifiAuth] = useState<"WPA" | "WEP" | "nopass">("WPA");
  const [emailAddress, setEmailAddress] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [dark, setDark] = useState("#0d1729");
  const [light, setLight] = useState("#ffffff");
  const [size, setSize] = useState(320);
  const [margin, setMargin] = useState(4);
  const [ec, setEc] = useState<EcLevel>("M");

  const [rendered, setRendered] = useState<Rendered | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [canvasFailed, setCanvasFailed] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Monotonic token so a slow render that resolves after a newer one is dropped.
  const runRef = useRef(0);

  const payload = useMemo(() => {
    switch (type) {
      case "url":
        return url.trim();
      case "text":
        return text;
      case "tel":
        return phoneNumber.trim() ? `tel:${phoneNumber.trim()}` : "";
      case "email": {
        const to = emailAddress.trim();
        if (!to) return "";
        const params = new URLSearchParams();
        if (emailSubject.trim()) params.set("subject", emailSubject.trim());
        if (emailBody.trim()) params.set("body", emailBody.trim());
        const query = params.toString();
        return query ? `mailto:${to}?${query}` : `mailto:${to}`;
      }
      case "wifi": {
        const network = ssid.trim();
        if (!network) return "";
        // WIFI:T:WPA;S:<ssid>;P:<password>;H:true;;
        const parts = [`T:${wifiAuth}`, `S:${escapeWifi(network)}`];
        if (wifiAuth !== "nopass") parts.push(`P:${escapeWifi(wifiPassword)}`);
        parts.push("H:true");
        return `WIFI:${parts.join(";")};;`;
      }
      case "vcard": {
        const { firstName, lastName, org, phone, email } = contact;
        if (
          !firstName.trim() &&
          !lastName.trim() &&
          !org.trim() &&
          !email.trim() &&
          !phone.trim()
        ) {
          return "";
        }
        const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
        const lines = [
          "BEGIN:VCARD",
          "VERSION:3.0",
          `N:${escapeVCard(lastName.trim())};${escapeVCard(firstName.trim())};;;`,
          `FN:${escapeVCard(fullName)}`,
        ];
        if (org.trim()) lines.push(`ORG:${escapeVCard(org.trim())}`);
        if (phone.trim()) lines.push(`TEL;TYPE=CELL:${escapeVCard(phone.trim())}`);
        if (email.trim()) lines.push(`EMAIL;TYPE=INTERNET:${escapeVCard(email.trim())}`);
        lines.push("END:VCARD");
        return lines.join("\n");
      }
      default:
        return "";
    }
  }, [
    contact,
    emailAddress,
    emailBody,
    emailSubject,
    phoneNumber,
    ssid,
    text,
    type,
    url,
    wifiAuth,
    wifiPassword,
  ]);

  const options = useMemo<RenderOptions>(
    () => ({ errorCorrectionLevel: ec, margin, width: size, color: { dark, light } }),
    [dark, ec, light, margin, size],
  );

  const payloadBytes = useMemo(
    () => (payload ? new TextEncoder().encode(payload).length : 0),
    [payload],
  );
  const tooLarge = payloadBytes > MAX_PAYLOAD_BYTES;
  const hasContent = payload.length > 0 && !tooLarge;
  // Derived, not stored: an oversized payload is a pure function of `payload`.
  const sizeError = tooLarge
    ? `Conteúdo de ${payloadBytes} bytes excede o limite de ${MAX_PAYLOAD_BYTES} bytes de um QR Code. Reduza o texto.`
    : null;
  const errorMessage = sizeError ?? failure;

  // Redraw on every payload / option change. Exports are tagged with the
  // payload that produced them so a stale PNG can never be downloaded.
  useEffect(() => {
    const current = runRef.current + 1;
    runRef.current = current;
    if (!hasContent) return;

    void (async () => {
      let nextSvg: string;
      try {
        nextSvg = await QRCode.toString(payload, { ...options, type: "svg" });
      } catch (error) {
        if (runRef.current === current) {
          setFailure(
            `Não foi possível gerar o QR Code: ${
              error instanceof Error ? error.message : "erro desconhecido"
            }.`,
          );
        }
        return;
      }
      if (runRef.current !== current) return;

      // The canvas preview is progressive enhancement: if the browser refuses
      // it, the SVG and the PNG data URL below still keep the tool usable.
      const canvas = canvasRef.current;
      if (canvas) {
        try {
          await QRCode.toCanvas(canvas, payload, options);
          if (runRef.current === current) setCanvasFailed(false);
        } catch {
          if (runRef.current === current) setCanvasFailed(true);
        }
      }

      let nextDataUrl = "";
      try {
        nextDataUrl = await QRCode.toDataURL(payload, options);
      } catch {
        nextDataUrl = "";
      }

      if (runRef.current === current) {
        setFailure(null);
        setRendered({ payload, dataUrl: nextDataUrl, svg: nextSvg });
      }
    })();
  }, [hasContent, options, payload]);

  const fresh = rendered?.payload === payload ? rendered : null;

  const downloadPng = () => {
    if (!fresh?.dataUrl) return;
    const [meta, encoded] = fresh.dataUrl.split(",");
    if (!encoded) return;
    const mime = /:(.*?);/.exec(meta)?.[1] ?? "image/png";
    const binary = atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    downloadBlob(new Blob([bytes], { type: mime }), "qrcode.png");
  };

  const downloadSvg = () => {
    if (!fresh?.svg) return;
    downloadBlob(
      new Blob([fresh.svg], { type: "image/svg+xml;charset=utf-8" }),
      "qrcode.svg",
    );
  };

  const randomizeColors = () => {
    const hue = Math.floor(Math.random() * 360);
    setDark(`hsl(${hue} 70% 16%)`);
    setLight(`hsl(${(hue + 200) % 360} 85% 96%)`);
  };

  return (
    <ToolPanel>
      <div className="space-y-6">
        <header className="space-y-1">
          <h2 className="text-lg font-semibold text-fg">Gerador de QR Code</h2>
          <p className="text-sm text-muted">
            Códigos gerados inteiramente no navegador pela biblioteca{" "}
            <code className="font-mono text-xs text-brand">qrcode</code>. Exporte em
            PNG para a web ou em SVG para impressão.
          </p>
        </header>

        {errorMessage ? (
          <Alert tone={tooLarge ? "warning" : "error"}>
            <span className="inline-flex items-start gap-2">
              <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{errorMessage}</span>
            </span>
          </Alert>
        ) : null}

        <TwoColumns>
          <div className="space-y-4">
            <Field label="Tipo de conteúdo">
              <Select
                value={type}
                onChange={(e) => setType(e.target.value as ContentType)}
              >
                <option value="url">URL</option>
                <option value="text">Texto</option>
                <option value="vcard">Contato (vCard)</option>
                <option value="wifi">Wi-Fi</option>
                <option value="email">E-mail</option>
                <option value="tel">Telefone</option>
              </Select>
            </Field>

            {type === "url" ? (
              <Field
                label="Endereço"
                hint="Inclua o https:// para que leitores de QR tratem o link como seguro."
              >
                <TextInput
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://exemplo.com.br"
                  inputMode="url"
                  autoComplete="off"
                  spellCheck={false}
                />
              </Field>
            ) : null}

            {type === "text" ? (
              <Field label="Texto" hint="No máximo 2.953 bytes cabem em um QR Code (nível L).">
                <TextArea
                  rows={6}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Digite o texto que será codificado…"
                />
              </Field>
            ) : null}

            {type === "tel" ? (
              <Field
                label="Número de telefone"
                hint="Use o formato internacional, ex.: +5511999999999."
              >
                <TextInput
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+5511999999999"
                  inputMode="tel"
                  autoComplete="off"
                />
              </Field>
            ) : null}

            {type === "email" ? (
              <div className="space-y-3">
                <Field label="Endereço de e-mail">
                  <TextInput
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    placeholder="pessoa@exemplo.com.br"
                    inputMode="email"
                    autoComplete="off"
                  />
                </Field>
                <Field label="Assunto">
                  <TextInput
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Contato pelo site"
                  />
                </Field>
                <Field label="Mensagem">
                  <TextArea
                    rows={4}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Olá! Gostaria de mais informações sobre…"
                  />
                </Field>
              </div>
            ) : null}

            {type === "wifi" ? (
              <div className="space-y-3">
                <Field label="Nome da rede (SSID)">
                  <TextInput
                    value={ssid}
                    onChange={(e) => setSsid(e.target.value)}
                    placeholder="MinhaRede"
                    autoComplete="off"
                  />
                </Field>
                <Field label="Segurança">
                  <Select
                    value={wifiAuth}
                    onChange={(e) => setWifiAuth(e.target.value as "WPA" | "WEP" | "nopass")}
                  >
                    <option value="WPA">WPA / WPA2 / WPA3</option>
                    <option value="WEP">WEP</option>
                    <option value="nopass">Rede aberta (sem senha)</option>
                  </Select>
                </Field>
                {wifiAuth !== "nopass" ? (
                  <Field label="Senha">
                    <TextInput
                      value={wifiPassword}
                      onChange={(e) => setWifiPassword(e.target.value)}
                      placeholder="senha-da-rede"
                      autoComplete="off"
                    />
                  </Field>
                ) : null}
                <p className="text-xs leading-relaxed text-subtle">
                  O padrão Wi-Fi expõe a senha em texto claro para qualquer
                  aparelho com câmera. Se o público for amplo, prefira um código
                  de acesso por convite.
                </p>
              </div>
            ) : null}

            {type === "vcard" ? (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Nome">
                    <TextInput
                      value={contact.firstName}
                      onChange={(e) => setContact({ ...contact, firstName: e.target.value })}
                      placeholder="Ana"
                      autoComplete="off"
                    />
                  </Field>
                  <Field label="Sobronome">
                    <TextInput
                      value={contact.lastName}
                      onChange={(e) => setContact({ ...contact, lastName: e.target.value })}
                      placeholder="Souza"
                      autoComplete="off"
                    />
                  </Field>
                </div>
                <Field label="Empresa (opcional)">
                  <TextInput
                    value={contact.org}
                    onChange={(e) => setContact({ ...contact, org: e.target.value })}
                    placeholder="Studio Design"
                    autoComplete="organization"
                  />
                </Field>
                <Field label="Telefone">
                  <TextInput
                    value={contact.phone}
                    onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                    placeholder="+5511999999999"
                    inputMode="tel"
                    autoComplete="off"
                  />
                </Field>
                <Field label="E-mail">
                  <TextInput
                    value={contact.email}
                    onChange={(e) => setContact({ ...contact, email: e.target.value })}
                    placeholder="ana@exemplo.com.br"
                    inputMode="email"
                    autoComplete="off"
                  />
                </Field>
              </div>
            ) : null}
          </div>

          <div className="space-y-5">
            <section className="space-y-3 rounded-[var(--radius-card)] border border-line bg-surface-2 p-4">
              <ResultLabel>Pré-visualização</ResultLabel>
              <div
                className={cn(
                  "flex justify-center overflow-auto rounded-lg border border-line bg-bg-elevated p-3",
                  canvasFailed && "hidden",
                )}
              >
                <canvas
                  ref={canvasRef}
                  aria-label="Pré-visualização do QR Code gerado"
                  className="shrink-0"
                />
              </div>

              {hasContent && canvasFailed ? (
                <Alert tone="warning">
                  A pré-visualização em canvas não está disponível neste
                  navegador. Os downloads em PNG e SVG continuam funcionando.
                </Alert>
              ) : null}

              {!hasContent ? (
                <EmptyState>
                  Preencha o conteúdo ao lado para ver o QR Code. A imagem é
                  redesenhada a cada alteração.
                </EmptyState>
              ) : null}

              <p className="text-xs text-subtle tabular-nums">
                {payloadBytes.toLocaleString("pt-BR")} bytes · nível {ec} · {size}×
                {size} px · margem {margin}
              </p>
            </section>

            <section className="space-y-4">
              <ResultLabel>Aparência</ResultLabel>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Cor do código">
                  <input
                    type="color"
                    value={dark}
                    onChange={(e) => setDark(e.target.value)}
                    aria-label="Cor do código"
                    className="h-10 w-full cursor-pointer rounded-lg border border-line bg-bg-elevated p-1"
                  />
                </Field>
                <Field label="Cor do fundo">
                  <input
                    type="color"
                    value={light}
                    onChange={(e) => setLight(e.target.value)}
                    aria-label="Cor do fundo"
                    className="h-10 w-full cursor-pointer rounded-lg border border-line bg-bg-elevated p-1"
                  />
                </Field>
              </div>

              <RangeField
                label="Tamanho"
                value={size}
                min={128}
                max={1024}
                step={32}
                suffix=" px"
                onChange={setSize}
              />
              <RangeField
                label="Margem"
                value={margin}
                min={0}
                max={16}
                suffix=" módulos"
                onChange={setMargin}
              />

              <Field
                label="Correção de erros"
                hint="Níveis altos deixam o código legível mesmo sujo ou parcialmente coberto."
              >
                <Select value={ec} onChange={(e) => setEc(e.target.value as EcLevel)}>
                  <option value="L">L — cerca de 7% de recuperação</option>
                  <option value="M">M — cerca de 15% de recuperação</option>
                  <option value="Q">Q — cerca de 25% de recuperação</option>
                  <option value="H">H — cerca de 30% de recuperação</option>
                </Select>
              </Field>

              <ButtonRow>
                <button
                  type="button"
                  onClick={randomizeColors}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-bg-elevated px-3 py-2 text-xs font-semibold text-fg transition-colors hover:border-brand"
                >
                  <Dices className="size-3.5" aria-hidden="true" />
                  Cores aleatórias
                </button>
              </ButtonRow>
            </section>

            <section className="space-y-3 border-t border-line pt-4">
              <ResultLabel>Exportar</ResultLabel>
              <ButtonRow>
                <button
                  type="button"
                  onClick={downloadPng}
                  disabled={!fresh?.dataUrl}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-strong disabled:pointer-events-none disabled:opacity-40"
                >
                  <ImageIcon className="size-3.5" aria-hidden="true" />
                  Baixar PNG
                </button>
                <button
                  type="button"
                  onClick={downloadSvg}
                  disabled={!fresh?.svg}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-bg-elevated px-3 py-2 text-xs font-semibold text-fg transition-colors hover:border-brand disabled:pointer-events-none disabled:opacity-40"
                >
                  <FileCode className="size-3.5" aria-hidden="true" />
                  Baixar SVG
                </button>
                <CopyButton value={fresh?.dataUrl ?? ""} label="Copiar PNG" />
              </ButtonRow>
              <p className="text-xs leading-relaxed text-subtle">
                O SVG é vetorial e escala sem perda — é a melhor opção para
                impressão. Mantenha a margem em pelo menos 2 módulos e não
                inverta as cores, pois muitos leitores falham com contraste
                negativo.
              </p>
            </section>
          </div>
        </TwoColumns>

        {hasContent ? (
          <section className="space-y-2 border-t border-line pt-4">
            <ResultLabel>Conteúdo codificado</ResultLabel>
            <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-lg border border-line bg-surface-2 px-3 py-2 font-mono text-xs leading-relaxed text-muted">
              {payload}
            </pre>
            <ButtonRow>
              <CopyButton value={payload} label="Copiar conteúdo" />
            </ButtonRow>
          </section>
        ) : null}
      </div>
    </ToolPanel>
  );
}