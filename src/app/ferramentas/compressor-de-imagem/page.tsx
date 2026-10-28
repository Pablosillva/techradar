import type { Metadata } from "next";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { buildToolMetadata } from "@/lib/tools-metadata";
import CompressorDeImagem from "@/tools/compressor-de-imagem";

/** Reduz o tamanho de imagens JPG, PNG e WebP localmente. */
export function generateMetadata(): Metadata {
  return buildToolMetadata("compressor-de-imagem");
}

export default function Page() {
  return (
    <ToolPageShell slug="compressor-de-imagem">
      <CompressorDeImagem />
    </ToolPageShell>
  );
}
