import type { Metadata } from "next";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { buildToolMetadata } from "@/lib/tools-metadata";
import GeradorDeQrCode from "@/tools/gerador-de-qr-code";

/** Cria QR Codes para link, texto, contato e Wi-Fi. */
export function generateMetadata(): Metadata {
  return buildToolMetadata("gerador-de-qr-code");
}

export default function Page() {
  return (
    <ToolPageShell slug="gerador-de-qr-code">
      <GeradorDeQrCode />
    </ToolPageShell>
  );
}
