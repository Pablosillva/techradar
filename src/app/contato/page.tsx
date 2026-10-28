import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = {
  title: "Contato",
  description:
    "Fale com a equipe do TechLab: dúvidas, sugestões de pauta, erros em artigos ou parcerias.",
  alternates: { canonical: "/contato" },
};

export default function ContatoPage() {
  return (
    <div className="mx-auto max-w-[640px] px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Contato"
        title="Fale com a gente"
        description="Dúvidas, correções, sugestões de pauta ou propostas de parceria — responderemos por e-mail."
      />
      <ContactForm />
    </div>
  );
}
