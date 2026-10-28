import Link from "next/link";
import { Clock, MessageCircle } from "lucide-react";
import type { PostMeta } from "@/lib/posts";
import { categories, relativeTime } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Deterministic cover art for an article.
 *
 * The site has no uploaded images yet, and pointing at remote placeholders
 * would mean third-party requests and broken cards while the content is being
 * written. This renders a themed gradient keyed off the slug instead, so every
 * post looks intentional and the layout never shifts. Replace with a real
 * `<Image>` once covers exist — the component already takes precedence when a
 * post defines `image` in its frontmatter.
 */
export function PostCover({
  post,
  className,
}: {
  post: PostMeta;
  className?: string;
}) {
  if (post.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={post.image}
        alt=""
        className={cn("h-full w-full object-cover", className)}
        loading="lazy"
      />
    );
  }

  const accent = categories.find((c) => c.slug === post.category)?.accent ?? "#3b8dff";
  const angle = hash(post.slug) % 360;
  const initial = post.title.trim().charAt(0).toUpperCase();

  return (
    <div
      className={cn("relative h-full w-full overflow-hidden", className)}
      style={{
        background: `linear-gradient(${angle}deg, color-mix(in oklab, ${accent} 28%, #0b1220) 0%, #0b1220 70%)`,
      }}
      aria-hidden="true"
    >
      {/* Soft glow + a large ghosted initial, purely decorative. */}
      <div
        className="absolute -right-6 -top-6 size-28 rounded-full blur-2xl"
        style={{ background: accent, opacity: 0.35 }}
      />
      <span
        className="absolute bottom-1 right-3 font-mono text-6xl font-bold opacity-15"
        style={{ color: accent }}
      >
        {initial}
      </span>
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          color: "#ffffff",
        }}
      />
    </div>
  );
}

function hash(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) {
    h = (h << 5) - h + value.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function CategoryBadge({ category }: { category: string }) {
  const cat = categories.find((c) => c.slug === category);
  if (!cat) return null;
  return (
    <Link
      href={`/categorias/${cat.slug}`}
      className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/55 px-2.5 py-0.5 text-[11px] font-bold text-white backdrop-blur-sm transition-colors hover:bg-black/75"
    >
      {cat.name}
    </Link>
  );
}

export function PostCard({ post }: { post: PostMeta }) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface transition-colors hover:border-brand/50">
      <div className="relative h-36 shrink-0 overflow-hidden sm:h-40">
        <PostCover post={post} />
        <CategoryBadge category={post.category} />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-[15px] font-bold leading-snug text-fg">
          {/* Stretched link makes the whole card clickable while keeping one
              focusable link for keyboard and screen-reader users. */}
          <Link href={`/artigos/${post.slug}`} className="after:absolute after:inset-0">
            {post.title}
          </Link>
        </h3>
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted">
          {post.description}
        </p>

        <div className="mt-auto flex items-center gap-4 pt-3 text-[11px] text-subtle">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" aria-hidden="true" />
            {post.readingTime} min
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="size-3" aria-hidden="true" />
            {post.views ?? 0}
          </span>
          <time dateTime={post.date} className="ml-auto">
            {relativeTime(post.date)}
          </time>
        </div>
      </div>
    </article>
  );
}
