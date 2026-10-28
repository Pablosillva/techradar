import type { Metadata } from "next";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { buildToolMetadata } from "@/lib/tools-metadata";
import GeradorDeUuid from "@/tools/gerador-de-uuid";

/** Gera UUID v4 únicos em lote, com cópia e download. */
export function generateMetadata(): Metadata {
  return buildToolMetadata("gerador-de-uuid");
}

export default function Page() {
  return (
    <ToolPageShell slug="gerador-de-uuid">
      <GeradorDeUuid />
    </ToolPageShell>
  );
}
