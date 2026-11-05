import Link from "next/link";
import { ChevronRight, FolderKanban } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardProject } from "@/lib/dashboard";

interface ProjectsPanelProps {
  projects: DashboardProject[];
}

const STATUS_VARIANT = {
  PLANNING: "secondary",
  IN_PROGRESS: "default",
  REVIEW: "warning",
  DONE: "success",
  PAUSED: "outline",
} as const;

function MiniRing({ value }: { value: number }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, value)) / 100) * circumference;

  return (
    <div className="relative h-12 w-12 shrink-0">
      <svg viewBox="0 0 48 48" className="h-12 w-12 -rotate-90" aria-hidden="true">
        <circle cx="24" cy="24" r={radius} fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth="4" />
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke="#22d3ee"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-200">
        {value}%
      </span>
    </div>
  );
}

export function ProjectsPanel({ projects }: ProjectsPanelProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <FolderKanban className="h-4 w-4 text-violet-300" />
          Projetos em Andamento
        </CardTitle>
        <Link href="/projetos" className="text-[11px] font-medium text-cyan-300 hover:text-cyan-200">
          Ver todos →
        </Link>
      </CardHeader>

      <CardContent className="space-y-2 pt-0">
        {projects.length === 0 ? (
          <p className="py-3 text-center text-xs text-slate-500">
            Nenhum projeto cadastrado.{" "}
            <Link href="/projetos" className="text-cyan-300 hover:underline">
              Criar projeto
            </Link>
          </p>
        ) : (
          projects.map((project) => (
            <Link
              key={project.id}
              href="/projetos"
              className="flex items-center gap-3 rounded-lg border border-white/[0.04] bg-white/[0.02] p-2.5 transition-colors hover:border-violet-400/20 hover:bg-white/[0.04]"
            >
              <MiniRing value={project.progress} />

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-slate-200">{project.title}</p>
                <p className="truncate text-[10px] text-slate-500">
                  {project.techStack.length > 0 ? project.techStack.join(" • ") : "Sem stack definida"}
                </p>
                <Badge
                  variant={STATUS_VARIANT[project.status as keyof typeof STATUS_VARIANT] ?? "secondary"}
                  className="mt-1"
                >
                  {project.statusLabel}
                </Badge>
              </div>

              <ChevronRight className="h-4 w-4 shrink-0 text-slate-600" />
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
