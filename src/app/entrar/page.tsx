import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Acesse sua conta do TechLab para salvar artigos favoritos e preferir ferramentas.",
  // Account pages should not be indexed.
  robots: { index: false, follow: true },
};

export default function EntrarPage() {
  return (
    <div className="mx-auto max-w-[420px] px-4 py-12 sm:px-6">
      <PageHeader title="Entrar" description="Acesse sua conta do TechLab." />
      <AuthForm mode="login" />
    </div>
  );
}
