import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { tools } from "@/lib/tools";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Como o TechLab trata seus dados: o que é coletado, por quanto tempo é mantido e quais são os seus direitos.",
  alternates: { canonical: "/privacidade" },
};

export default function PrivacidadePage() {
  return (
    <div className="mx-auto max-w-[760px] px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Legal"
        title="Política de Privacidade"
        description="Última atualização: outubro de 2026"
      />

      <div className="prose prose-lg max-w-none">
        <p>
          Esta política explica o que o TechLab coleta, por que coleta e quais são
          os seus direitos. Ela se aplica a todas as páginas deste site.
        </p>

        <h2>O que não coletamos</h2>
        <p>
          <strong>Nenhum dado que você digita nas ferramentas é enviado aos nossos
          servidores.</strong> Todas as {tools.length} ferramentas online —
          formatador de JSON, gerador de senhas, hashes, QR Codes, compressão de
          imagens — executam inteiramente no seu navegador. O conteúdo que você
          digita existe apenas na memória da aba e é descartado ao fechá-la.
        </p>

        <h2>Dados que coletamos</h2>
        <ul>
          <li>
            <strong>Newsletter:</strong> o endereço de e-mail que você informa
            voluntariamente no formulário de inscrição.
          </li>
          <li>
            <strong>Formulário de contato:</strong> nome, e-mail, assunto e a
            mensagem enviada.
          </li>
          <li>
            <strong>Dados técnicos de navegação:</strong> páginas visitadas e
            origem do acesso, coletados de forma agregada e anônima para entender
            quais conteúdos são úteis.
          </li>
        </ul>

        <h2>Finalidade e base legal</h2>
        <p>
          Usamos seus dados para enviar a newsletter (com seu consentimento
          explícito), responder às mensagens que você envia (execução de contrato)
          e melhorar o site (legítimo interesse). Você pode cancelar a inscrição
          na newsletter a qualquer momento pelo link no rodapé de cada e-mail.
        </p>

        <h2>Compartilhamento</h2>
        <p>
          Não vendemos seus dados. Compartilhamos apenas com operadores
          necessários para operar o site — por exemplo, a empresa de e-mail que
          entrega a newsletter e a hospedagem do site —, todos submetidos a
          contratos de confidencialidade.
        </p>

        <h2>Retenção</h2>
        <p>
          Mantemos os dados da newsletter enquanto a assinatura estiver ativa. As
          mensagens de contato são apagadas em até 90 dias após a resposta.
        </p>

        <h2>Seus direitos</h2>
        <p>
          Pela LGPD (Lei Geral de Proteção de Dados), você pode solicitar a
          qualquer momento: confirmação da existência de tratamento, acesso aos
          dados, correção, portabilidade, anonimização ou eliminação. Envie sua
          solicitação pela{" "}
          <Link href="/contato">página de contato</Link> — respondemos em até 15
          dias.
        </p>

        <h2>Cookies</h2>
        <p>
          Usamos apenas cookies estritamente necessários para funcionamento do
          site e, se e quando habilitado, para medir audiência de forma
          agregada. Não usamos cookies de publicidade de terceiros para rastrear
          sua navegação.
        </p>

        <h2>Alterações</h2>
        <p>
          Mudanças relevantes nesta política serão indicadas no topo da página,
          com a data da última atualização.
        </p>
      </div>
    </div>
  );
}
