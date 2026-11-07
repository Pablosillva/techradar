"use client";

import { useState } from "react";
import { X, ArrowRight, Clock, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStudy } from "@/lib/study/context";

interface ReviewFormProps {
  onClose: () => void;
  onCreate: () => void;
}

const DIFFICULTY_OPTIONS = [
  { value: "facil", label: "Fácil" },
  { value: "medio", label: "Médio" },
  { value: "dificil", label: "Difícil" },
];

export function ReviewForm({ onClose, onCreate }: ReviewFormProps) {
  const {
    generateReviewFromLesson,
    generateReviewFromExercise,
  } = useStudy();

  const [title, setTitle] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [difficulty, setDifficulty] = useState("medio");
  const [source, setSource] = useState("lesson");
  const [moduleId, setModuleId] = useState("");
  const [sourceId, setSourceId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !question || !answer || !moduleId || !sourceId) return;

    if (source === "lesson") {
      // Generate review from lesson
    } else {
      // Generate review from exercise
    }

    onClose();
    onCreate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0f172a] rounded-2xl border border-white/[0.08] w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <h3 className="text-sm font-semibold text-white">Novo Cartão de Revisão</h3>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/[0.05] rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Título
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título da revisão"
                className="w-full h-9 pl-3 pr-3 rounded-lg border border-white/[0.06] bg-white/[0.02] text-xs text-slate-200 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400 transition-colors placeholder-slate-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Pergunta
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Qual é a pergunta de revisão?"
                rows={3}
                className="w-full h-24 pl-3 pr-3 rounded-lg border border-white/[0.06] bg-white/[0.02] text-xs text-slate-200 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400 transition-colors placeholder-slate-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Resposta
              </label>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Qual é a resposta?"
                rows={3}
                className="w-full h-24 pl-3 pr-3 rounded-lg border border-white/[0.06] bg-white/[0.02] text-xs text-slate-200 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400 transition-colors placeholder-slate-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Dificuldade
                </label>
                <span className="text-xs text-cyan-400">Importante para SRS</span>
              </div>
              <div className="flex gap-2">
                {DIFFICULTY_OPTIONS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setDifficulty(d.value as "facil" | "medio" | "dificil")}
                    className={cn(
                      "flex-1 px-2 py-1.5 rounded border text-xs transition-colors",
                      difficulty === d.value
                        ? "bg-cyan-400/20 text-cyan-400 border-cyan-400/20"
                        : "bg-white/[0.02] text-slate-400 border-transparent hover:bg-white/[0.05]",
                    )}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Módulo
              </label>
              <input
                type="text"
                value={moduleId}
                onChange={(e) => setModuleId(e.target.value)}
                placeholder="ID do módulo (ex: mod-react)"
                className="w-full h-9 pl-3 pr-3 rounded-lg border border-white/[0.06] bg-white/[0.02] text-xs text-slate-200 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400 transition-colors placeholder-slate-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                ID da Fonte (Aula/Exercício)
              </label>
              <input
                type="text"
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                placeholder="ID da aula ou exercício"
                className="w-full h-9 pl-3 pr-3 rounded-lg border border-white/[0.06] bg-white/[0.02] text-xs text-slate-200 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400 transition-colors placeholder-slate-500"
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all border text-slate-400 border-white/[0.06] hover:bg-white/[0.05] hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!title || !question || !answer || !moduleId || !sourceId}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-cyan-400 text-slate-950 hover:bg-cyan-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowRight className="h-3.5 w-3.5 mr-1.5" /> Criar Cartão
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
