"use client";

import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { PostCard } from "@/components/post-card";
import type { PostMeta } from "@/lib/posts";
import { categories } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Article list with client-side search.
 *
 * The page ships every article in the static HTML; filtering happens in the
 * browser. The query string is kept in sync with `router.replace` so a search is
 * still a shareable, back-button-friendly URL — without opting the route out of
 * static rendering the way a server-side `searchParams` read would.
 */
export function ArticleBrowser({ posts }: { posts: PostMeta[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const queryParam = searchParams.get("q") ?? "";
  const [draft, setDraft] = useState(queryParam);
  const q = queryParam.trim().toLowerCase();

  function update(next: string) {
    setDraft(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set("q", next);
    else params.delete("q");
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  const results = useMemo(() => {
    if (!q) return posts;
    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q),
    );
  }, [posts, q]);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle"
            aria-hidden="true"
          />
          <input
            type="search"
            value={draft}
            onChange={(e) => update(e.target.value)}
            placeholder="Buscar por título, tema ou tag…"
            aria-label="Buscar artigos"
            className="h-11 w-full rounded-xl border border-line bg-surface pl-10 pr-10 text-sm text-fg placeholder:text-subtle focus:border-brand focus:outline-none"
          />
          {draft && (
            <button
              type="button"
              onClick={() => update("")}
              aria-label="Limpar busca"
              className="absolute right-3 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-subtle hover:bg-surface-2 hover:text-fg"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <nav aria-label="Filtrar por categoria">
          <ul className="flex flex-wrap gap-2">
            <li>
              <span className="inline-flex items-center rounded-full border border-brand bg-brand/15 px-3 py-1.5 text-xs font-semibold text-brand">
                Todos ({posts.length})
              </span>
            </li>
            {categories.map((c) => {
              const count = posts.filter((p) => p.category === c.slug).length;
              if (!count) return null;
              return (
                <li key={c.slug}>
                  <a
                    href={`/categorias/${c.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-brand/50 hover:text-brand"
                  >
                    {c.name}
                    <span className="tabular-nums text-subtle">{count}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <p aria-live="polite" className="mb-4 text-xs text-subtle">
        {isPending
          ? "Buscando…"
          : `${results.length} ${results.length === 1 ? "artigo" : "artigos"}${
              q ? ` para “${queryParam}”` : ""
            }`}
      </p>

      {results.length > 0 ? (
        <ul
          className={cn(
            "grid gap-5 sm:grid-cols-2 lg:grid-cols-3",
            isPending && "opacity-60 transition-opacity",
          )}
        >
          {results.map((post) => (
            <li key={post.slug} className="flex">
              <div className="flex w-full">
                <PostCard post={post} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed border-line px-6 py-16 text-center">
          <p className="text-sm font-semibold text-fg">
            Nenhum artigo encontrado para “{queryParam}”.
          </p>
          <p className="mt-1 text-sm text-muted">
            Tente outro termo ou navegue pelas categorias acima.
          </p>
        </div>
      )}
    </div>
  );
}
