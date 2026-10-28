import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { ToolIcon } from "@/components/ui/tool-icon";
import { ToolCard, Badge } from "@/components/ui";
import { getTool, tools, toolCategories } from "@/lib/tools";
import { siteConfig } from "@/lib/site";

/**
 * The chrome shared by every tool page: breadcrumb, header, trust badges, the
 * tool itself (passed as children), the "how to use" steps, the FAQ, related
 * tools and the closing CTA.
 *
 * Each tool gets its own route file that renders its own implementation as
 * `children`. That keeps the SEO template in one place while letting the
 * bundler emit exactly one tool chunk per route — no dynamic-import context
 * required.
 */
export function ToolPageShell({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  const tool = getTool(slug);
  if (!tool) notFound();

  const category = toolCategories[tool.category];
  const related = tools
    .filter((t) => t.slug !== tool.slug && t.category === tool.category)
    .slice(0, 3);
  const fallbacks = tools
    .filter((t) => t.slug !== tool.slug && t.category !== tool.category)
    .slice(0, Math.max(0, 3 - related.length));
  const suggestions = [...related, ...fallbacks];

  // SoftwareApplication + FAQPage — the markup that earns the rich snippets
  // for tool pages.
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: tool.name,
        description: tool.description,
        url: `${siteConfig.url}/ferramentas/${tool.slug}`,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Web",
        offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" },
        publisher: { "@id": `${siteConfig.url}/#organization` },
        inLanguage: "pt-BR",
        isAccessibleForFree: true,
      },
      {
        "@type": "FAQPage",
        mainEntity: tool.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
  };

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-8 sm:px-6">
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
          <li>
            <Link
              href={`/ferramentas/categoria/${category.slug}`}
              className="hover:text-brand"
            >
              {category.name}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="font-semibold text-muted" aria-current="page">
            {tool.name}
          </li>
        </ol>
      </nav>

      <header className="mb-8">
        <div className="flex items-start gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-brand/15 text-brand">
            <ToolIcon name={tool.icon} className="size-7" />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-fg sm:text-3xl">
              {tool.name}
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-muted sm:text-base">
              {tool.description}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge tone="success">
            <ShieldCheck className="size-3" aria-hidden="true" />
            100% no navegador
          </Badge>
          <Badge tone="neutral">Grátis</Badge>
          <Badge tone="neutral">Sem cadastro</Badge>
        </div>
      </header>

      {/* ------------------------------- The tool ------------------------------- */}
      <section aria-label={`Ferramenta: ${tool.name}`}>{children}</section>

      {/* ----------------------------- How to use ------------------------------ */}
      <section aria-labelledby="como-usar" className="mt-14">
        <h2 id="como-usar" className="mb-5 text-xl font-bold tracking-tight text-fg">
          Como usar o {tool.name}
        </h2>
        <ol className="grid gap-4 sm:grid-cols-2">
          {tool.steps.map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand/15 text-xs font-bold text-brand">
                {i + 1}
              </span>
              <span className="text-sm leading-relaxed text-muted">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* --------------------------------- FAQ ---------------------------------- */}
      <section aria-labelledby="faq" className="mt-14">
        <h2 id="faq" className="mb-5 text-xl font-bold tracking-tight text-fg">
          Perguntas frequentes sobre {tool.name.toLowerCase()}
        </h2>
        <div className="space-y-3">
          {tool.faq.map((item) => (
            // <details> keeps the answer in the DOM for crawlers without needing
            // JavaScript — better for SEO than a JS-only accordion.
            <details
              key={item.question}
              className="group rounded-xl border border-line bg-surface"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 px-4 py-3.5 text-sm font-semibold text-fg marker:content-none hover:text-brand">
                {item.question}
                <CheckCircle2
                  className="size-4 shrink-0 text-brand opacity-0 transition-opacity group-open:opacity-100"
                  aria-hidden="true"
                />
              </summary>
              <p className="px-4 pb-4 text-sm leading-relaxed text-muted">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* --------------------------- Related tools ----------------------------- */}
      {suggestions.length > 0 && (
        <section aria-labelledby="relacionadas" className="mt-14">
          <h2
            id="relacionadas"
            className="mb-5 text-xl font-bold tracking-tight text-fg"
          >
            Você também pode gostar
          </h2>
          <ul className="grid gap-3 sm:grid-cols-3">
            {suggestions.map((t) => (
              <ToolCard key={t.slug} tool={t} />
            ))}
          </ul>
        </section>
      )}

      <aside className="mt-14 flex flex-col items-start gap-4 rounded-[var(--radius-card)] border border-brand/30 bg-brand/8 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-fg">
            Precisa de mais ferramentas?
          </h2>
          <p className="mt-1 text-sm text-muted">
            São {tools.length} utilitários gratuitos, todos funcionando direto no seu
            navegador.
          </p>
        </div>
        <Link
          href="/ferramentas"
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-strong"
        >
          Ver todas as ferramentas
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </aside>
    </div>
  );
}
