import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { news } from "@/lib/news";
import { getAllPosts } from "@/lib/posts";
import { categories } from "@/lib/site";

export const metadata: Metadata = {
  title: "Comunidade",
  description:
    "Participe da comunidade TechLab: troque dúvidas sobre tecnologia, IA e programação com outras pessoas que estão construindo.",
  alternates: { canonical: "/comunidade" },
};

const channels = [
  {
    name: "Discord",
    description: "Canal mais ativo para dúvidas rápidas e ajuda mútua.",
    href: "https://discord.gg/techlab",
  },
  {
    name: "GitHub",
    description: "Discussões sobre os artigos e sugestão de correções.",
    href: "https://github.com/techlab",
  },
  {
    name: "YouTube",
    description: "Vídeos práticos complementando os tutoriais.",
    href: "https://youtube.com/@techlab",
  },
];

export default async function ComunidadePage() {
  const posts = await getAllPosts();

  return (
    <div className="mx-auto max-w-[900px] px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Comunidade"
        title="Aprender junto é mais rápido"
        description="Ninguém aprende tecnologia sozinho. Onde a comunidade do TechLab conversa, tira dúvidas e compartilha o que funcionou."
      />

      <ul className="grid gap-4 sm:grid-cols-3">
        {channels.map((c) => (
          <li key={c.name}>
            <a
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-full flex-col rounded-[var(--radius-card)] border border-line bg-surface p-5 transition-colors hover:border-brand/50"
            >
              <span className="text-base font-bold text-fg">{c.name} →</span>
              <span className="mt-1.5 text-sm leading-relaxed text-muted">
                {c.description}
              </span>
            </a>
          </li>
        ))}
      </ul>

      <section aria-labelledby="comece" className="mt-12">
        <h2 id="comece" className="mb-4 text-lg font-bold text-fg">
          Comece por aqui
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/categorias/${c.slug}`}
                className="flex items-center justify-between gap-2 rounded-lg border border-line bg-surface px-4 py-3 text-sm text-muted transition-colors hover:border-brand/50 hover:text-fg"
              >
                <span className="font-semibold">{c.name}</span>
                <span className="text-xs text-subtle">
                  {posts.filter((p) => p.category === c.slug).length} artigos
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="ultimas" className="mt-12">
        <h2 id="ultimas" className="mb-4 text-lg font-bold text-fg">
          Assunto mais quente agora
        </h2>
        <ul className="space-y-2">
          {news.map((n) => (
            <li
              key={n.title}
              className="flex items-start gap-3 rounded-lg border border-line bg-surface px-4 py-3"
            >
              <span aria-hidden="true">{n.tag}</span>
              <span className="text-sm text-muted">{n.title}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
