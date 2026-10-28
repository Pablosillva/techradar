import type { Metadata } from "next";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { buildToolMetadata } from "@/lib/tools-metadata";
import GeradorDeSenha from "@/tools/gerador-de-senha";

/** Gera senhas aleatórias seguras com medidor de força. */
export function generateMetadata(): Metadata {
  return buildToolMetadata("gerador-de-senha");
}

export default function Page() {
  return (
    <ToolPageShell slug="gerador-de-senha">
      <GeradorDeSenha />
    </ToolPageShell>
  );
}
