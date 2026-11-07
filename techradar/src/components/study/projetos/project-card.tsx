"use client";

import Link from "next/link";
import {
  GitBranch,
  CheckCircle2,
  Target,
  Pencil,
  FlaskConical,
  Star,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PortfolioProject, ProjectCover } from "@/lib/study/types";

export interface ProjectCardProps {
  project: PortfolioProject;
  onEdit: (project: PortfolioProject) => void;
  onToggleHighlight: (id: string) => void;
  onToggleReview: (id: string) => void;
  onOpenLab: (project: PortfolioProject) => void;
}

const COVER_BG: Record<ProjectCover, string> = {
  portfolio: "bg-gradient-to-br from-cyan-500/20 via-teal-500/10 to-emerald-500/20",
  aws: "bg-gradient-to-br from-orange-500/20 via-amber-500/10 to-yellow-500/20",
  ecommerce: "bg-gradient-to-br from-violet-500/20 via-purple-500/10 to-indigo-500/20",
  python: "bg-gradient-to-br from-yellow-500/20 via-lime-500/10 to-emerald-500/20",
  api: "bg-gradient-to-br from-blue-500/20 via-cyan-500/10 to-teal-500/20",
  generic: "bg-gradient-to-br from-slate-500/20 via-slate-500/10 to-slate-500/20",
};

function CoverArt({ cover, title }: { cover: ProjectCover; title: string }) {
  return (
    <div className={cn("relative flex h-36 items-center justify-center overflow-hidden", COVER_BG[cover])}>
      <span className="text-4xl font-black tracking-tight text-white/90 drop-shadow">
        {cover === "aws" ? "aws" : cover === "python" ? "🐍" : title.slice(0, 8)}
      </span>
      {cover === "portfolio" && (
        <span className="absolute inset-x-6 bottom-4 h-16 rounded-lg border border-white/20 bg-[#0d1420]/70 p-2">
          <span className="block h-2 w-1/2 rounded bg-cyan-400/70" />
          <span className="mt-1.5 block h-1.5 w-3/4 rounded bg-white/20" />
          <span className="mt-1 block h-1.5 w-2/3 rounded bg-white/10" />
        </span>
      )}
      {cover === "aws" && <span className="absolute -bottom-2 right-4 text-6xl text-orange-500/40">↳</span>}
      {cover === "python" && <span className="absolute text-5xl">{"</>"}</span>}
    </div>
  );
}

export function ProjectCard({
  project,
  onEdit,
  onToggleHighlight,
  onToggleReview,
  onOpenLab,
}: ProjectCardProps) {
  const isCompleted = project.status === "completed" || project.progress >= 100;
  const barColor = isCompleted
    ? "from-emerald-400 to-green-500"
    : project.status === "idea"
      ? "from-slate-400 to-slate-500"
      : "from-cyan-400 to-violet-500";

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-[#0d1420] transition-all hover:border-cyan-400/20 hover:shadow-[0_16px_40px_-16px_rgba(6,182,212,0.25)]">
      <CoverArt cover={project.cover} title={project.title} />

      {/* Hover actions */}
      <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={() => onEdit(project)}
          title="Editar"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-black/60 text-slate-200 backdrop-blur hover:bg-cyan-500/20 hover:text-cyan-300"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onOpenLab(project)}
          title="Ver no Laboratório"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-black/60 text-slate-200 backdrop-blur hover:bg-cyan-500/20 hover:text-cyan-300"
        >
          <FlaskConical className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onToggleHighlight(project.id)}
          title={project.isHighlighted ? "Remover destaque" : "Marcar como destaque"}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg border backdrop-blur",
            project.isHighlighted
              ? "border-amber-400/40 bg-amber-400/20 text-amber-300"
              : "border-white/10 bg-black/60 text-slate-400 hover:text-amber-300",
          )}
        >
          <Star className={cn("h-3.5 w-3.5", project.isHighlighted && "fill-amber-300")} />
        </button>
        <button
          type="button"
          onClick={() => onToggleReview(project.id)}
          title={project.needsReview ? "Remover da revisão" : "Marcar para revisão"}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg border backdrop-blur",
            project.needsReview
              ? "border-cyan-400/40 bg-cyan-400/20 text-cyan-300"
              : "border-white/10 bg-black/60 text-slate-400 hover:text-cyan-300",
          )}
        >
          <Eye className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-bold text-white">{project.title}</h3>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{project.description}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            {isCompleted ? (
              <span className="flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                <CheckCircle2 className="h-3 w-3" /> Concluído 100%
              </span>
            ) : project.isHighlighted ? (
              <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                Em Destaque
              </span>
            ) : (
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                {project.status === "idea" ? "Em Ideia" : "Em Andamento"}
              </span>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {project.techs.map((tech) => (
            <span
              key={tech}
              className="flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-medium text-slate-300"
            >
              <Target className="h-2.5 w-2.5 text-cyan-400" />
              {tech}
            </span>
          ))}
        </div>

        <div className="mt-5 border-t border-white/[0.05] pt-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="flex items-center justify-center gap-1 text-xs font-semibold text-slate-200">
                <GitBranch className="h-3.5 w-3.5 text-cyan-400" />
                {project.commits}
              </div>
              <p className="mt-0.5 text-[10px] text-slate-500">Code Commits</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-xs font-semibold text-slate-200">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                {project.testsPassed}
              </div>
              <p className="mt-0.5 text-[10px] text-slate-500">Tests Passed</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-xs font-semibold text-slate-200">
                <Target className="h-3.5 w-3.5 text-violet-400" />
                {project.progress}%
              </div>
              <p className="mt-0.5 text-[10px] text-slate-500">Completo</p>
            </div>
          </div>

          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className={cn("h-full rounded-full bg-gradient-to-r transition-all", barColor)}
              style={{ width: `${project.progress}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">
              {project.progress >= 100 ? "Concluído" : project.progress >= 50 ? "50% Completo" : `${project.progress}% Completo`}
            </span>
            <span className="font-bold text-slate-200">{project.progress}%</span>
          </div>
        </div>

        {project.relatedLabProjectId && (
          <Link
            href="/laboratorio"
            className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] py-2 text-xs font-semibold text-cyan-400 transition-colors hover:border-cyan-400/30 hover:bg-cyan-400/10"
          >
            <FlaskConical className="h-3.5 w-3.5" />
            Continuar no Laboratório
          </Link>
        )}
      </div>
    </article>
  );
}
