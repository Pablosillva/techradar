import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { ToolCard } from "@/components/ui";
import {
  toolCategories,
  tools,
  type ToolCategorySlug,
} from "@/lib/tools";
import { siteConfig } from "@/lib/site";

export const dynamicParams = false;

function isCategory(slug: string): slug is ToolCategorySlug {
  return slug in toolCategories;
}

export function generateStaticParams() {
  return Object.values(toolCategories).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/ferramentas/categoria/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  if (!isCategory(slug)) return {};

  const category = toolCategories[slug];
  const count = tools.filter((t) => t.category === slug).length;
  const title = `Ferramentas de ${category.name} — ${count} opções grátis`;
  const description = `${category.description} ${count} ferramentas online gratuitas, sem cadastro e processadas no seu navegador.`;

  return {
    title,
    description,
    alternates: { canonical: `/ferramentas/categoria/${slug}` },
    openGraph: {
      title: `${title} | ${siteConfig.name}`,
      description,
      url: `/ferramentas/categoria/${slug}`,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      creator: "@techlab",
    },
  };
}

export default async function CategoriaPage({
  params,
}: PageProps<"/ferramentas/categoria/[slug]">) {
  const { slug } = await params;
  if (!isCategory(slug)) notFound();

  const category = toolCategories[slug];
  const list = tools.filter((t) => t.category === slug);
  const others = Object.values(toolCategories).filter((c) => c.slug !== slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Ferramentas de ${category.name}`,
    description: category.description,
    url: `${siteConfig.url}/ferramentas/categoria/${slug}`,
    inLanguage: "pt-BR",
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <nav aria-label="Trilha de navegação" className="mb-5 text-xs text-subtle">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-brand">
              Início
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/ferramentas" className="hover:text-brand">
              Ferramentas
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="font-semibold text-muted" aria-current="page">
            {category.name}
          </li>
        </ol>
      </nav>

      <header className="mb-8 max-w-3xl">
        <h1 className="text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">
          Ferramentas de {category.name.toLowerCase()}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted">
          {category.description} Todas são gratuitas e funcionam offline no seu
          navegador.
        </p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((tool) => (
          <ToolCard key={tool.slug} tool={tool} />
        ))}
      </ul>

      <section aria-labelledby="outras-categorias" className="mt-14">
        <h2
          id="outras-categorias"
          className="mb-4 text-lg font-bold tracking-tight text-fg"
        >
          Explore outras categorias
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {others.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/ferramentas/categoria/${c.slug}`}
                className="group flex h-full items-center justify-between gap-2 rounded-xl border border-line bg-surface p-4 transition-colors hover:border-brand/50"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-fg">{c.name}</span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {tools.filter((t) => t.category === c.slug).length} ferramentas
                  </span>
                </span>
                <ArrowRight
                  className="size-4 shrink-0 text-subtle transition-colors group-hover:text-brand"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
