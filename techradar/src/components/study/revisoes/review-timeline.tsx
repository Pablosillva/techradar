"use client";

import { useState } from "react";
import {
  Clock,
  Trophy,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReviewCard } from "@/lib/study/types";

export function ReviewTimeline({
  review,
  onComplete,
}: {
  review: ReviewCard;
  onComplete: (isCorrect: boolean, difficulty: "facil" | "medio" | "dificil") => void;
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "incorrect">("correct");

  const steps = [
    { id: 1, title: "Revisar conceito", icon: Lightbulb },
    { id: 2, title: "Lembrar detalhes", icon: Clock },
    { id: 3, title: "Aplicar conhecimento", icon: Target },
    { id: 4, title: "Validar compreensão", icon: Trophy },
    { id: 5, title: "Concluir revisão", icon: CheckCircle2 },
  ];

  const handleComplete = (isCorrect: boolean, difficulty: "facil" | "medio" | "dificil") => {
    setShowFeedback(true);
    setFeedback(isCorrect ? "correct" : "incorrect");
    setCurrentStep(5);
    onComplete(isCorrect, difficulty);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">{review.title}</h3>
        <span className="text-[10px] font-bold text-cyan-400">
          Passo {currentStep} de 5
        </span>
      </div>

      <div className="flex items-center gap-2 mb-6">
        {steps.map((step) => {
          const IconComponent = step.icon;
          return (
            <div
              key={step.id}
              className={cn(
                "flex flex-col items-center gap-1.5 transition-all duration-300",
                currentStep > step.id
                  ? "text-emerald-400"
                  : currentStep === step.id
                    ? "text-cyan-400"
                    : "text-slate-500",
              )}
            >
              <div className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full border",
                currentStep > step.id
                  ? "border-emerald-400 bg-emerald-400/20"
                  : currentStep === step.id
                    ? "border-cyan-400 bg-cyan-400/20"
                    : "border-white/[0.06] bg-white/[0.02]",
              )}>
                <IconComponent className="h-3 w-3" />
              </div>
              <span className="text-[10px]">{step.title}</span>
            </div>
          );
        })}
      </div>

      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <Clock className="h-4 w-4 text-cyan-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-slate-200">{review.question}</p>
        </div>
      </div>

      {showFeedback && (
        <div className="mt-4 rounded-lg border p-3">
          <div className={cn(
            "flex items-start gap-2 mb-2",
            feedback === "correct"
              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-400"
              : "border-rose-400/20 bg-rose-400/10 text-rose-400",
          )}
          >
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span className="text-xs font-bold">
              {feedback === "correct" ? "Correto!" : "Precisa revisar"}
            </span>
          </div>
          <div className="text-xs text-slate-300">
            {feedback === "correct"
              ? "Bom trabalho! Este conceito será revisado em menos frequência."
              : "Revise este conceito novamente em breve para melhorar a retenção."}
          </div>
        </div>
      )}

      {!showFeedback && (
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={() => {
              setFeedback("correct");
              setShowFeedback(true);
              onComplete(true, review.difficulty);
            }}
            className="flex-1 px-4 py-2 rounded border border-emerald-400/20 bg-emerald-400/10 text-[10px] font-bold text-emerald-400 hover:bg-emerald-400/30 transition-colors"
          >
            <CheckCircle2 className="h-3 w-3 mr-1" /> Fácil de lembrar
          </button>
          <button
            onClick={() => {
              setFeedback("incorrect");
              setShowFeedback(true);
              onComplete(false, review.difficulty);
            }}
            className="flex-1 px-4 py-2 rounded border border-rose-400/20 bg-rose-400/10 text-[10px] font-bold text-rose-400 hover:bg-rose-400/30 transition-colors"
          >
            <AlertCircle className="h-3 w-3 mr-1" /> Preciso revisar
          </button>
        </div>
      )}
    </div>
  );
}
