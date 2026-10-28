import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Cursos de programação e tecnologia",
  description:
    "Trilhas de programação do zero ao avançado, com projetos práticos e certificado. React, TypeScript, Node.js, Python e infraestrutura.",
  alternates: { canonical: "/cursos" },
  openGraph: {
    title: `Cursos de programação | ${siteConfig.name}`,
    description: "Do zero ao avançado, com projetos práticos e certificados.",
    url: "/cursos",
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: "website",
  },
};

type Course = {
  title: string;
  level: string;
  hours: string;
  summary: string;
  topics: string[];
  price: string;
  highlight?: boolean;
};

const courses: Course[] = [
  {
    title: "React do Zero ao Avançado",
    level: "Intermediário",
    hours: "18h",
    summary:
      "Construa interfaces reais com React e TypeScript, entendendo estado, efeitos e renderização do servidor por dentro.",
    topics: [
      "JSX, props e composição",
      "Estado, efeitos e hooks",
      "TypeScript aplicado a React",
      "Server Components e Next.js",
      "Testes e performance",
    ],
    price: "R$ 297",
    highlight: true,
  },
  {
    title: "Node.js e APIs Professionais",
    level: "Intermediário",
    hours: "14h",
    summary:
      "Construa APIs REST robustas, com autenticação, validação, banco de dados e deploy em produção.",
    topics: [
      "Event loop e async/await",
      "Express e Fastify",
      "PostgreSQL e migrations",
      "Autenticação e segurança",
      "Deploy, logs e monitoring",
    ],
    price: "R$ 247",
  },
  {
    title: "Python para Automação e IA",
    level: "Iniciante",
    hours: "12h",
    summary:
      "Automatize tarefas repetitivas, manipule dados e construa sua primeira aplicação com inteligência artificial.",
    topics: [
      "Sintaxe e estruturas de dados",
      "Pandas para análise",
      "Integração com APIs de IA",
      "Automação de tarefas",
      "Deploy de scripts Python",
    ],
    price: "R$ 197",
  },
];

export default function CursosPage() {
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Cursos"
        title="Aprenda programação na prática"
        description="Trilhas completas, com projetos que você realmente constrói e código que vai para o seu portfólio. Acesso vitalício e certificado de conclusão."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {courses.map((course) => (
          <article
            key={course.title}
            className={`flex flex-col rounded-[var(--radius-card)] border bg-surface p-6 ${
              course.highlight ? "border-brand/50" : "border-line"
            }`}
          >
            {course.highlight && (
              <span className="mb-3 w-fit rounded-full bg-brand/15 px-2.5 py-0.5 text-[11px] font-bold text-brand">
                Mais popular
              </span>
            )}

            <h2 className="text-lg font-bold leading-snug text-fg">
              {course.title}
            </h2>

            <p className="mt-1 text-xs font-medium text-subtle">
              {course.level} · {course.hours}
            </p>

            <p className="mt-3 text-sm leading-relaxed text-muted">
              {course.summary}
            </p>

            <ul className="mt-4 space-y-2">
              {course.topics.map((topic) => (
                <li key={topic} className="flex items-start gap-2 text-sm text-muted">
                  <Check
                    className="mt-0.5 size-4 shrink-0 text-success"
                    aria-hidden="true"
                  />
                  {topic}
                </li>
              ))}
            </ul>

            <div className="mt-auto flex items-center justify-between gap-3 pt-6">
              <span className="text-lg font-extrabold text-fg">{course.price}</span>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand">
                Ver programa <ArrowRight className="size-3.5" aria-hidden="true" />
              </span>
            </div>
          </article>
        ))}
      </div>

      <aside className="mt-10 rounded-[var(--radius-card)] border border-brand/30 bg-brand/8 p-6">
        <h2 className="text-lg font-bold text-fg">Prefere aprender sem gastar?</h2>
        <p className="mt-1 mb-4 text-sm text-muted">
          Todo o conteúdo conceitual do TechLab é gratuito. As ferramentas online
          também — e você pode usá-las hoje mesmo.
        </p>
        <Link
          href="/artigos"
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-strong"
        >
          Ver artigos gratuitos
        </Link>
      </aside>

      <p className="mt-8 text-xs text-subtle">
        Os cursos estão em preparação. Volte em breve ou acompanhe o{" "}
        <Link
          href="/noticias"
          className="text-brand hover:underline"
        >
          {siteConfig.name}
        </Link>{" "}
        para ser avisado.
      </p>
    </div>
  );
}
