/**
 * Curated news items.
 *
 * Placeholder feed so the sidebar renders with realistic content. Replace with
 * a real source (RSS, NewsData, GNews) — keep the same `NewsItem` shape and the
 * components need no changes.
 */

export type NewsItem = {
  title: string;
  /** ISO date. */
  date: string;
  href: string;
  /** Single-emoji glyph shown in the item's thumbnail. */
  tag: string;
};

export const news: NewsItem[] = [
  {
    title: "Modelos de IA open-source seguem evoluindo rápido",
    date: "2026-10-08",
    href: "/artigos",
    tag: "🤖",
  },
  {
    title: "Google apresenta a nova geração do Gemini para desenvolvedores",
    date: "2026-10-05",
    href: "/artigos",
    tag: "🌐",
  },
  {
    title: "Linux 6.15 traz melhorias importantes para containers",
    date: "2026-10-02",
    href: "/artigos",
    tag: "🐧",
  },
  {
    title: "Comparativo: as melhores IAs para criar imagens em 2026",
    date: "2026-09-29",
    href: "/artigos",
    tag: "🎨",
  },
];
