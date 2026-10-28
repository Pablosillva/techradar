import fs from "node:fs";
import path from "node:path";

/**
 * Article loading for the MDX content in `src/content/posts`.
 *
 * Frontmatter is not read from disk with a YAML parser. Instead the
 * `remark-mdx-frontmatter` plugin (see next.config.ts) lifts the YAML block into
 * a named `frontmatter` export on the compiled module, so metadata travels with
 * the module itself and stays in one place.
 *
 * Everything here runs on the server only: `fs` at build time, and MDX modules
 * imported into Server Components.
 */

const POSTS_DIR = path.join(process.cwd(), "src", "content", "posts");

export type PostMeta = {
  slug: string;
  title: string;
  description: string;
  /** ISO date (YYYY-MM-DD) — strings keep output deterministic across timezones. */
  date: string;
  updated?: string;
  category: string;
  tags: string[];
  featured?: boolean;
  /** Optional cover image path under /public. */
  image?: string;
  /** Optional social proof metric shown on cards. Defaults to 0. */
  views?: number;
  /** Estimated reading time in minutes, derived from the raw markdown. */
  readingTime: number;
};

/** Shape of the `frontmatter` export produced by remark-mdx-frontmatter. */
type Frontmatter = Partial<Omit<PostMeta, "slug" | "readingTime">> & {
  tags?: string[] | string;
};

export function getPostSlugs(): string[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs
    .readdirSync(POSTS_DIR)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => file.replace(/\.mdx$/, ""));
}

function readingTimeFor(slug: string): number {
  try {
    const raw = fs.readFileSync(path.join(POSTS_DIR, `${slug}.mdx`), "utf8");
    // Strip frontmatter and code fences so they don't inflate the estimate.
    const body = raw.replace(/^---[\s\S]*?---/, "").replace(/```[\s\S]*?```/g, "");
    const words = body.split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 200));
  } catch {
    return 1;
  }
}

/**
 * Imports one MDX module. Kept in one place so the path form stays consistent.
 * The static `@/content/posts/` prefix is what lets the bundler turn this into a
 * lazy context that includes every article at build time.
 */
function importPost(slug: string) {
  return import(`@/content/posts/${slug}.mdx`);
}

function toMeta(slug: string, fm: Frontmatter): PostMeta {
  return {
    slug,
    title: fm.title ?? slug,
    description: fm.description ?? "",
    date: fm.date ?? "1970-01-01",
    updated: fm.updated,
    category: fm.category ?? "programacao",
    tags: Array.isArray(fm.tags) ? fm.tags : fm.tags ? [fm.tags] : [],
    featured: fm.featured,
    image: fm.image,
    views: fm.views ?? 0,
    readingTime: readingTimeFor(slug),
  };
}

/**
 * All posts, newest first. Imported modules are memoised because this runs once
 * per page that lists articles.
 */
const metaCache = new Map<string, PostMeta>();
const moduleCache = new Map<string, Promise<unknown>>();

export async function getAllPosts(): Promise<PostMeta[]> {
  const posts = await Promise.all(
    getPostSlugs().map(async (slug) => {
      const cached = metaCache.get(slug);
      if (cached) return cached;
      const mod = (await importPost(slug)) as { frontmatter?: Frontmatter };
      const meta = toMeta(slug, mod.frontmatter ?? {});
      metaCache.set(slug, meta);
      return meta;
    }),
  );

  return posts.sort((a, b) => b.date.localeCompare(a.date));
}

export async function getPostMeta(slug: string): Promise<PostMeta | undefined> {
  if (!getPostSlugs().includes(slug)) return undefined;
  const mod = (await importPost(slug)) as { frontmatter?: Frontmatter };
  return toMeta(slug, mod.frontmatter ?? {});
}

export type LoadedPost = { meta: PostMeta; Post: React.ComponentType };

/** Loads a post's frontmatter and its compiled MDX component together. */
export async function loadPost(slug: string): Promise<LoadedPost | undefined> {
  if (!getPostSlugs().includes(slug)) return undefined;

  let pending = moduleCache.get(slug);
  if (!pending) {
    pending = importPost(slug);
    moduleCache.set(slug, pending);
  }
  const mod = (await pending) as {
    default: React.ComponentType;
    frontmatter?: Frontmatter;
  };

  return { meta: toMeta(slug, mod.frontmatter ?? {}), Post: mod.default };
}

export async function getPostsByCategory(category: string): Promise<PostMeta[]> {
  const posts = await getAllPosts();
  return posts.filter((p) => p.category === category);
}

export async function getFeaturedPosts(limit = 5): Promise<PostMeta[]> {
  const posts = await getAllPosts();
  const featured = posts.filter((p) => p.featured);
  // Fall back to the newest posts so the homepage is never empty.
  return (featured.length ? featured : posts).slice(0, limit);
}

/** Related posts: same category first, then anything else, newest first. */
export async function getRelatedPosts(
  post: PostMeta,
  limit = 3,
): Promise<PostMeta[]> {
  const posts = await getAllPosts();
  const others = posts.filter((p) => p.slug !== post.slug);
  const sameCategory = others.filter((p) => p.category === post.category);
  const rest = others.filter((p) => p.category !== post.category);
  return [...sameCategory, ...rest].slice(0, limit);
}
