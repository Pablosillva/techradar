import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { ToolBrowser } from "@/components/tools/tool-browser";
import { toolCategories, tools } from "@/lib/tools";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: `${tools.length} Ferramentas Online Gratuitas — JSON, Imagens e Mais`,
  description:
    "Ferramentas online gratuitas para formatar JSON, gerar senhas, criar QR Codes, comprimir imagens, converter unidades e muito mais. Tudo roda no seu navegador, sem cadastro.",
  alternates: { canonical: "/ferramentas" },
  openGraph: {
    title: `${tools.length} Ferramentas Online Gratuitas | ${siteConfig.name}`,
    description:
      "JSON, senhas, QR Code, imagens, hash e calculadoras. Grátis, sem cadastro e sem enviar seus dados.",
    url: "/ferramentas",
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${tools.length} Ferramentas Online Gratuitas | ${siteConfig.name}`,
    description:
      "JSON, senhas, QR Code, imagens, hash e calculadoras. Grátis, sem cadastro.",
    creator: "@techlab",
  },
};

export default function FerramentasPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Ferramentas Online Gratuitas",
    description:
      "Utilitários gratuitos que rodam inteiramente no navegador do usuário.",
    url: `${siteConfig.url}/ferramentas`,
    inLanguage: "pt-BR",
    hasPart: tools.map((t) => ({
      "@type": "SoftwareApplication",
      name: t.name,
      description: t.description,
      url: `${siteConfig.url}/ferramentas/${t.slug}`,
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Web",
      offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" },
    })),
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <header className="mb-8 max-w-3xl">
        <h1 className="text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">
          Ferramentas online gratuitas
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted">
          {tools.length} utilitários para facilitar o seu dia a dia com tecnologia.
          Todos processam os dados <strong className="text-fg">no seu navegador</strong>{" "}
          — nada é enviado para os nossos servidores.
        </p>

        <p className="mt-4 inline-flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-xs font-medium text-success">
          <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
          Sem cadastro, sem rastreamento, 100% grátis.
        </p>

        {/* Crawlable category routes — the in-page filter above is JS-only, so
            these give search engines real URLs to index per category. */}
        <nav aria-label="Categorias de ferramentas" className="mt-5">
          <ul className="flex flex-wrap gap-2">
            {Object.values(toolCategories).map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/ferramentas/categoria/${c.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-brand/50 hover:text-brand"
                >
                  {c.name}
                  <span className="text-subtle tabular-nums">
                    {tools.filter((t) => t.category === c.slug).length}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <ToolBrowser />
    </div>
  );
}
