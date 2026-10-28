import type { Metadata } from "next";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { buildToolMetadata } from "@/lib/tools-metadata";
import RedimensionadorDeImagem from "@/tools/redimensionador-de-imagem";

/** Redimensiona imagens em pixels ou porcentagem. */
export function generateMetadata(): Metadata {
  return buildToolMetadata("redimensionador-de-imagem");
}

export default function Page() {
  return (
    <ToolPageShell slug="redimensionador-de-imagem">
      <RedimensionadorDeImagem />
    </ToolPageShell>
  );
}
