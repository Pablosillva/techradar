import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArticleBrowser } from "@/components/articles/article-browser";
import { getAllPosts } from "@/lib/posts";
import { categories, siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Artigos sobre Tecnologia, IA e Programação",
  description:
    "Guias, tutoriais e análises sobre inteligência artificial, React, TypeScript, Python, Node.js, Docker, Linux e Git. Escritos para quem está construindo.",
  alternates: { canonical: "/artigos" },
  openGraph: {
    title: `Artigos sobre Tecnologia, IA e Programação | ${siteConfig.name}`,
    description:
      "Guias, tutoriais e análises sobre IA, React, TypeScript, Python, Node.js, Docker e Linux.",
    url: "/artigos",
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Artigos sobre Tecnologia, IA e Programação | ${siteConfig.name}`,
    description: "Guias e análises sobre IA e desenvolvimento.",
    creator: "@techlab",
  },
};

export default async function ArtigosPage() {
  const posts = await getAllPosts();

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
      <header className="mb-8 max-w-3xl">
        <h1 className="text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">
          Artigos
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted">
          {posts.length} textos sobre tecnologia, inteligência artificial e
          desenvolvimento — do primeiro Deploy ao arquitetura de produção.
        </p>
      </header>

      {/* Suspense is required because ArticleBrowser reads useSearchParams;
          without it the static prerender bails out to a client-only render. */}
      <Suspense fallback={<ArticleListSkeleton />}>
        <ArticleBrowser posts={posts} />
      </Suspense>

      <section aria-labelledby="cats" className="mt-14 border-t border-line pt-8">
        <h2 id="cats" className="mb-4 text-lg font-bold tracking-tight text-fg">
          Ou navegue por categoria
        </h2>
        <ul className="grid gap-3 sm:grid-cols-3">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/categorias/${c.slug}`}
                className="group block h-full rounded-xl border border-line bg-surface p-4 transition-colors hover:border-brand/50"
              >
                <span
                  className="mb-2 block text-sm font-bold text-fg"
                  style={{ color: c.accent }}
                >
                  {c.name}
                </span>
                <span className="block text-xs leading-relaxed text-muted">
                  {c.description}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function ArticleListSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-64 animate-pulse rounded-[var(--radius-card)] border border-line bg-surface"
        />
      ))}
    </div>
  );
}
