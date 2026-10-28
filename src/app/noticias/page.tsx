import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { news } from "@/lib/news";
import { formatDate, siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Notícias de tecnologia e IA",
  description:
    "As principais notícias de tecnologia, inteligência artificial, programação e software, com contexto e análise.",
  alternates: { canonical: "/noticias" },
  openGraph: {
    title: `Notícias de tecnologia e IA | ${siteConfig.name}`,
    description:
      "As principais novidades de tecnologia, IA, programação e software.",
    url: "/noticias",
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: "website",
  },
};

export default function NoticiasPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Notícias de tecnologia",
    url: `${siteConfig.url}/noticias`,
    inLanguage: "pt-BR",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: news.map((n, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: n.title,
        url: `${siteConfig.url}${n.href}`,
        datePublished: n.date,
      })),
    },
  };

  return (
    <div className="mx-auto max-w-[900px] px-4 py-8 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <PageHeader
        eyebrow="Notícias"
        title="Notícias e tendências"
        description="O que está acontecendo em tecnologia, IA e desenvolvimento — com o contexto que a manchete deixa de fora."
      />

      <ul className="space-y-3">
        {news.map((item) => (
          <li key={item.title}>
            <Link
              href={item.href}
              className="group flex items-start gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-5 transition-colors hover:border-brand/50"
            >
              <span
                className="grid size-12 shrink-0 place-items-center rounded-xl border border-line bg-bg-elevated text-2xl"
                aria-hidden="true"
              >
                {item.tag}
              </span>
              <span className="min-w-0">
                <span className="block text-base font-bold leading-snug text-fg group-hover:text-brand">
                  {item.title}
                </span>
                <time
                  dateTime={item.date}
                  className="mt-1.5 block text-xs text-subtle"
                >
                  {formatDate(item.date)}
                </time>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
