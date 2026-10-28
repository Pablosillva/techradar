"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";

/**
 * Search form. Submits to /artigos?q=… so results are a real, shareable,
 * indexable-on-demand URL rather than client-only state.
 */
export function SearchBox({
  placeholder = "O que você quer aprender hoje?",
  cta = "Buscar",
  defaultValue = "",
  className = "",
  autoFocus = false,
}: {
  placeholder?: string;
  cta?: string;
  defaultValue?: string;
  className?: string;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? `/artigos?q=${encodeURIComponent(q)}` : "/artigos");
  }

  return (
    <form onSubmit={onSubmit} role="search" className={className}>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-subtle"
            aria-hidden="true"
          />
          <input
            type="search"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
            autoFocus={autoFocus}
            className="h-11 w-full rounded-xl border border-line bg-bg-elevated pl-11 pr-4 text-sm text-fg placeholder:text-subtle transition-colors focus:border-brand focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-strong"
        >
          <Search className="size-4 sm:hidden" aria-hidden="true" />
          {cta}
        </button>
      </div>
    </form>
  );
}
