"use client";

import { useState } from "react";
import {
  Search,
  Play,
  Lock,
  CheckCircle2,
  PlayCircle,
  ArrowRight,
  RefreshCw,
  Menu,
  X,
  FileText,
  Code,
  TrendingUp,
  FolderKanban,
  Briefcase,
  Library,
  ListTodo,
  Settings,
  LayoutDashboard,
  Map as MapIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStudy } from "@/lib/study/context";
import type { ModuleCategory, Module, Lesson } from "@/lib/study/types";
import { CATEGORY_LABELS, STATUS_LABELS } from "@/lib/study/types";
import LessonModal from "./lesson-modal";

export default function ContentPage() {
  const {
    modules,
    roadmapNodes,
    lessonsCompleted: lessonsCompletedArray,
    timeSpent,
    modulesByCategory,
    moduleById,
    nodeById,
    lessonsForModule,
    isModuleLocked,
    categoryProgress,
    pendingReviewsCount,
    completeLesson,
    uncompleteLesson,
    startTimer,
    stopTimer,
  } = useStudy();

  const lessonsCompleted = lessonsCompletedArray.length;
  const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const totalStudyMinutes = Math.round(
    Object.values(timeSpent).reduce((a, b) => a + b, 0) / 60
  );

  const timeSpentByCategory: Record<string, number> = {
    "web-development": 0,
    "mobile-dev": 0,
    devops: 0,
    "cloud-computing": 0,
    "data-science": 0,
  };
  for (const m of modules) {
    timeSpentByCategory[m.category] += timeSpent[m.id] ?? 0;
  }

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<ModuleCategory | null>("web-development");
  const [filters, setFilters] = useState({
    status: "todos",
    type: "todos",
  });
  const [lessonModal, setLessonModal] = useState<{ module: Module; lesson: Lesson } | null>(null);

  const STATUS_FILTERS: Array<[string, string]> = [
    ["todos", "Todos"],
    ["concluidos", "Concluídos"],
    ["andamento", "Em Andamento"],
    ["nao-iniciados", "Não Iniciados"],
  ];

  const filteredModules = modules
    .filter((m) => {
      if (activeCategory && m.category !== activeCategory) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return m.title.toLowerCase().includes(q) || m.lessons.some((l) => l.title.toLowerCase().includes(q));
      }
      return true;
    })
    .filter((m) => {
      if (filters.status === "concluidos") return m.progress === 100;
      if (filters.status === "andamento") return m.progress > 0 && m.progress < 100;
      if (filters.status === "nao-iniciados") return m.progress === 0;
      return true;
    });

  const nodeForModule = (module: Module) => nodeById(module.roadmapNodeId);

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-300 overflow-hidden">
      {/* ============ SIDEBAR ESQUERDA ============ */}
      <aside className="w-64 shrink-0 border-r border-white/[0.06] bg-[#0f172a]/80 backdrop-blur flex flex-col z-20">
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-white/[0.06] px-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 text-slate-950 shadow-[0_10px_24px_-10px_rgba(34,211,238,0.8)]">
            <Search className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="text-sm font-bold leading-none tracking-tight">
              <span className="text-cyan-300">Dev</span>
              <span className="text-white">Path</span>
              <span className="text-violet-300">Hub</span>
            </span>
            <span className="mt-0.5 block text-[10px] uppercase tracking-[0.18em] text-slate-500">
              Conteúdo de Estudo
            </span>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Navegação</p>
          {navItem("Dashboard", LayoutDashboard)}
          {navItem("Roadmap", MapIcon)}
          {navItem("Conteúdo", FileText, true)}
          {navItem("Exercícios", Code)}
          {navItem("Revisões", RefreshCw)}
          {navItem("Evolução", TrendingUp)}
          {navItem("Projetos", FolderKanban)}
          {navItem("Candidaturas", Briefcase)}
          {navItem("Biblioteca", Library)}
          {navItem("Tarefas", ListTodo)}
          {navItem("Configurações", Settings)}
        </nav>
      </aside>

      {/* ============ CONTEÚDO PRINCIPAL ============ */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 shrink-0 border-b border-white/[0.06] bg-[#0f172a]/80 backdrop-blur px-6 flex items-center justify-between">
          <div className="relative w-full md:w-[600px]">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar por categorias..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-white/[0.06] bg-white/[0.02] text-sm text-slate-200 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400 transition-colors placeholder-slate-500"
            />
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg text-slate-400 hover:bg-white/[0.04] hover:text-white transition-colors">
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex flex-col gap-8">
              {/* Tabs de categoria */}
              <div className="flex flex-wrap gap-2 mb-2">
                {["web-development", "mobile-dev", "devops", "cloud-computing", "data-science"].map((cat) => {
                  const active = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(active ? null : (cat as ModuleCategory))}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-all border-b-2",
                        active
                          ? "text-cyan-400 border-cyan-400 bg-white/[0.03]"
                          : "text-slate-400 border-transparent hover:text-slate-200",
                      )}
                    >
                      {CATEGORY_LABELS[cat as ModuleCategory]}
                    </button>
                  );
                })}
              </div>

              {/* Grid de módulos */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredModules.length === 0 ? (
                  <div className="col-span-full rounded-xl border border-dashed border-white/[0.08] bg-transparent p-16 text-center">
                    <p className="text-slate-500">Nenhum módulo encontrado.</p>
                  </div>
                ) : (
                  filteredModules.map((module) => (
                    <ModuleCard
                      key={module.id}
                      module={module}
                      node={nodeForModule(module)}
                      isLocked={isModuleLocked(module.id)}
                      lessons={lessonsForModule(module.id)}
                      onLessonToggle={(lessonId) => {
                        const lesson = lessonsForModule(module.id).find((l) => l.id === lessonId);
                        if (!lesson) return;
                        if (lesson.isCompleted) uncompleteLesson(module.id, lessonId);
                        else completeLesson(module.id, lessonId);
                      }}
                      onLessonClick={(lesson) => {
                        setLessonModal({ module, lesson });
                        startTimer(module.id);
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ============ PAINEL DIREITO (Your Learning Status) ============ */}
      <aside className="w-80 shrink-0 border-l border-white/[0.06] bg-[#0f172a]/80 backdrop-blur flex flex-col z-20">
        <div className="p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 mb-1">
            <Search className="h-4 w-4 text-slate-500" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Pesquisa Rápida em Notas</span>
          </div>
          <input
            type="text"
            placeholder="Buscar anotações..."
            className="w-full mt-2 h-9 pl-3 pr-3 rounded-lg border border-white/[0.06] bg-white/[0.02] text-xs text-slate-200 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400 transition-colors placeholder-slate-500"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Your Learning Status */}
          <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Your Learning Status</h3>

            <div className="mb-4">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Milestone Progress</h4>
              <div className="flex items-center justify-center">
                <div className="relative w-48 h-48">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="100" cy="100" r="80" stroke="white/[0.06]" strokeWidth="12" fill="none" />
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      stroke="url(#progressGradient)"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray="503"
                      strokeDashoffset={503 - (503 * lessonsCompleted) / Math.max(totalLessons, 1)}
                      strokeLinecap="round"
                      className="transition-all duration-700"
                    />
                    <defs>
                      <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#22c55e" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-white">{Math.round((lessonsCompleted / Math.max(totalLessons, 1)) * 100)}%</span>
                    <span className="text-xs text-slate-500">concluído</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 text-[10px] text-slate-400">
                {lessonsCompleted} de {totalLessons} aulas
              </div>
            </div>

            <div className="border-t border-white/[0.05] pt-4">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">Revisões Pendentes</h4>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">{pendingReviewsCount}</span>
                <button
                  onClick={() => {}}
                  className="px-2 py-1 rounded text-xs text-cyan-400 hover:bg-cyan-400/10"
                >
                  Ver todas
                </button>
              </div>
            </div>
          </div>

          {/* Categorias / Filtros */}
          <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-5">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">Categorias</h4>
            <div className="space-y-2">
              {["web-development", "mobile-dev", "devops", "cloud-computing", "data-science"].map((cat) => {
                const progress = categoryProgress(cat as ModuleCategory);
                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">{CATEGORY_LABELS[cat as ModuleCategory]}</span>
                      <span className="text-slate-200 font-medium">{progress}%</span>
                    </div>
                    <ProgressBar value={progress} color="cyan" className="h-1" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Time Spent */}
          <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-5">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">Time Spent</h4>
            <div className="space-y-2">
              {["web-development", "mobile-dev", "devops", "cloud-computing", "data-science"].map((cat) => {
                const seconds = timeSpentByCategory[cat as ModuleCategory];
                const m = Math.floor(seconds / 60);
                const s = seconds % 60;
                return (
                  <div key={cat} className="flex justify-between text-xs">
                    <span className="text-slate-400">{CATEGORY_LABELS[cat as ModuleCategory]}</span>
                    <span className="text-slate-200">{m}:{String(s).padStart(2, "0")}</span>
                  </div>
                );
              })}
              <div className="border-t border-white/[0.05] pt-2 mt-2 flex justify-between text-xs font-bold text-white">
                <span>Tempo Total</span>
                <span>{Math.floor(totalStudyMinutes / 60)}:{String(totalStudyMinutes % 60).padStart(2, "0")}</span>
              </div>
            </div>
          </div>

          {/* Filtros laterais (acordeão simples) */}
          <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-5">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">Filtros</h4>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">Status</label>
                <div className="space-y-1">
                  {STATUS_FILTERS.map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => setFilters((p) => ({ ...p, status: value }))}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-1.5 rounded border text-xs transition-colors",
                        filters.status === value
                          ? "bg-cyan-400/10 text-cyan-400 border-cyan-400/20"
                          : "text-slate-400 hover:bg-white/[0.03] hover:text-slate-200 border-transparent",
                      )}
                    >
                      <span>{label}</span>
                      {filters.status === value && <CheckCircle2 className="h-3 w-3 fill-current" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Modal de aula */}
      {lessonModal && (
        <LessonModal
          module={lessonModal.module}
          lesson={lessonModal.lesson}
          onClose={() => {
            setLessonModal(null);
            stopTimer();
          }}
          onComplete={() => {
            completeLesson(lessonModal.module.id, lessonModal.lesson.id);
          }}
        />
      )}
    </div>
  );
}

function navItem(label: string, Icon: React.ElementType, active = false) {
  return (
    <button
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
        active
          ? "bg-gradient-to-r from-cyan-400/15 via-cyan-400/[0.06] to-transparent text-white border border-cyan-400/20"
          : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100 border-transparent",
      )}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors">
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
      </span>
      <span className="flex-1 truncate">{label}</span>
    </button>
  );
}

