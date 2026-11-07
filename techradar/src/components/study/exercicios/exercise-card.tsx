"use client";

import { useState } from "react";
import { Play, ArrowRight, Clock, Database, Flame, ShieldAlert, RefreshCw, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExerciseChallenge } from "@/lib/study/types";

interface ExerciseCardProps {
  exercise: ExerciseChallenge;
  isActive: boolean;
  onOpen: () => void;
  difficultyLabels: Record<string, string>;
  difficultyColors: Record<string, string>;
}

export function ExerciseCard({
  exercise,
  isActive,
  onOpen,
  difficultyLabels,
  difficultyColors,
}: ExerciseCardProps) {
  const [hovered, setHovered] = useState(false);

  const statusLabels: Record<string, { label: string; color: string }> = {
    "not-started": { label: "Não Iniciado", color: "text-slate-400" },
    "in-progress": { label: "Em Andamento", color: "text-amber-400" },
    completed: { label: "Concluído", color: "text-emerald-400" },
  };

  const typeIcons: Record<string, typeof Flame> = {
    algorithm: Flame,
    coding: Database,
    database: Database,
    "system-design": ShieldAlert,
  };

  const Icon = typeIcons[exercise.type] || Flame;
  const status = statusLabels[exercise.status];
  const diffColor = difficultyColors[exercise.difficulty] || "text-slate-400 border-slate-400/20 bg-slate-400/10";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "group relative rounded-xl border p-5 transition-all duration-200 hover:bg-white/[0.03] hover:border-white/[0.1] cursor-pointer",
        isActive ? "bg-cyan-400/10 border-cyan-400/20" : "border-transparent",
        hovered ? "shadow-[0_0_30px_rgba(34,211,238,0.1)]" : "",
      )}
      onClick={onOpen}
    >
      {/* Banner de dificuldade */}
      <div className="absolute top-4 right-4">
        <span className={cn(
          "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider",
          diffColor,
        )}>
          {difficultyLabels[exercise.difficulty] || exercise.difficulty}
        </span>
      </div>

      {/* Tipo de desafio */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded bg-white/[0.05] flex items-center justify-center border border-white/[0.05]">
            <Icon className="h-4 w-4 text-cyan-400" />
          </div>
          <h3 className="text-sm font-semibold text-white leading-tight">{exercise.title}</h3>
        </div>
        <span className={cn(
          "px-2 py-1 rounded text-[10px] font-bold",
          status.color,
          status.color === "text-emerald-400" ? "bg-emerald-400/10" : "bg-slate-500/10",
        )}>
          {status.label}
        </span>
      </div>

      {/* Descrição */}
      <p className="text-xs text-slate-500 mb-4 line-clamp-2">{exercise.description}</p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {exercise.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="px-2 py-1 rounded border border-white/[0.06] bg-white/[0.02] text-[10px] text-cyan-300">
            #{tag}
          </span>
        ))}
      </div>

      {/* Barra de progresso */}
      <div className="mb-4">
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-slate-500">Progresso</span>
          <span className="text-slate-400">{exercise.progress}%</span>
        </div>
        <div className="h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-all duration-500"
            style={{ width: `${exercise.progress}%` }}
          />
        </div>
      </div>

      {/* Tentativas e tempo */}
      <div className="flex items-center justify-between text-[10px] text-slate-500 mb-4">
        <span>
          <Flame className="h-3 w-3 mr-1" /> {exercise.attempts} tentativa{exercise.attempts !== 1 ? "s" : ""}
        </span>
        <span>
          <Clock className="h-3 w-3 mr-1" />
          {Math.floor(exercise.timeSpent / 60)}:{String(exercise.timeSpent % 60).padStart(2, "0")}
        </span>
      </div>

      {/* Botão de ação */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onOpen();
        }}
        className={cn(
          "w-full py-2.5 rounded-lg text-xs font-semibold transition-all border",
          exercise.status === "completed"
            ? "bg-emerald-400 text-slate-950 hover:bg-emerald-300"
            : exercise.status === "in-progress"
              ? "bg-cyan-400 text-slate-950 hover:bg-cyan-300"
              : "border-white/[0.06] text-slate-400 hover:border-white/[0.1] hover:text-white hover:bg-white/[0.02]",
        )}
      >
        {exercise.status === "completed" ? (
          <>
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Concluído
          </>
        ) : exercise.status === "in-progress" ? (
          <>
            <Play className="h-3.5 w-3.5 mr-1.5" /> Continuar
          </>
        ) : (
          <>
            <ArrowRight className="h-3.5 w-3.5 mr-1.5" /> Ver Desafio
          </>
        )}
      </button>

      {/* Overlay de indicação de ativo */}
      {isActive && (
        <div className="absolute inset-0 rounded-xl border border-cyan-400/50 bg-cyan-400/5 pointer-events-none" />
      )}
    </div>
  );
}
