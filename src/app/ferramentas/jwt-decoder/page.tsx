import type { Metadata } from "next";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { buildToolMetadata } from "@/lib/tools-metadata";
import JwtDecoder from "@/tools/jwt-decoder";

/** Decodifica header, payload e claims de qualquer token JWT. */
export function generateMetadata(): Metadata {
  return buildToolMetadata("jwt-decoder");
}

export default function Page() {
  return (
    <ToolPageShell slug="jwt-decoder">
      <JwtDecoder />
    </ToolPageShell>
  );
}
