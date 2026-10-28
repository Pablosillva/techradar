import type { Metadata } from "next";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { buildToolMetadata } from "@/lib/tools-metadata";
import CalculadoraDePorcentagem from "@/tools/calculadora-de-porcentagem";

/** Calcula aumento, desconto, proporção e diferença. */
export function generateMetadata(): Metadata {
  return buildToolMetadata("calculadora-de-porcentagem");
}

export default function Page() {
  return (
    <ToolPageShell slug="calculadora-de-porcentagem">
      <CalculadoraDePorcentagem />
    </ToolPageShell>
  );
}
