"use client";

import Link from "next/link";
import { ArrowRight, AlertTriangle, Target, Brain } from "lucide-react";
import { useStudy } from "@/lib/study/context";

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  kind: "exercise" | "review" | "roadmap";
}

export function generateRecommendations(state: {
  exerciseChallenges: Array<{ category: string; status: string; difficulty: string }>;
  reviewCards: Array<{ status: string; nextReviewDate: Date }>;
  roadmapNodes: Array<{ id: string; title: string; status: string; progress: number }>;
}): Recommendation[] {
  const out: Recommendation[] = [];
  const byCategory: Record<string, { total: number; done: number }> = {};
  for (const ex of state.exerciseChallenges) {
    byCategory[ex.category] ??= { total: 0, done: 0 };
    byCategory[ex.category].total += 1;
    if (ex.status === "completed") byCategory[ex.category].done += 1;
  }
  const weakest = Object.entries(byCategory)
    .map(([cat, v]) => ({ cat, rate: v.total > 0 ? v.done / v.total : 1 }))
    .sort((a, b) => a.rate - b.rate)[0];
  if (weakest && weakest.rate < 0.5) {
    out.push({
      id: `cat-${weakest.cat}`,
      title: `Foco em ${weakest.cat}`,
      description: `Taxa de conclusão em exercícios de ${weakest.cat} abaixo de 50%.`,
      href: "/exercicios",
      cta: "Praticar agora",
      kind: "exercise",
    });
  }
  const difficult = state.exerciseChallenges.filter((c) => c.difficulty === "dificil" && c.status !== "completed");
  if (difficult.length > 0) {
    out.push({
      id: "dificil",
      title: "Desafios Difíceis Pendentes",
      description: `${difficult.length} desafio(s) de nível difícil sem conclusão.`,
      href: "/exercicios",
      cta: "Ver desafios",
      kind: "exercise",
    });
  }
  const overdue = state.reviewCards.filter((r) => r.status === "para-ler" && r.nextReviewDate <= new Date());
  if (overdue.length > 0) {
    out.push({
      id: "overdue",
      title: `Revisar ${overdue.length} cartão(ões) vencido(s)`,
      description: "Repetição espaçada vencida — finalize para recuperar retenção.",
      href: "/revisoes",
      cta: "Revisar agora",
      kind: "review",
    });
  }
  const inProgress = state.roadmapNodes.find((n) => n.status === "em-andamento" && n.progress < 100);
  const blocked = state.roadmapNodes.find((n) => n.status === "bloqueado");
  if (inProgress) {
    out.push({
      id: `node-${inProgress.id}`,
      title: `Concluir: ${inProgress.title}`,
      description: `${inProgress.progress}% — retome as aulas vinculadas a este nó.`,
      href: "/roadmap",
      cta: "Continuar trilha",
      kind: "roadmap",
    });
  } else if (blocked) {
    out.push({
      id: `blocked-${blocked.id}`,
      title: `Desbloquear: ${blocked.title}`,
      description: "Conclua os pré-requisitos no roadmap para liberar este nó.",
      href: "/roadmap",
      cta: "Ver roadmap",
      kind: "roadmap",
    });
  }
  if (out.length === 0) {
    out.push({
      id: "ok",
      title: "Tudo em dia!",
      description: "Sem fraquezas detectadas. Avance para o próximo módulo.",
      href: "/roadmap",
      cta: "Ver trilha",
      kind: "roadmap",
    });
  }
  return out.slice(0, 5);
}

export function Recommendations() {
  const { exerciseChallenges, reviewCards, roadmapNodes } = useStudy();
  const recs = generateRecommendations({ exerciseChallenges, reviewCards, roadmapNodes });

  return (
    <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-5">
      <div className="mb-4 flex items-center gap-2">
        <Brain className="h-4 w-4 text-amber-400" />
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Recomendações Personalizadas
        </h3>
      </div>
      <div className="space-y-3">
        {recs.map((rec) => (
          <div key={rec.id} className="flex items-center gap-3 rounded-lg border border-white/[0.05] bg-white/[0.03] p-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-400/15 text-amber-400">
              {rec.kind === "review" ? <AlertTriangle className="h-3.5 w-3.5" /> : <Target className="h-3.5 w-3.5" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">{rec.title}</p>
              <p className="truncate text-[11px] text-slate-500">{rec.description}</p>
            </div>
            <Link
              href={rec.href}
              className="flex shrink-0 items-center gap-1 rounded-md border border-cyan-400/20 px-3 py-1.5 text-[11px] font-semibold text-cyan-400 transition-colors hover:bg-cyan-400/10"
            >
              {rec.cta}
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
