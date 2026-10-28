import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostCard } from "@/components/post-card";
import { getAllPosts } from "@/lib/posts";
import { categories, siteConfig } from "@/lib/site";
import { tools } from "@/lib/tools";

export const dynamicParams = false;

export function generateStaticParams() {
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/categorias/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = categories.find((c) => c.slug === slug);
  if (!category) return {};

  const posts = (await getAllPosts()).filter((p) => p.category === slug);
  const title = `${category.name} — ${posts.length} artigos`;
  const description = category.description;

  return {
    title,
    description,
    keywords: [category.name, ...category.name.toLowerCase().split(" ")],
    alternates: { canonical: `/categorias/${slug}` },
    openGraph: {
      title: `${title} | ${siteConfig.name}`,
      description,
      url: `/categorias/${slug}`,
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

export default async function CategoryPage({
  params,
}: PageProps<"/categorias/[slug]">) {
  const { slug } = await params;
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const posts = (await getAllPosts()).filter((p) => p.category === slug);
  const others = categories.filter((c) => c.slug !== slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.name,
    description: category.description,
    url: `${siteConfig.url}/categorias/${slug}`,
    inLanguage: "pt-BR",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: posts.length,
      itemListElement: posts.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${siteConfig.url}/artigos/${p.slug}`,
        name: p.title,
      })),
    },
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
          <li className="font-semibold text-muted" aria-current="page">
            {category.name}
          </li>
        </ol>
      </nav>

      <header
        className="mb-10 rounded-[var(--radius-card)] border border-line bg-surface p-6 sm:p-8"
        style={{ borderTopColor: category.accent }}
      >
        <p
          className="text-xs font-bold uppercase tracking-[0.16em]"
          style={{ color: category.accent }}
        >
          Categoria
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">
          {category.name}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
          {category.description}
        </p>
      </header>

      {posts.length > 0 ? (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <li key={post.slug} className="flex">
              <div className="flex w-full">
                <PostCard post={post} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-line px-6 py-16 text-center text-sm text-subtle">
          Ainda não publicamos artigos nesta categoria. Volte em breve.
        </p>
      )}

      <section aria-labelledby="outras-cats" className="mt-14 border-t border-line pt-8">
        <h2 id="outras-cats" className="mb-4 text-lg font-bold text-fg">
          Outras categorias
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {others.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/categorias/${c.slug}`}
                className="block rounded-xl border border-line bg-surface p-4 transition-colors hover:border-brand/50"
              >
                <span className="block text-sm font-bold" style={{ color: c.accent }}>
                  {c.name}
                </span>
                <span className="mt-1 block text-xs text-muted">{c.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="ferramentas-relacionadas" className="mt-10">
        <h2
          id="ferramentas-relacionadas"
          className="mb-4 text-lg font-bold text-fg"
        >
          Ferramentas para acompanhar seus estudos
        </h2>
        <p className="mb-4 text-sm text-muted">
          {tools.length} ferramentas gratuitas para você usar enquanto estuda.
        </p>
        <Link
          href="/ferramentas"
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-strong"
        >
          Ver todas as ferramentas
        </Link>
      </section>
    </div>
  );
}
