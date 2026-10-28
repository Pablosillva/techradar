import type { Metadata } from "next";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { buildToolMetadata } from "@/lib/tools-metadata";
import FormatadorJson from "@/tools/formatador-json";

/** Formata, valida e beautifica JSON em tempo real. */
export function generateMetadata(): Metadata {
  return buildToolMetadata("formatador-json");
}

export default function Page() {
  return (
    <ToolPageShell slug="formatador-json">
      <FormatadorJson />
    </ToolPageShell>
  );
}
