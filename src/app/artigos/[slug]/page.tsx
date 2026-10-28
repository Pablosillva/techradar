import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Clock, Tag as TagIcon } from "lucide-react";
import { PostCard, PostCover, CategoryBadge } from "@/components/post-card";
import { SiteSearch } from "@/components/site-search";
import { getAllPosts, getRelatedPosts, loadPost } from "@/lib/posts";
import { categories, formatDate, siteConfig } from "@/lib/site";

export const dynamicParams = false;

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/artigos/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) return {};

  const { meta } = post;
  const title = meta.title;

  return {
    title,
    description: meta.description,
    keywords: meta.tags,
    authors: [{ name: siteConfig.author.name }],
    alternates: { canonical: `/artigos/${meta.slug}` },
    openGraph: {
      type: "article",
      title,
      description: meta.description,
      url: `/artigos/${meta.slug}`,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      publishedTime: meta.date,
      modifiedTime: meta.updated ?? meta.date,
      authors: [siteConfig.author.name],
      tags: meta.tags,
      // The OG card itself comes from ./opengraph-image.tsx (file-based
      // metadata), so it is not declared here to avoid emitting two images.
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: meta.description,
      creator: "@techlab",
    },
  };
}

export default async function ArticlePage({
  params,
}: PageProps<"/artigos/[slug]">) {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) notFound();

  const { meta, Post } = post;
  const category = categories.find((c) => c.slug === meta.category);
  const related = await getRelatedPosts(meta, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        headline: meta.title,
        description: meta.description,
        datePublished: meta.date,
        dateModified: meta.updated ?? meta.date,
        author: { "@id": `${siteConfig.url}/#organization` },
        publisher: { "@id": `${siteConfig.url}/#organization` },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": `${siteConfig.url}/artigos/${meta.slug}`,
        },
        inLanguage: "pt-BR",
        keywords: meta.tags.join(", "),
        ...(meta.image ? { image: [`${siteConfig.url}${meta.image}`] } : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Início",
            item: siteConfig.url,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Artigos",
            item: `${siteConfig.url}/artigos`,
          },
          ...(category
            ? [
                {
                  "@type": "ListItem",
                  position: 3,
                  name: category.name,
                  item: `${siteConfig.url}/categorias/${category.slug}`,
                },
              ]
            : []),
          {
            "@type": "ListItem",
            position: category ? 4 : 3,
            name: meta.title,
            item: `${siteConfig.url}/artigos/${meta.slug}`,
          },
        ],
      },
    ],
  };

  return (
    <article className="mx-auto max-w-[760px] px-4 py-8 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <nav aria-label="Trilha de navegação" className="mb-6 text-xs text-subtle">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-brand">
              Início
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/artigos" className="hover:text-brand">
              Artigos
            </Link>
          </li>
          {category && (
            <>
              <li aria-hidden="true">/</li>
              <li>
                <Link
                  href={`/categorias/${category.slug}`}
                  className="hover:text-brand"
                >
                  {category.name}
                </Link>
              </li>
            </>
          )}
        </ol>
      </nav>

      <header>
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-fg sm:text-4xl">
          {meta.title}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted">
          {meta.description}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-subtle">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="size-3.5" aria-hidden="true" />
            <time dateTime={meta.date}>{formatDate(meta.date)}</time>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5" aria-hidden="true" />
            {meta.readingTime} min de leitura
          </span>
          {meta.updated && (
            <span>
              Atualizado em{" "}
              <time dateTime={meta.updated}>{formatDate(meta.updated)}</time>
            </span>
          )}
        </div>
      </header>

      <div className="relative mt-8 h-52 overflow-hidden rounded-[var(--radius-card)] border border-line sm:h-72">
        <PostCover post={meta} />
        {category && <CategoryBadge category={meta.category} />}
      </div>

      <div className="prose prose-lg mt-10 max-w-none">
        <Post />
      </div>

      {meta.tags.length > 0 && (
        <div className="mt-10 border-t border-line pt-6">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-fg">
            <TagIcon className="size-4" aria-hidden="true" />
            Tags
          </h2>
          <ul className="flex flex-wrap gap-2">
            {meta.tags.map((tag) => (
              <li key={tag}>
                <Link
                  href={`/artigos?q=${encodeURIComponent(tag)}`}
                  className="inline-block rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-muted transition-colors hover:border-brand/50 hover:text-brand"
                >
                  {tag}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <aside className="mt-10 rounded-[var(--radius-card)] border border-brand/30 bg-brand/8 p-6">
        <h2 className="text-lg font-bold text-fg">
          Receba os melhores conteúdos por e-mail
        </h2>
        <p className="mb-4 mt-1 text-sm text-muted">
          Um resumo semanal de tecnologia, IA e programação. Sem spam.
        </p>
        <SiteSearch variant="newsletter" />
      </aside>

      {related.length > 0 && (
        <section aria-labelledby="relacionados" className="mt-14">
          <h2
            id="relacionados"
            className="mb-5 text-xl font-bold tracking-tight text-fg"
          >
            Continue lendo
          </h2>
          <ul className="grid gap-4 sm:grid-cols-3">
            {related.map((p) => (
              <li key={p.slug} className="flex">
                <div className="flex w-full">
                  <PostCard post={p} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
