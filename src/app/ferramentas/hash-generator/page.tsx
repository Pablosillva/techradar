import type { Metadata } from "next";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { buildToolMetadata } from "@/lib/tools-metadata";
import HashGenerator from "@/tools/hash-generator";

/** Calcula MD5, SHA-1, SHA-256, SHA-384 e SHA-512. */
export function generateMetadata(): Metadata {
  return buildToolMetadata("hash-generator");
}

export default function Page() {
  return (
    <ToolPageShell slug="hash-generator">
      <HashGenerator />
    </ToolPageShell>
  );
}
