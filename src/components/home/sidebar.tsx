import Link from "next/link";
import { Flame, ArrowRight, Mail } from "lucide-react";
import { SectionHeading, ToolCard, Card, Badge } from "@/components/ui";
import { ToolIcon } from "@/components/ui/tool-icon";
import { tools, toolCategories } from "@/lib/tools";
import { SiteSearch } from "@/components/site-search";

/* -------------------------------------------------------------------------- */
/*  Ferramentas Online (sidebar)                                              */
/* -------------------------------------------------------------------------- */

export function ToolsPanel() {
  // Eight cards, matching the 4×2 grid in the reference design.
  const shown = tools.slice(0, 8);

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <ToolIcon name="braces" className="mt-0.5 size-5 text-brand" />
          <h2 className="text-lg font-bold tracking-tight text-fg">
            Ferramentas Online
          </h2>
        </div>
        <span className="shrink-0 text-xs text-subtle">
          +{tools.length} ferramentas úteis
        </span>
      </div>

      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
        {shown.map((tool) => (
          <li
            key={tool.slug}
            className="group rounded-xl border border-line bg-bg-elevated transition-colors hover:border-brand/50"
          >
            <Link
              href={`/ferramentas/${tool.slug}`}
              className="flex h-full flex-col items-center gap-2 p-3 text-center"
            >
              <ToolIcon
                name={tool.icon}
                className="size-5 text-success transition-colors group-hover:text-brand"
              />
              <span className="text-[11px] font-semibold leading-tight text-muted group-hover:text-fg">
                {tool.name}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href="/ferramentas"
        className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
      >
        Ver todas as ferramentas <ArrowRight className="size-3.5" aria-hidden="true" />
      </Link>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Notícias e tendências                                                      */
/* -------------------------------------------------------------------------- */

export type NewsItem = { title: string; date: string; href: string; tag: string };

/**
 * Static for now. When a real feed exists, pass it in from the server page so
 * this component stays a pure presentational piece.
 */
export function NewsPanel({ items }: { items: NewsItem[] }) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-2">
        <Flame className="size-5 text-warning" aria-hidden="true" />
        <h2 className="text-lg font-bold tracking-tight text-fg">
          Notícias e tendências
        </h2>
      </div>

      <ul className="divide-y divide-line">
        {items.map((item) => (
          <li key={item.title}>
            <Link
              href={item.href}
              className="group flex items-start gap-3 py-3 first:pt-0 last:pb-0"
            >
              <span
                className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg border border-line bg-bg-elevated text-lg"
                aria-hidden="true"
              >
                {item.tag}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold leading-snug text-fg group-hover:text-brand">
                  {item.title}
                </span>
                <time
                  dateTime={item.date}
                  className="mt-1 block text-xs text-subtle"
                >
                  {item.date}
                </time>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Newsletter                                                                */
/* -------------------------------------------------------------------------- */

export function NewsletterCard() {
  return (
    <Card className="relative overflow-hidden p-5">
      <div
        className="pointer-events-none absolute -right-16 -top-16 size-40 rounded-full bg-brand/20 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative">
        <div className="mb-2 flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-lg bg-brand/15 text-brand">
            <Mail className="size-4" aria-hidden="true" />
          </span>
          <h2 className="text-base font-bold text-fg">Fique por dentro!</h2>
        </div>
        <p className="mb-4 text-xs leading-relaxed text-muted">
          Receba as melhores novidades de tecnologia, IA e programação diretamente
          no seu e-mail.
        </p>
        <SiteSearch variant="newsletter" />
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Promo card                                                                */
/* -------------------------------------------------------------------------- */

export function PromoCard() {
  return (
    <Card className="relative overflow-hidden border-brand/30 p-0">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/20 via-transparent to-accent/10"
        aria-hidden="true"
      />
      <div className="relative p-5">
        <h2 className="text-xl font-extrabold leading-tight tracking-tight text-fg">
          Aprenda Programação
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          Do zero ao avançado, com projetos práticos e certificados.
        </p>
        <Link
          href="/cursos"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-strong"
        >
          Ver Cursos <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Popular tools (full width strip)                                          */
/* -------------------------------------------------------------------------- */

export function PopularTools() {
  const popular = tools.filter((t) => t.featured).slice(0, 6);
  const rest = tools.filter((t) => !t.featured).slice(0, 3);
  const shown = [...popular, ...rest].slice(0, 6);

  return (
    <section aria-labelledby="ferramentas-populares">
      <SectionHeading
        title={
          <span id="ferramentas-populares">
            Ferramentas <span className="text-brand">populares</span>
          </span>
        }
        action={{ href: "/ferramentas", label: "Ver todas as ferramentas" }}
      />
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((tool) => (
          <ToolCard key={tool.slug} tool={tool} />
        ))}
      </ul>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Category showcase                                                         */
/* -------------------------------------------------------------------------- */

export function CategoryShowcase() {
  return (
    <section aria-labelledby="explorar-categorias">
      <SectionHeading title={<span id="explorar-categorias">Explore por categoria</span>} />
      <ul className="grid gap-3 sm:grid-cols-3">
        {Object.values(toolCategories).map((c) => (
          <li key={c.slug}>
            <Link
              href={`/ferramentas/categoria/${c.slug}`}
              className="flex h-full flex-col rounded-xl border border-line bg-surface p-4 transition-colors hover:border-brand/50"
            >
              <Badge tone="neutral">{c.name}</Badge>
              <span className="mt-2 text-sm text-muted">{c.description}</span>
              <span className="mt-auto pt-3 text-xs font-semibold text-brand">
                {tools.filter((t) => t.category === c.slug).length} ferramentas →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
