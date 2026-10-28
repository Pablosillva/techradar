import type { Metadata } from "next";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { buildToolMetadata } from "@/lib/tools-metadata";
import ConversorJson from "@/tools/conversor-json";

/** Converte entre JSON, YAML, XML e CSV nos dois sentidos. */
export function generateMetadata(): Metadata {
  return buildToolMetadata("conversor-json");
}

export default function Page() {
  return (
    <ToolPageShell slug="conversor-json">
      <ConversorJson />
    </ToolPageShell>
  );
}