function ProgressBar({ value, color = "cyan", className = "" }: { value: number; color?: string; className?: string }) {
  const colorMap: Record<string, string> = {
    cyan: "bg-gradient-to-r from-cyan-400 to-violet-500",
    green: "bg-gradient-to-r from-emerald-400 to-teal-400",
    amber: "bg-gradient-to-r from-amber-400 to-orange-400",
    rose: "bg-gradient-to-r from-rose-400 to-pink-400",
  };
  return (
    <div className={cn("w-full h-1.5 overflow-hidden rounded-full bg-white/[0.06]", className)}>
      <div
        className={cn(
          "h-full rounded-full transition-all duration-700 ease-out",
          colorMap[color] || colorMap.cyan,
        )}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

type ModuleCardProps = {
  module: Module;
  node: { id: string; title: string; status: string; progress: number } | undefined;
  isLocked: boolean;
  lessons: Lesson[];
  onLessonToggle: (lessonId: string) => void;
  onLessonClick: (lesson: Lesson) => void;
};

function ModuleCard({ module, node, isLocked, lessons, onLessonToggle, onLessonClick }: ModuleCardProps) {
  const status = module.progress === 100 ? "completo" : module.progress > 0 ? "em-andamento" : "não-iniciado";
  const statusConfig: Record<string, { label: string; bg: string; text: string; border: string }> = {
    completo: { label: "Completo", bg: "bg-emerald-400/10", text: "text-emerald-400", border: "border-emerald-400/20" },
    "em-andamento": { label: "Em Andamento", bg: "bg-amber-400/10", text: "text-amber-400", border: "border-amber-400/20" },
    "não-iniciado": { label: "Não Iniciado", bg: "bg-slate-500/10", text: "text-slate-500", border: "border-slate-500/20" },
  };
  const s = statusConfig[status];

  return (
    <div className={cn(
      "relative group rounded-xl border border-white/[0.05] bg-white/[0.02] p-4 transition-all hover:bg-white/[0.04] hover:border-white/[0.1]",
      isLocked ? "border-rose-500/20 opacity-80 grayscale" : "",
    )}>
      {isLocked && (
        <div className="absolute inset-0 rounded-xl bg-black/60 flex items-center justify-center">
          <Lock className="h-10 w-10 text-rose-400" />
          <span className="absolute bottom-4 text-[10px] font-bold text-rose-400 uppercase tracking-wider">Bloqueado</span>
        </div>
      )}

      <div className="relative z-10 mb-3">
        <div className="flex items-center gap-2 mb-1">
          {module.progress === 100 && (
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
          )}
          <h3 className="text-sm font-semibold text-white truncate">{module.title}</h3>
        </div>
        <p className="text-[10px] text-slate-500 truncate">{lessons.length} aula(s)</p>

        <div className="mt-2">
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-slate-500">Progresso</span>
            <span className="text-slate-400">{module.progress}%</span>
          </div>
          <ProgressBar value={module.progress} color="cyan" />
        </div>

        <div className="mt-3 space-y-1">
          {lessons.slice(0, 3).map((lesson) => (
            <button
              key={lesson.id}
              onClick={(e) => {
                e.stopPropagation();
                onLessonClick(lesson);
              }}
              className="w-full flex items-center justify-between px-2 py-1 rounded text-left text-xs transition-colors hover:bg-white/[0.03]"
            >
              <span className="truncate">{lesson.title}</span>
              {lesson.isCompleted ? (
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              ) : (
                <Play className="h-3 w-3 text-slate-500" />
              )}
            </button>
          ))}
          {lessons.length > 3 && (
            <button className="w-full flex items-center justify-center px-2 py-1 rounded text-xs text-slate-500 hover:bg-white/[0.03]">
              +{lessons.length - 3} mais
            </button>
          )}
        </div>
      </div>

      <button
        onClick={() => {
          const first = lessons[0];
          if (first) onLessonClick(first);
        }}
        className="w-full py-2 rounded-lg border text-xs font-semibold transition-all text-cyan-400 border-cyan-400/20 hover:bg-cyan-400/10"
        disabled={isLocked}
      >
        Acessar conteúdo
      </button>
    </div>
  );
}
