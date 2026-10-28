"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ToolCard } from "@/components/ui";
import { tools, toolCategories, type ToolCategorySlug } from "@/lib/tools";
import { cn } from "@/lib/utils";

type Filter = "todos" | ToolCategorySlug;

/**
 * Client-side filtering over the full tool list.
 *
 * The page itself stays statically generated — every tool is present in the
 * initial HTML (good for crawlers and for no-JS users); the filter just hides
 * rows in the browser. Category filtering is additionally available as its own
 * crawlable route at /ferramentas/categoria/[slug].
 */
export function ToolBrowser() {
  const [filter, setFilter] = useState<Filter>("todos");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const map = { todos: tools.length } as Record<Filter, number>;
    for (const c of Object.values(toolCategories)) {
      map[c.slug as ToolCategorySlug] = tools.filter(
        (t) => t.category === c.slug,
      ).length;
    }
    return map;
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tools.filter((tool) => {
      if (filter !== "todos" && tool.category !== filter) return false;
      if (!q) return true;
      return (
        tool.name.toLowerCase().includes(q) ||
        tool.tagline.toLowerCase().includes(q) ||
        tool.keywords.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [filter, query]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar ferramenta…"
            aria-label="Buscar ferramenta"
            className="h-10 w-full rounded-lg border border-line bg-surface pl-10 pr-3 text-sm text-fg placeholder:text-subtle focus:border-brand focus:outline-none"
          />
        </div>

        <div
          role="group"
          aria-label="Filtrar por categoria"
          className="flex flex-wrap gap-2"
        >
          <FilterChip
            active={filter === "todos"}
            onClick={() => setFilter("todos")}
            label="Todas"
            count={counts.todos}
          />
          {Object.values(toolCategories).map((c) => (
            <FilterChip
              key={c.slug}
              active={filter === c.slug}
              onClick={() => setFilter(c.slug as ToolCategorySlug)}
              label={c.name}
              count={counts[c.slug as ToolCategorySlug] ?? 0}
            />
          ))}
        </div>
      </div>

      <p aria-live="polite" className="mb-4 text-xs text-subtle">
        {visible.length} {visible.length === 1 ? "ferramenta" : "ferramentas"}
        {filter !== "todos" &&
          ` em ${toolCategories[filter as ToolCategorySlug].name}`}
      </p>

      {visible.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-line px-6 py-12 text-center text-sm text-subtle">
          Nenhuma ferramenta encontrada para “{query}”.
        </p>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
        active
          ? "border-brand bg-brand/15 text-brand"
          : "border-line bg-surface text-muted hover:border-brand/50 hover:text-fg",
      )}
    >
      {label}
      <span className={cn("tabular-nums", active ? "text-brand" : "text-subtle")}>
        {count}
      </span>
    </button>
  );
}
