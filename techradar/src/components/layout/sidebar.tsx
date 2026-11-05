"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  BookOpen,
  FlaskConical,
  Code2,
  RefreshCw,
  TrendingUp,
  FolderKanban,
  Briefcase,
  Library,
  ListTodo,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Roadmap", href: "/roadmap", icon: Map },
  { name: "Caderno", href: "/caderno", icon: BookOpen },
  { name: "Laboratório", href: "/laboratorio", icon: FlaskConical },
  { name: "Exercícios", href: "/treino", icon: Code2 },
  { name: "Revisões", href: "/flashcards", icon: RefreshCw, badge: "reviews" as const },
  { name: "Evolução", href: "/evolucao", icon: TrendingUp },
  { name: "Projetos", href: "/projetos", icon: FolderKanban },
  { name: "Candidaturas", href: "/candidaturas", icon: Briefcase, badge: "applications" as const },
  { name: "Biblioteca", href: "/biblioteca", icon: Library },
  { name: "Tarefas", href: "/tarefas", icon: ListTodo, badge: "tasks" as const },
  { name: "Configurações", href: "/configuracoes", icon: Settings },
];

interface SidebarProps {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    role: string;
  };
  collapsed: boolean;
  mobileOpen: boolean;
  counts: { applications: number; tasks: number; reviews: number };
  weekPercent: number;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
}

export function Sidebar({
  user,
  collapsed,
  mobileOpen,
  counts,
  weekPercent,
  onToggleCollapse,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  function badgeValue(key: "applications" | "tasks" | "reviews") {
    const value = counts[key];
    return value > 99 ? "99+" : String(value);
  }

  return (
    <>
      {/* Overlay mobile */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-white/[0.06] bg-[#080d15]/95 backdrop-blur-xl transition-[width,transform] duration-300 ease-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0",
          collapsed ? "lg:w-[78px]" : "lg:w-[260px]"
        )}
        aria-label="Navegação principal"
      >
        {/* Marca */}
        <div
          className={cn(
            "flex h-16 shrink-0 items-center gap-3 border-b border-white/[0.06]",
            collapsed ? "lg:justify-center lg:px-2" : "px-4"
          )}
        >
          <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="DevPath Hub — início">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 text-slate-950 shadow-[0_10px_24px_-10px_rgba(34,211,238,0.8)]">
              <Code2 className="h-5 w-5" strokeWidth={2.4} />
            </span>
            <span className={cn("min-w-0", collapsed && "lg:hidden")}>
              <span className="flex items-baseline gap-1 text-[17px] font-bold leading-none tracking-tight">
                <span className="text-cyan-300">Dev</span>
                <span className="text-white">Path</span>
                <span className="text-violet-300">Hub</span>
              </span>
              <span className="mt-1 block text-[10px] uppercase tracking-[0.18em] text-slate-500">
                Do mecânico ao Full Stack
              </span>
            </span>
          </Link>

          <button
            type="button"
            onClick={onCloseMobile}
            className="ml-auto rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white lg:hidden"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p
            className={cn(
              "px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600",
              collapsed && "lg:hidden"
            )}
          >
            Navegação
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const badge = item.badge ? badgeValue(item.badge) : null;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.name : undefined}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-gradient-to-r from-cyan-400/15 via-cyan-400/[0.06] to-transparent text-white"
                    : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100",
                  collapsed && "lg:justify-center lg:px-0"
                )}
              >
                <span
                  className={cn(
                    "absolute left-0 top-1/2 h-6 w-[2px] -translate-y-1/2 rounded-full bg-cyan-400 transition-opacity",
                    active ? "opacity-100" : "opacity-0"
                  )}
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                    active
                      ? "bg-cyan-400/10 text-cyan-300"
                      : "bg-white/[0.03] text-slate-400 group-hover:text-slate-200"
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
                </span>

                <span className={cn("flex-1 truncate", collapsed && "lg:hidden")}>{item.name}</span>

                {badge && Number(badge) > 0 && (
                  <>
                    <span
                      className={cn(
                        "hidden rounded-md border border-white/10 bg-white/[0.05] px-1.5 py-0.5 text-[10px] font-semibold text-slate-300 min-[380px]:inline",
                        collapsed && "lg:hidden"
                      )}
                    >
                      {badge}
                    </span>
                    <span
                      className={cn(
                        "absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-cyan-400",
                        collapsed ? "lg:block" : "lg:hidden"
                      )}
                      aria-hidden="true"
                    />
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Admin (apenas visível para administradores) */}
        {user.role === "ADMIN" && (
          <Link
            href="/admin"
            title={collapsed ? "Admin" : undefined}
            aria-current={pathname === "/admin" ? "page" : undefined}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
              pathname === "/admin"
                ? "bg-gradient-to-r from-cyan-400/15 via-cyan-400/[0.06] to-transparent text-white"
                : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100",
              collapsed && "lg:justify-center lg:px-0"
            )}
          >
            <span
              className="absolute left-0 top-1/2 h-6 w-[2px] -translate-y-1/2 rounded-full bg-cyan-400 transition-opacity"
              aria-hidden="true"
            />
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors"
            >
              <Shield className="h-[18px] w-[18px]" strokeWidth={1.9} />
            </span>
            <span className={cn("flex-1 truncate", collapsed && "lg:hidden")}>
              Admin
            </span>
          </Link>
        )}
        
        {/* Card motivacional + progresso semanal */}
        <div className={cn("p-3", collapsed && "lg:hidden")}>
          <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-br from-cyan-400/[0.08] via-transparent to-violet-500/[0.08] p-4">
            <Sparkles className="mb-2 h-4 w-4 text-cyan-300" />
            <p className="text-sm font-semibold leading-snug text-slate-100">
              Disciplina hoje,
              <br />
              liberdade amanhã.
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
              Cada linha de código te aproxima do seu objetivo.
            </p>
            <div className="mt-3">
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>Meta semanal</span>
                <span className="font-semibold text-cyan-300">{weekPercent}%</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="progress-bar h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400"
                  style={{ width: `${weekPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Recolher (desktop) */}
        <div className="hidden border-t border-white/[0.06] p-3 lg:block">
          <button
            type="button"
            onClick={onToggleCollapse}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 transition-colors hover:bg-white/[0.04] hover:text-slate-200",
              collapsed && "lg:justify-center lg:px-0"
            )}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>Recolher menu</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
