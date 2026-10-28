/**
 * Global site configuration. Everything brand- or URL-related lives here so
 * there is a single place to change the domain, name, or navigation.
 */

export const siteConfig = {
  name: "TechLab",
  /** Used as the `<title>` suffix and in the header logo. */
  shortName: "TechLab",
  tagline: "Tecnologia, IA, programação e ferramentas online",
  description:
    "Portal brasileiro sobre inteligência artificial, programação e software. Artigos, tutoriais e ferramentas online gratuitas para formatar JSON, gerar senhas, converter imagens e muito mais.",
  /** Canonical origin. Override in production with NEXT_PUBLIC_SITE_URL. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://techlab.com.br",
  locale: "pt_BR",
  lang: "pt-BR",
  author: {
    name: "Equipe TechLab",
    url: "https://techlab.com.br/sobre",
  },
  social: {
    youtube: "https://youtube.com/@techlab",
    github: "https://github.com/techlab",
    x: "https://x.com/techlab",
    discord: "https://discord.gg/techlab",
    linkedin: "https://linkedin.com/company/techlab",
  },
} as const;

export type NavItem = {
  href: string;
  label: string;
};

export const mainNav: NavItem[] = [
  { href: "/", label: "Início" },
  { href: "/artigos", label: "Artigos" },
  { href: "/ferramentas", label: "Ferramentas" },
  { href: "/tutoriais", label: "Tutoriais" },
  { href: "/noticias", label: "Notícias" },
  { href: "/sobre", label: "Sobre" },
];

/** Editorial categories. These map 1:1 to `/categorias/[slug]`. */
export type Category = {
  slug: string;
  name: string;
  description: string;
  /** Accent colour used for badges and hero glow. */
  accent: string;
};

export const categories: Category[] = [
  {
    slug: "ia",
    name: "Inteligência Artificial",
    description:
      "As melhores IAs para estudar, escrever, gerar imagens e programar. Comparativos, guias de prompt e novidades do mundo da IA.",
    accent: "#8b5cf6",
  },
  {
    slug: "programacao",
    name: "Programação",
    description:
      "React, TypeScript, JavaScript, Node.js, Python, APIs, PostgreSQL, Docker, Linux e Git — do zero ao avançado.",
    accent: "#3b8dff",
  },
  {
    slug: "software",
    name: "Software",
    description:
      "Editores de código, hospedagem, VPS, bancos de dados, ferramentas SaaS, antivírus, VPN e armazenamento em nuvem.",
    accent: "#22c98a",
  },
];

/** Formats a date as `dd/mm/yyyy` (pt-BR), stable across server/client. */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

/** Short relative label used on cards, e.g. "há 3 dias". */
export function relativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days <= 0) return "hoje";
  if (days === 1) return "ontem";
  if (days < 30) return `há ${days} dias`;
  const months = Math.floor(days / 30);
  if (months === 1) return "há 1 mês";
  if (months < 12) return `há ${months} meses`;
  return `há ${Math.floor(months / 12)} anos`;
}

/** Converts a slug like `json-formatter` into `Json Formatter`. */
export function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
