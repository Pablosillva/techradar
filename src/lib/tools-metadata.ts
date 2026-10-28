import type { Metadata } from "next";
import { getTool } from "@/lib/tools";
import { siteConfig } from "@/lib/site";

/**
 * Builds the metadata for a tool page.
 *
 * Shared by every `/ferramentas/<slug>/page.tsx` so all 13 routes stay
 * identical in their SEO surface.
 *
 * `openGraph` and `twitter` are NOT deep-merged with the root layout: if a
 * segment sets any key of `openGraph`, the parent's keys are dropped entirely.
 * That's why every field the root layout defines is repeated here.
 */
export function buildToolMetadata(slug: string): Metadata {
  const tool = getTool(slug);
  if (!tool) return {};

  const title = `${tool.name} — Grátis e Online`;
  const description = tool.description;

  return {
    title,
    description,
    keywords: tool.keywords,
    alternates: { canonical: `/ferramentas/${slug}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `/ferramentas/${slug}`,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      creator: "@techlab",
    },
  };
}
