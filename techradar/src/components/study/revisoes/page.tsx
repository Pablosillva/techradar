"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  RefreshCw,
  Play,
  FileText,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStudy } from "@/lib/study/context";
import { ReviewCard } from "./review-card";
import { ReviewTimeline } from "./review-timeline";
import { ReviewStats } from "./review-stats";
import { ReviewForm } from "./review-form";

export default function RevisoesPage() {
  const {
    reviewCards,
    startReview,
    completeReview,
    archiveReview,
    updateReviewTime,
    getReviewMetrics,
  } = useStudy();

  const [activeTab, setActiveTab] = useState("todas");
  const [showHighlight, setShowHighlight] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const tabs = [
    { id: "todas", label: "Todas" },
    { id: "ativas", label: "Ativas" },
    { id: "concluidas", label: "Concluídas" },
    { id: "modulo", label: "Por Módulo" },
    { id: "cartoes", label: "Cartões de Memória" },
  ];

  const metrics = getReviewMetrics();
  const highlightedReview = reviewCards.find(
    (r) => r.status === "para-ler" && r.nextReviewDate <= new Date()
  ) ?? reviewCards[0];

  const filteredCards = reviewCards.filter((r) => {
    if (activeTab === "ativas") return r.status === "para-ler";
    if (activeTab === "concluidas") return r.status === "concluido";
    if (activeTab === "arquivadas") return r.status === "arquivado";
    return true;
  });

  const handleCompleteReview = (
    reviewId: string,
    isCorrect: boolean,
    difficulty: "facil" | "medio" | "dificil"
  ) => {
    const timeSpent = Math.floor(Math.random() * 60) + 10;
    completeReview(reviewId, isCorrect, difficulty, timeSpent);
    updateReviewTime(reviewId, timeSpent);
  };

  const handleStartReview = (reviewId: string) => {
    startReview(reviewId);
  };

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-300 overflow-hidden">
      {/* Header */}
      <header className="h-16 shrink-0 border-b border-white/[0.06] bg-[#0f172a]/80 backdrop-blur px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-cyan-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Suas Revisões e Práticas
            </h1>
          </Link>
          <p className="text-sm text-slate-400">
            Sistema de repetição espaçada para retenção de conhecimento
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar revisões..."
            className="w-64 h-9 pl-9 pr-3 rounded-lg border border-white/[0.06] bg-white/[0.02] text-xs text-slate-200 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400 transition-colors placeholder-slate-500"
          />
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-white/[0.05] border border-white/[0.06] rounded-lg text-slate-300 hover:bg-white/[0.1] hover:text-white transition-colors"
          >
            <FileText className="h-3 w-3 mr-1" /> Adicionar Cartão
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Tabs */}
        <div className="h-10 shrink-0 border-b border-white/[0.06] bg-[#0f172a]/80 backdrop-blur px-6 flex items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 py-2 text-xs font-medium transition-all border-b-2",
                  isActive
                    ? "text-cyan-400 border-cyan-400 bg-white/[0.03]"
                    : "text-slate-400 border-transparent hover:text-slate-200 hover:bg-white/[0.02]",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 min-w-0 flex">
          {/* Left panel */}
          <div className="flex-1 min-w-0 p-6 md:p-8 overflow-y-auto">
            <div className="max-w-[1400px] mx-auto">
              <div className="flex flex-col gap-8">
                {/* Featured review */}
                <div className="rounded-xl border border-white/[0.05] bg-[#0f172a]/80 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-bold text-white">
                        Sessão de Revisão em Destaque
                      </h2>
                      <p className="text-sm text-slate-400">
                        {highlightedReview?.title || "Nenhuma revisão pendente"}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowHighlight(!showHighlight)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-white/[0.05] rounded transition-colors"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>

                  {showHighlight && highlightedReview && (
                    <div className="mt-4 rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                      <ReviewTimeline
                        review={highlightedReview}
                        onComplete={(isCorrect, difficulty) => handleCompleteReview(highlightedReview!.id, isCorrect, difficulty)}
                      />
                    </div>
                  )}

                  <div className="mt-6 flex items-center justify-between">
                    <button
                      onClick={() => {
                        if (highlightedReview) {
                          handleStartReview(highlightedReview.id);
                        }
                      }}
                      className="px-4 py-2 bg-cyan-400 text-slate-950 rounded-lg text-sm font-semibold hover:bg-cyan-300 transition-colors"
                    >
                      <Play className="h-3.5 w-3.5 mr-1.5" /> Próximo Tópico
                    </button>
                  </div>
                </div>

                {/* Review cards grid */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredCards.length === 0 ? (
                    <div className="col-span-full rounded-xl border border-dashed border-white/[0.08] bg-transparent p-16 text-center">
                      <Clock className="mx-auto h-12 w-12 text-slate-500 mb-3" />
                      <h3 className="text-sm font-semibold text-white">
                        Nenhuma revisão pendente
                      </h3>
                      <p className="text-sm text-slate-500">
                        Todas as revisões estão em dia! Continue estudando para gerar novas.
                      </p>
                    </div>
                  ) : (
                    filteredCards.map((card) => (
                      <ReviewCard
                        key={card.id}
                        card={card}
                        onComplete={(isCorrect: boolean, difficulty: "facil" | "medio" | "dificil") => {
                          handleCompleteReview(card.id, isCorrect, difficulty);
                        }}
                        onArchive={() => archiveReview(card.id)}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div className="w-80 shrink-0 border-l border-white/[0.06] bg-[#0f172a]/80 backdrop-blur flex flex-col z-10">
            <div className="p-4 border-b border-white/[0.06]">
              <h2 className="text-sm font-semibold text-white mb-2">
                Painel de Desempenho
              </h2>
              <p className="text-xs text-slate-400">
                Acompanhe seu progresso de revisão
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <ReviewStats metrics={metrics} cards={reviewCards} />

              <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Meta de Conclusão
                </h3>
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Meta mensal</span>
                  <span className="text-slate-200 font-medium">
                    {metrics.completedReviews}/{metrics.totalReviews}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (metrics.completedReviews / Math.max(metrics.totalReviews, 1)) * 100)}%`,
                    }}
                  />
                </div>
                <div className="mt-1 text-[10px] text-slate-500 flex justify-between">
                  <span>Revisões concluídas</span>
                  <span>{metrics.completedReviews}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Form modal */}
      {showForm && (
        <ReviewForm onClose={() => setShowForm(false)} onCreate={() => setShowForm(false)} />
      )}
    </div>
  );
}
