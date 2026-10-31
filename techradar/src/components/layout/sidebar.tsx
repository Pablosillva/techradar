"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Roadmap", href: "/roadmap", icon: FileText },
  { name: "Notas", href: "/notas", icon: BookOpen },
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

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-64 border-r border-gray-800 bg-[#0a0a0f] text-gray-300 z-40 flex flex-col"
      aria-label="Navegação principal"
    >
      <div className="flex items-center gap-2 px-5 py-6">
        <span className="text-blue-500">Dev</span
        ><span className="text-white font-bold text-lg">Path</span>
        <span className="text-blue-400 text-xs ml-1">Hub</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
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
              <Icon className="w-5 h-5" />
              {item.name}
              {isActive && (
                <ChevronRight className="ml-auto w-3 h-3 text-blue-400" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800/50 cursor-pointer transition-colors">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
            P
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">Pablo Silva</p>
            <p className="text-xs text-gray-500 truncate">Em transição • Full Stack</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
