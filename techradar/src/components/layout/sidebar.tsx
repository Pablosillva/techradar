"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  FlaskConical,
  Code2,
  RefreshCw,
  TrendingUp,
  Briefcase,
  User as UserIcon,
  Library,
  Calendar,
  Settings,
  ChevronRight,
  Menu,
  ArrowLeft,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Roadmap", href: "/roadmap", icon: FileText },
  { name: "Caderno", href: "/caderno", icon: BookOpen },
  { name: "Laboratório", href: "/laboratorio", icon: FlaskConical },
  { name: "Exercícios", href: "/treino", icon: Code2 },
  { name: "Revisões", href: "/flashcards", icon: RefreshCw },
  { name: "Evolução", href: "/evolucao", icon: TrendingUp },
  { name: "Projetos", href: "/projetos", icon: Briefcase },
  { name: "Candidaturas", href: "/candidaturas", icon: UserIcon },
  { name: "Biblioteca", href: "/biblioteca", icon: Library },
  { name: "Tarefas", href: "/tarefas", icon: Calendar },
  { name: "Configurações", href: "/configuracoes", icon: Settings },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps = {}) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [collapsedState, setCollapsedState] = useState(collapsed);

  useEffect(() => {
    setCollapsedState(collapsed);
  }, [collapsed]);

  const isCollapsed = collapsedState || isMobileOpen;

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 h-screen z-40 border-r border-gray-800 bg-[#0a0a0f] text-gray-300 flex flex-col transition-all duration-300",
          isMobileOpen
            ? "w-[280px] translate-x-0 md:translate-x-full"
            : isCollapsed
            ? "w-16"
            : "w-64"
        )}
        aria-label="Navegação principal"
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-5">
          {!isCollapsed && (
            <>
              <span className="text-blue-500">Dev</span>
              <span className="text-white font-bold text-lg">Path</span>
              <span className="text-blue-400 text-xs ml-1">Hub</span>
            </>
          )}
          <div className="ml-auto">
            {!isMobileOpen && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setCollapsedState(!collapsedState)}
                className="h-8 w-8 p-0"
              >
                {collapsedState ? (
                  <ChevronRight className="w-5 h-5" />
                ) : (
                  <ArrowLeft className="w-5 h-5" />
                )}
              </Button>
            )}
            {isMobileOpen && (
              <Button size="sm" variant="ghost" onClick={() => setIsMobileOpen(false)} className="h-8 w-8 p-0">
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 py-2">
            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">
              Navegação
            </p>
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = typeof window !== "undefined" ? window.location.pathname === item.href : false;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-500/10 text-white border-r-2 border-blue-500"
                    : "hover:bg-gray-800/50 hover:text-white"
                )}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-800/50">
                  <Icon className="w-5 h-5" />
                </div>
                {!isCollapsed && item.name}
              </Link>
            );
          })}
        </nav>

        {/* Profile */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800/50 cursor-pointer transition-colors">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
              P
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">Pablo Silva</p>
                <p className="text-xs text-gray-500 truncate">Em transição • Full Stack</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile hamburger trigger */}
      {!isMobileOpen && (
        <button
          className="fixed left-4 top-4 z-50 rounded-md p-2 bg-[#0a0a0f] border border-gray-700 text-gray-400 hover:text-white hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={() => setIsMobileOpen(true)}
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}
    </>
  );
}
