"use client";

import Link from "next/link";
import type { LabProject } from "@/lib/study/types";

const STATUS_LABEL: Record<LabProject["status"], string> = {
  "not-started": "Não iniciado",
  "in-progress": "Em andamento",
  completed: "Concluído",
};

export function ProjectBars({ projects }: { projects: LabProject[] }) {
  return (
    <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Desempenho nos Projetos
        </h3>
        <Link href="/laboratorio" className="text-[10px] font-semibold text-cyan-400 hover:text-cyan-300">
          Abrir Laboratório →
        </Link>
      </div>

      {projects.length === 0 ? (
        <p className="py-6 text-center text-xs text-slate-500">
          Nenhum projeto no laboratório. Crie um projeto em /laboratorio.
        </p>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => (
            <div key={project.id} className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-[11px] font-bold text-cyan-300">
                {project.title.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium text-slate-200">{project.title}</div>
                <div className="truncate text-[10px] text-slate-500">{project.description || "Sem descrição"}</div>
              </div>
              <div className="w-40 shrink-0">
                <div className="mb-1 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">{project.progress}%</span>
                  <span className={project.status === "completed" ? "text-emerald-400" : "text-cyan-300"}>
                    {STATUS_LABEL[project.status]}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-all"
                    style={{ width: `${Math.min(100, Math.max(0, project.progress))}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
