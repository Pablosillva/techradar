import Link from "next/link";
import { BookOpen, Brain, MessagesSquare, Wrench, GraduationCap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const pillars: { icon: LucideIcon; title: string; text: string; href: string }[] = [
  {
    icon: BookOpen,
    title: "Tutoriais",
    text: "Passo a passo, do básico ao avançado.",
    href: "/tutoriais",
  },
  {
    icon: Wrench,
    title: "Ferramentas",
    text: "Utilitários gratuitos para o seu dia a dia.",
    href: "/ferramentas",
  },
  {
    icon: Brain,
    title: "IA",
    text: "Tudo sobre inteligência artificial.",
    href: "/categorias/ia",
  },
  {
    icon: GraduationCap,
    title: "Cursos",
    text: "Aprenda no seu ritmo.",
    href: "/cursos",
  },
  {
    icon: MessagesSquare,
    title: "Comunidade",
    text: "Tire dúvidas e compartilhe conhecimento.",
    href: "/comunidade",
  },
];

export function Pillars() {
  return (
    <section
      aria-label="Navegação por topic"
      className="grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line sm:grid-cols-2 lg:grid-cols-5"
    >
      {pillars.map((p) => (
        <Link
          key={p.title}
          href={p.href}
          className="group flex items-start gap-3 bg-surface p-4 transition-colors hover:bg-surface-2"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand/12 text-brand transition-colors group-hover:bg-brand/20">
            <p.icon className="size-5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-bold text-fg">{p.title}</span>
            <span className="mt-0.5 block text-xs leading-relaxed text-muted">
              {p.text}
            </span>
          </span>
        </Link>
      ))}
    </section>
  );
}
