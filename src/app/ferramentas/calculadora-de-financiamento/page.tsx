import type { Metadata } from "next";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { buildToolMetadata } from "@/lib/tools-metadata";
import CalculadoraDeFinanciamento from "@/tools/calculadora-de-financiamento";

/** Simula parcelas, juros e custo total de um financiamento. */
export function generateMetadata(): Metadata {
  return buildToolMetadata("calculadora-de-financiamento");
}

export default function Page() {
  return (
    <ToolPageShell slug="calculadora-de-financiamento">
      <CalculadoraDeFinanciamento />
    </ToolPageShell>
  );
}
