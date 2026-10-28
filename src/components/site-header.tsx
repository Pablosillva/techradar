import Link from "next/link";
import { mainNav } from "@/lib/site";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <Logo className="size-8" />
          <span className="flex flex-col leading-none">
            <span className="text-[17px] font-extrabold tracking-tight text-fg">
              Tech<span className="text-brand">Lab</span>
            </span>
            <span className="mt-0.5 hidden text-[10px] font-medium tracking-wide text-subtle sm:block">
              Tecnologia · IA · Programação
            </span>
          </span>
        </Link>

        <nav
          aria-label="Navegação principal"
          className="ml-2 hidden flex-1 items-center gap-0.5 lg:flex"
        >
          {mainNav.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/ferramentas"
            className="hidden h-9 items-center rounded-lg bg-surface-2 px-3 text-sm font-medium text-muted transition-colors hover:text-fg md:inline-flex"
          >
            <SearchGlyph />
            <span className="ml-2">Buscar no TechLab…</span>
          </Link>
          <ThemeToggle />
          <Link
            href="/entrar"
            className="hidden h-9 items-center px-3 text-sm font-semibold text-muted transition-colors hover:text-fg sm:inline-flex"
          >
            Entrar
          </Link>
          <Link
            href="/cadastrar"
            className="inline-flex h-9 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-strong"
          >
            Cadastrar
          </Link>
        </div>
      </div>

      {/* Mobile navigation: horizontally scrollable so it never wraps awkwardly. */}
      <nav
        aria-label="Navegação principal (mobile)"
        className="flex gap-1 overflow-x-auto border-t border-line px-4 py-2 lg:hidden"
      >
        {mainNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-fg"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-fg"
    >
      {label}
    </Link>
  );
}

function SearchGlyph() {
  return (
    <svg
      className="size-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
