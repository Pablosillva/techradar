import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Cadastrar-se",
  description: "Crie sua conta gratuita no TechLab para salvar artigos e personalizar sua experiência.",
  robots: { index: false, follow: true },
};

export default function CadastrarPage() {
  return (
    <div className="mx-auto max-w-[420px] px-4 py-12 sm:px-6">
      <PageHeader
        title="Criar conta"
        description="Leva menos de um minuto. E você não precisa de conta para usar as ferramentas."
      />
      <AuthForm mode="register" />
    </div>
  );
}
