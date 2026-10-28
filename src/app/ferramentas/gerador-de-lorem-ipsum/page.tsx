import type { Metadata } from "next";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { buildToolMetadata } from "@/lib/tools-metadata";
import GeradorDeLoremIpsum from "@/tools/gerador-de-lorem-ipsum";

/** Gera Lorem Ipsum em parágrafos, frases ou palavras. */
export function generateMetadata(): Metadata {
  return buildToolMetadata("gerador-de-lorem-ipsum");
}

export default function Page() {
  return (
    <ToolPageShell slug="gerador-de-lorem-ipsum">
      <GeradorDeLoremIpsum />
    </ToolPageShell>
  );
}
