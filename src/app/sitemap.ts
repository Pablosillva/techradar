import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/posts";
import { tools, toolCategories } from "@/lib/tools";
import { categories, siteConfig } from "@/lib/site";

/**
 * Generated at build time from the same registries the pages render from, so a
 * new tool or article is automatically discoverable — there is no list here to
 * forget to update.
 *
 * Dates come from content (post frontmatter) rather than `new Date()` so the
 * output is deterministic across builds.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts();
  const base = siteConfig.url;

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/artigos`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/ferramentas`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/tutoriais`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/noticias`, changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/cursos`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/sobre`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/contato`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/privacidade`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/termos-de-uso`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${base}/categorias/${c.slug}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const toolCategoryRoutes: MetadataRoute.Sitemap = Object.values(toolCategories).map(
    (c) => ({
      url: `${base}/ferramentas/categoria/${c.slug}`,
      changeFrequency: "weekly",
      priority: 0.7,
    }),
  );

  // Tools are the long-tail SEO surface: many low-volume pages that together
  // bring steady traffic. Given a higher priority than individual articles.
  const toolRoutes: MetadataRoute.Sitemap = tools.map((t) => ({
    url: `${base}/ferramentas/${t.slug}`,
    changeFrequency: "monthly",
    priority: t.featured ? 0.9 : 0.8,
  }));

  const postRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${base}/artigos/${p.slug}`,
    lastModified: new Date(p.updated ?? p.date),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    ...staticRoutes,
    ...categoryRoutes,
    ...toolCategoryRoutes,
    ...toolRoutes,
    ...postRoutes,
  ];
}
