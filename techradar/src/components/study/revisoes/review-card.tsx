"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle, Clock, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReviewCard } from "@/lib/study/types";

const DIFFICULTY_COLORS: Record<string, string> = {
  facil: "text-emerald-400 border-emerald-400/20 bg-emerald-400/10",
  medio: "text-amber-400 border-amber-400/20 bg-amber-400/10",
  dificil: "text-rose-400 border-rose-400/20 bg-rose-400/10",
};

export function CardFlip({
  front,
  back,
  isFlipped = false,
}: {
  front: React.ReactNode;
  back: React.ReactNode;
  isFlipped?: boolean;
}) {
  const [flipped, setFlipped] = useState(isFlipped);

  return (
    <div
      onClick={() => setFlipped(!flipped)}
      className="relative inline-block w-full cursor-pointer"
      style={{ perspective: "1000px" }}
    >
      <div
        className="relative w-full h-[200px] rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-transform duration-500 transform-style-preserve-3d"
        style={{
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front face */}
        <div
          className="absolute w-full h-full rounded-xl border border-white/[0.05] bg-white/[0.03] p-4 backface-hidden"
        >
          <div className="flex items-start gap-2 mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
              Pergunta
            </span>
          </div>
          <div className="text-sm text-slate-300 leading-relaxed">{front}</div>
        </div>

        {/* Back face */}
        <div
          className="absolute w-full h-full rounded-xl border border-white/[0.05] bg-white/[0.02] p-4 backface-hidden"
          style={{ transform: "rotateY(180deg)" }}
        >
          <div className="flex items-start gap-2 mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Resposta
            </span>
          </div>
          <div className="text-sm text-slate-300 leading-relaxed">{back}</div>
        </div>
      </div>

      <div className="mt-2 text-[10px] text-slate-500 text-center">
        Clique para virar o cartão
      </div>
    </div>
  );
}

export function ReviewCard({
  card,
  onComplete,
  onArchive,
  onFlip,
}: {
  card: ReviewCard;
  onComplete: (isCorrect: boolean, difficulty: "facil" | "medio" | "dificil") => void;
  onArchive: (reviewId: string) => void;
  onFlip?: () => void;
}) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const statusLabel: Record<string, string> = {
    "para-ler": "Para Ler",
    concluido: "Concluído",
    arquivado: "Arquivado",
  };

  const difficultyColor: Record<string, string> = {
    facil: "text-emerald-400 border-emerald-400/20 bg-emerald-400/10",
    medio: "text-amber-400 border-amber-400/20 bg-amber-400/10",
    dificil: "text-rose-400 border-rose-400/20 bg-rose-400/10",
  };

  const isOverdue =
    card.status === "para-ler" && card.nextReviewDate < new Date();

  return (
    <div
      className={cn(
        "group relative rounded-xl border p-4 transition-all duration-200",
        "border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1]",
        card.status === "concluido" ? "opacity-60" : "",
        card.status === "arquivado" ? "border-rose-500/20" : "",
      )}
    >
      {/* Status badge */}
      <div className="flex items-start justify-between mb-3">
        <span className={cn(
          "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider",
          difficultyColor[card.difficulty],
        )}>
          {card.difficulty === "facil" ? "Fácil" : card.difficulty === "medio" ? "Médio" : "Difícil"}
        </span>
        {isOverdue && (
          <span className="text-[10px] font-bold text-rose-400">Vencido</span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-white leading-tight mb-2">
        {card.title}
      </h3>

      {/* Question preview */}
      <p className="text-xs text-slate-500 mb-4 line-clamp-2">{card.question}</p>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-[10px] mb-1">
          <span className="text-slate-500">Progresso da revisão</span>
          <span className="text-slate-400">
            {card.timesReviewed > 0 ? Math.round((card.timesReviewed / 5) * 100) : 0}%
          </span>
        </div>
        <div className="h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-all duration-500"
            style={{ width: `${Math.min(100, (card.timesReviewed / 5) * 100)}%` }}
          />
        </div>
      </div>

      {/* Flip card */}
      <div className="mb-3">
        <CardFlip
          front={<div className="text-sm text-slate-300">{card.question}</div>}
          back={<div className="text-sm text-slate-300">{card.answer}</div>}
          isFlipped={isFlipped}
        />
      </div>

      {/* Action buttons */}
      <div className="mt-3 flex flex-wrap gap-2">
        {card.status !== "concluido" && (
          <>
            <button
              onClick={() => onComplete(true, "medio")}
              className="flex-1 px-3 py-1.5 rounded border border-emerald-400/20 bg-emerald-400/10 text-[10px] font-bold text-emerald-400 hover:bg-emerald-400/30 transition-colors"
            >
              <CheckCircle2 className="h-3 w-3 mr-1" /> Fácil
            </button>
            <button
              onClick={() => onComplete(false, "dificil")}
              className="flex-1 px-3 py-1.5 rounded border border-rose-400/20 bg-rose-400/10 text-[10px] font-bold text-rose-400 hover:bg-rose-400/30 transition-colors"
            >
              <AlertCircle className="h-3 w-3 mr-1" /> Difícil
            </button>
          </>
        )}

        <button
          onClick={() => onArchive(card.id)}
          className="px-3 py-1.5 rounded border border-white/[0.06] text-[10px] text-slate-400 hover:text-white hover:bg-white/[0.1] transition-colors"
        >
          <Trash2 className="h-3 w-3 mr-1" /> Arquivar
        </button>

        <button
          onClick={() => {
            setIsFlipped(!isFlipped);
            onFlip?.();
          }}
          className="px-3 py-1.5 rounded border border-white/[0.06] text-[10px] text-cyan-400 hover:text-white hover:bg-white/[0.1] transition-colors"
        >
          {isFlipped ? "Ocultar resposta" : "Mostrar resposta"}
        </button>
      </div>

      {/* Footer info */}
      <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500">
        <span>Última revisão: {card.lastReviewedAt ? new Date(card.lastReviewedAt).toLocaleDateString("pt-BR") : "Nunca"}</span>
        <span>{card.timesReviewed}x revisado</span>
      </div>
    </div>
  );
}
