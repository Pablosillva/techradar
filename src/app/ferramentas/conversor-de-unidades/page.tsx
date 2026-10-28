import type { Metadata } from "next";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { buildToolMetadata } from "@/lib/tools-metadata";
import ConversorDeUnidades from "@/tools/conversor-de-unidades";

/** Converte comprimento, massa, temperatura e mais. */
export function generateMetadata(): Metadata {
  return buildToolMetadata("conversor-de-unidades");
}

export default function Page() {
  return (
    <ToolPageShell slug="conversor-de-unidades">
      <ConversorDeUnidades />
    </ToolPageShell>
  );
}
