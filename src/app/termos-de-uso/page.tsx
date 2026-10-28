import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { tools } from "@/lib/tools";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description:
    "Os termos que regem o uso do TechLab, suas ferramentas online gratuitas e seu conteúdo.",
  alternates: { canonical: "/termos-de-uso" },
};

export default function TermosPage() {
  return (
    <div className="mx-auto max-w-[760px] px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Legal"
        title="Termos de Uso"
        description="Última atualização: outubro de 2026"
      />

      <div className="prose prose-lg max-w-none">
        <h2>1. Aceitação</h2>
        <p>
          Ao usar o TechLab você concorda com estes termos. Se não concordar,
          pare de usar o site.
        </p>

        <h2>2. Natureza do serviço</h2>
        <p>
          O TechLab oferece conteúdo editorial gratuito e {tools.length}{" "}
          ferramentas online. O serviço é prestado &quot;como está&quot;, sem
          garantia de disponibilidade ininterrupta.
        </p>

        <h2>3. Ferramentas online</h2>
        <p>
          As ferramentas processam dados localmente no seu navegador. Resultados
          devem ser conferidos antes de qualquer uso crítico — em particular,
          hashes, senhas geradas e conversões numéricas devem ser validados por
          você quando a correção for importante.
        </p>

        <h2>4. Uso aceitável</h2>
        <p>É proibido usar o site para:</p>
        <ul>
          <li>práticas que violem leis aplicáveis;</li>
          <li>tentar obter acesso não autorizado a sistemas de terceiros;</li>
          <li>gerar volume de requisições que prejudique a disponibilidade;</li>
          <li>reproduzir nosso conteúdo sem atribuição.</li>
        </ul>

        <h2>5. Conteúdo editorial</h2>
        <p>
          Os artigos são escritos com o melhor esforço de correção. Informação
          técnica muda com frequência: verifique a data de publicação antes de
          seguir um passo a passo.
        </p>

        <h2>6. Links externos</h2>
        <p>
          O site pode conter links de terceiros. Não temos controle sobre seu
          conteúdo e não respondemos por suas práticas de privacidade.
        </p>

        <h2>7. Publicidade e afiliados</h2>
        <p>
          O site pode conter links de afiliado. Isso significa que podemos
          receber uma comissão por compras indicadas, sem custo adicional para
          você. Isso nunca altera o preço pago.
        </p>

        <h2>8. Limitação de responsabilidade</h2>
        <p>
          Não respondemos por danos decorrentes do uso do site ou de decisões
          tomadas com base em seu conteúdo. Links para arquitetura de software e
          hospedagem são recomendações editoriais e não constituem consultoria.
        </p>

        <h2>9. Contato</h2>
        <p>
          Dúvidas sobre estes termos podem ser enviadas pela{" "}
          <Link href="/contato">página de contato</Link>.
        </p>
      </div>
    </div>
  );
}
