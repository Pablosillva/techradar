"use client";

import { useState } from "react";
import {
  ArrowRight,
  Cloud,
  Activity,
  BarChart3,
  ChevronRight,
  Play,
  Clock,
  GitBranch,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LabProject, ModuleCategory } from "@/lib/study/types";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  "not-started": { label: "Não Iniciado", color: "text-slate-400", bg: "bg-slate-500/10" },
  "in-progress": { label: "Em Andamento", color: "text-amber-400", bg: "bg-amber-400/10" },
  "completed": { label: "Concluído", color: "text-emerald-400", bg: "bg-emerald-400/10" },
  started: { label: "Iniciado", color: "text-cyan-400", bg: "bg-cyan-400/10" },
};

interface LabRightPanelProps {
  projects: LabProject[];
  activeProjectId: string | null;
  setActiveProject: (projectId: string) => void;
  totalProgress: number;
  metrics: any;
  categoryProgress: (category: ModuleCategory) => number;
  pendingReviewsCount: number;
}

export function LabRightPanel({ projects, activeProjectId, setActiveProject, totalProgress, metrics, categoryProgress, pendingReviewsCount }: LabRightPanelProps) {
  const [expandedFilters, setExpandedFilters] = useState(true);

  return (
    <div className="w-80 shrink-0 border-l border-white/[0.06] bg-[#0f172a]/80 backdrop-blur flex flex-col z-10">
      {/* Cabeçalho do painel */}
      <div className="p-4 border-b border-white/[0.06]">
        <h2 className="text-sm font-semibold text-white mb-2">Projetos e Atividades</h2>
        <p className="text-xs text-slate-500">Seus projetos de laboratório em andamento</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Cards de projetos */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">Meus Projetos</h3>
          {projects.map((project) => {
            const status = STATUS_CONFIG[project.status] ?? STATUS_CONFIG["not-started"];
            const isActive = project.id === activeProjectId;
            return (
              <div
                key={project.id}
                onClick={() => setActiveProject(project.id)}
                className={cn(
                  "rounded-xl border p-3 transition-all hover:bg-white/[0.03] hover:border-white/[0.1] cursor-pointer",
                  isActive
                    ? "bg-cyan-400/10 border-cyan-400/20"
                    : "border-transparent",
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded bg-white/[0.05] flex items-center justify-center">
                      {project.category === "devops" ? (
                        <Cloud className="h-4 w-4 text-cyan-400" />
                      ) : project.category === "web-development" ? (
                        <GitBranch className="h-4 w-4 text-blue-400" />
                      ) : (
                        <Activity className="h-4 w-4 text-purple-400" />
                      )}
                    </div>
                    <div>
                      <h5 className="text-sm font-semibold text-white truncate">{project.title}</h5>
                      <p className="text-[10px] text-slate-500 truncate">{project.description}</p>
                    </div>
                  </div>
                  <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold", status.bg, status.color)}>
                    {status.label}
                  </span>
                </div>

                <div className="w-full bg-white/[0.05] rounded-full h-1.5 mb-2 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      project.progress >= 100
                        ? "bg-emerald-400"
                        : project.progress > 0
                          ? "bg-gradient-to-r from-cyan-400 to-violet-500"
                          : "bg-amber-400",
                    )}
                    style={{ width: `${project.progress}%` }}
                  />
                </div>

                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400">{project.progress}% concluído</span>
                  <button
                    className="px-2 py-1 text-cyan-400 text-xs hover:bg-cyan-400/10 rounded border border-cyan-400/20"
                  >
                    <Play className="h-3 w-3 mr-1" /> Ver Módulo
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Seu Aprendizado */}
        <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">Your Learning Status</h3>

          <div className="mb-4">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Milestone Progress</h4>
            <div className="relative w-40 h-40 mx-auto mb-2">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="100" cy="100" r="80" stroke="white/[0.06]" strokeWidth="10" fill="none" />
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  stroke="url(#milestoneGradient)"
                  strokeWidth="10"
                  fill="none"
                  strokeDasharray="503"
                  strokeDashoffset={503 - (503 * totalProgress) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="milestoneGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-white">{totalProgress}%</span>
                <span className="text-xs text-slate-500">milestone</span>
              </div>
            </div>
          </div>

          <div className="border-t border-white/[0.05] pt-4">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">Top Tech for Path</h4>
            <div className="flex items-end gap-3 h-24">
              {[
                { name: "Easy", value: 75, color: "#22c55e" },
                { name: "Medium", value: 50, color: "#06b6d4" },
                { name: "Hard", value: 30, color: "#a855f7" },
              ].map((item) => (
                <div key={item.name} className="flex flex-col items-center gap-1">
                  <div
                    className="w-16 rounded-t bg-gradient-to-t from-transparent to-current"
                    style={{ height: `${item.value}%`, backgroundColor: item.color }}
                  />
                  <span className="text-[10px] text-slate-400">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-white/[0.05] pt-4 mt-4">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">Revisões Pendentes</h4>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">{pendingReviewsCount}</span>
              <button className="px-2 py-1 text-[10px] text-cyan-400 hover:bg-cyan-400/10 rounded">
                Ver todas
              </button>
            </div>
          </div>

          <div className="border-t border-white/[0.05] pt-4 mt-4">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">Path Breakdown</h4>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-slate-400">Full-Stack Developer Path</span>
              <span className="text-white">{totalProgress}%</span>
            </div>
            <div className="h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-violet-500"
                style={{ width: `${totalProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
