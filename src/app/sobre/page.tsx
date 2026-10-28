import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { ToolIcon } from "@/components/ui/tool-icon";
import { categories, siteConfig } from "@/lib/site";
import { tools } from "@/lib/tools";
import { getAllPosts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Sobre o TechLab",
  description:
    "O TechLab é um portal brasileiro de tecnologia, inteligência artificial e programação, com artigos, tutoriais e ferramentas online gratuitas.",
  alternates: { canonical: "/sobre" },
  openGraph: {
    title: `Sobre o ${siteConfig.name}`,
    description:
      "Um portal brasileiro sobre tecnologia, IA e programação, com ferramentas gratuitas.",
    url: "/sobre",
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: "profile",
  },
};

export default async function SobrePage() {
  const posts = await getAllPosts();

  return (
    <div className="mx-auto max-w-[760px] px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Sobre"
        title={`Por que o ${siteConfig.name} existe`}
        description="Tecnologia muda rápido demais. Nosso objetivo é organizar o que importa e transformar em algo que você possa usar hoje."
      />

      <div className="prose prose-lg max-w-none">
        <h2>O que fazemos</h2>
        <p>
          Publicamos artigos e tutoriais sobre inteligência artificial,
          programação e software, e mantemos um conjunto de ferramentas online
          gratuitas para resolver problemas que aparecem no meio do trabalho
          diário.
        </p>

        <h2>Nossa aposta: ferramentas que respeitam você</h2>
        <p>
          Todas as {tools.length} ferramentas do site processam os dados{" "}
          <strong>dentro do seu navegador</strong>. Nenhum texto, senha, imagem ou
          hash que você digita sai do seu dispositivo. Isso não é um detalhe
          técnico: é a razão de o site existir sem rastrear você.
        </p>

        <h2>Como o conteúdo é escrito</h2>
        <p>
          Preferimos explicar o raciocínio a listar recursos. Quando comparamos
          duas IAs ou dois provedores de nuvem, dizemos em qual cenário cada um
          vence — e onde nenhum dos dois é a melhor escolha. Conteúdo que só
          repete o anúncio de outra pessoa não ajuda ninguém a decidir.
        </p>

        <h2>O que você encontra aqui</h2>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={`/categorias/${c.slug}`}
            className="rounded-xl border border-line bg-surface p-4 transition-colors hover:border-brand/50"
          >
            <span className="block text-sm font-bold" style={{ color: c.accent }}>
              {c.name}
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-muted">
              {c.description}
            </span>
          </Link>
        ))}
      </div>

      <div className="prose prose-lg mt-12 max-w-none">
        <h2>Números</h2>
        <ul>
          <li>
            <strong>{tools.length}</strong> ferramentas online gratuitas
          </li>
          <li>
            <strong>{posts.length}</strong> artigos publicados
          </li>
          <li>
            <strong>{categories.length}</strong> áreas de cobertura
          </li>
          <li>
            <strong>0</strong> cadastros obrigatórios, <strong>0</strong> rastreadores
          </li>
        </ul>

        <h2>Contato</h2>
        <p>
          Encontrou um erro em um artigo ou quer sugerir um tema? A página de{" "}
          <Link href="/contato">contato</Link> é o caminho mais rápido.
        </p>
      </div>

      <section aria-labelledby="ferramentas-sobre" className="mt-12">
        <h2 id="ferramentas-sobre" className="mb-4 text-lg font-bold text-fg">
          Ferramentas em destaque
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {tools.slice(0, 6).map((tool) => (
            <li key={tool.slug}>
              <Link
                href={`/ferramentas/${tool.slug}`}
                className="flex items-center gap-2.5 rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-muted transition-colors hover:border-brand/50 hover:text-fg"
              >
                <ToolIcon name={tool.icon} className="size-4 shrink-0 text-brand" />
                {tool.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
