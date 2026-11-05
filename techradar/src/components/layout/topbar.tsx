"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, ChevronDown, LogOut, Menu, Search, Settings, UserRound } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { cn } from "@/lib/utils";

interface TopbarProps {
  user: {
    name: string;
    email: string;
    image: string | null;
    role: string;
  };
  notifications: Array<{ label: string; href: string }>;
  onOpenMenu: () => void;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function Topbar({ user, notifications, onOpenMenu }: TopbarProps) {
  const searchRef = useRef<HTMLInputElement>(null);

  // Atalho "/" para focar a busca global (igual ao layout de referência).
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (event.key === "/" && !isTyping) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-white/[0.06] bg-[#070b12]/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onOpenMenu}
        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white lg:hidden"
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Busca global */}
      <form action="/busca" role="search" className="relative min-w-0 flex-1 md:max-w-[560px]">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          ref={searchRef}
          type="search"
          name="q"
          placeholder="Buscar aulas, tecnologias, projetos, tarefas..."
          aria-label="Busca global"
          className="h-10 w-full rounded-xl border border-white/[0.06] bg-white/[0.03] pl-10 pr-12 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus:border-cyan-500/40 focus:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-cyan-500/15"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-medium text-slate-500 sm:block">
          /
        </kbd>
      </form>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        {/* Notificações */}
        <details className="group relative">
          <summary
            className="relative flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white [&::-webkit-details-marker]:hidden"
            aria-label="Notificações"
          >
            <Bell className="h-5 w-5" />
            {notifications.length > 0 && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-cyan-400 ring-2 ring-[#070b12]" />
            )}
          </summary>
          <div className="absolute right-0 top-12 w-72 overflow-hidden rounded-xl border border-white/10 bg-[#0d1420] shadow-2xl">
            <div className="border-b border-white/[0.06] px-4 py-3">
              <p className="text-sm font-semibold text-white">Notificações</p>
              <p className="text-[11px] text-slate-500">Atualizações do seu progresso</p>
            </div>
            {notifications.length === 0 ? (
              <p className="px-4 py-5 text-sm text-slate-400">Tudo em dia por aqui. 🎉</p>
            ) : (
              <ul className="divide-y divide-white/[0.04]">
                {notifications.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 transition-colors hover:bg-white/[0.04] hover:text-white"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </details>

        {/* Perfil */}
        <details className="group relative">
          <summary
            className="flex cursor-pointer list-none items-center gap-2.5 rounded-xl py-1 pl-1 pr-2 transition-colors hover:bg-white/[0.04] [&::-webkit-details-marker]:hidden"
            aria-label="Menu do usuário"
          >
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt={`Avatar de ${user.name}`}
                className="h-9 w-9 rounded-full object-cover ring-2 ring-cyan-400/25"
              />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 text-xs font-bold text-slate-950 ring-2 ring-cyan-400/20">
                {initials(user.name) || "DP"}
              </span>
            )}
            <span className="hidden flex-col text-left sm:flex">
              <span className="max-w-[140px] truncate text-sm font-semibold text-white">
                {user.name}
              </span>
              <span className="text-[11px] text-slate-500">
                {user.role === "ADMIN" ? "Administrador" : "Em transição • Full Stack"}
              </span>
            </span>
            <ChevronDown className="h-4 w-4 text-slate-500 transition-transform group-open:rotate-180" />
          </summary>

          <div className="absolute right-0 top-12 w-56 overflow-hidden rounded-xl border border-white/10 bg-[#0d1420] shadow-2xl">
            <div className="border-b border-white/[0.06] px-4 py-3">
              <p className="truncate text-sm font-medium text-white">{user.name}</p>
              <p className="truncate text-[11px] text-slate-500">{user.email}</p>
            </div>
            <Link
              href="/perfil"
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-white/[0.04] hover:text-white"
            >
              <UserRound className="h-4 w-4" /> Meu perfil
            </Link>
            <Link
              href="/configuracoes"
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-white/[0.04] hover:text-white"
            >
              <Settings className="h-4 w-4" /> Configurações
            </Link>
            <form action={logoutAction} className="border-t border-white/[0.06]">
              <button
                type="submit"
                className={cn(
                  "flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-300 transition-colors",
                  "hover:bg-rose-500/10 hover:text-rose-300"
                )}
              >
                <LogOut className="h-4 w-4" /> Sair
              </button>
            </form>
          </div>
        </details>
      </div>
    </header>
  );
}
