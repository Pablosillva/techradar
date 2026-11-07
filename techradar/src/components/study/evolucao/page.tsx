"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Activity, Code2, Shield, Search, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStudy } from "@/lib/study/context";
import type { ModuleCategory } from "@/lib/study/types";
import { TimelineChart } from "./timeline-chart";
import { RadarCharts } from "./radar-chart";
import { HeatmapChart } from "./heatmap-chart";
import { ProjectBars } from "./project-bars";
import { Recommendations, generateRecommendations } from "./recommendations";

const TABS = [
  { id: "overview", label: "Visão Geral", icon: LayoutDashboard },
  { id: "skills", label: "Habilidades e Stack", icon: Activity },
  { id: "code", label: "Estilo de Codificação", icon: Code2 },
  { id: "impact", label: "Impacto e Projetos", icon: Shield },
];

const CATEGORY_COLORS: Record<ModuleCategory, string> = {
  "web-development": "#06b6d4",
  "mobile-dev": "#a78bfa",
  devops: "#f59e0b",
  "cloud-computing": "#22c55e",
  "data-science": "#f472b6",
};

export default function EvolucaoPage() {
  const {
    roadmapNodes,
    modules,
    exerciseChallenges,
    reviewCards,
    reviewSessions,
    timeSpent,
    labProjects,
    labTimeSpent,
    exerciseTimeSpent,
    reviewTimeSpent,
    categoryProgress,
  } = useStudy();

  const [activeTab, setActiveTab] = useState("overview");
  const [search, setSearch] = useState("");

  const sortedNodes = useMemo(
    () => [...roadmapNodes].sort((a, b) => a.order - b.order),
    [roadmapNodes],
  );

  const filteredNodes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sortedNodes;
    return sortedNodes.filter((n) => n.title.toLowerCase().includes(q));
  }, [sortedNodes, search]);

  const avgNodeProgress = useMemo(
    () =>
      sortedNodes.length > 0
        ? Math.round(sortedNodes.reduce((s, n) => s + n.progress, 0) / sortedNodes.length)
        : 0,
    [sortedNodes],
  );

  const dailyMinutes = useMemo(() => {
    const map: Record<string, number> = {};
    const add = (date: Date, minutes: number) => {
      const key = date.toISOString().slice(0, 10);
      map[key] = (map[key] ?? 0) + minutes;
    };
    for (const s of reviewSessions) add(s.reviewedAt, Math.max(1, s.timeSpentSeconds / 60));
    for (const ex of exerciseChallenges) {
      if (ex.status === "completed") {
        const base = new Date();
        base.setDate(base.getDate() - ex.attempts * 2);
        add(base, Math.max(5, (ex.timeSpent / 60) || 10));
      }
    }
    const totalSec =
      Object.values(timeSpent).reduce((a, b) => a + b, 0) +
      (labTimeSpent ?? 0) +
      Object.values(exerciseTimeSpent ?? {}).reduce((a: number, b: number) => a + b, 0) +
      (reviewTimeSpent ?? 0);
    const totalMin = Math.round(totalSec / 60);
    if (totalMin > 0) {
      const today = new Date();
      for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const weight = i < 90 ? 0.6 : i < 180 ? 0.3 : 0.1;
        const share = Math.round(((totalMin * weight) / 365) * (0.5 + ((i * 37) % 10) / 10));
        if (share > 0) {
          const key = d.toISOString().slice(0, 10);
          map[key] = (map[key] ?? 0) + share;
        }
      }
    }
    return map;
  }, [reviewSessions, exerciseChallenges, timeSpent, labTimeSpent, exerciseTimeSpent, reviewTimeSpent]);

  const topTech = useMemo(() => {
    const cats: ModuleCategory[] = ["web-development", "mobile-dev", "devops", "cloud-computing", "data-science"];
    return cats
      .map((c) => ({ cat: c, value: categoryProgress(c) }))
      .sort((a, b) => b.value - a.value);
  }, [categoryProgress]);

  const recommendations = useMemo(() => {
    const all = generateRecommendations({ exerciseChallenges, reviewCards, roadmapNodes } as unknown as Parameters<typeof generateRecommendations>[0]);
    if (!search.trim()) return all;
    const q = search.toLowerCase();
    return all.filter((r) => (r.title + r.description).toLowerCase().includes(q));
  }, [exerciseChallenges, reviewCards, roadmapNodes, search]);

  const show = (id: string) => activeTab === "overview" || activeTab === id;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0f172a] text-slate-300">
      <header className="z-20 flex h-16 shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#0f172a]/80 px-6 backdrop-blur">
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <TrendingUp className="h-5 w-5 text-cyan-400" />
            <h1 className="whitespace-nowrap text-2xl font-bold tracking-tight text-white">
              Evolução do seu Caminho Dev
            </h1>
          </Link>
          <p className="hidden truncate text-sm text-slate-400 md:block">
            Dashboard analítico — Roadmap · Exercícios · Revisões · Laboratório
          </p>
        </div>
        <div className="relative shrink-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="text"
            placeholder="Filtrar nós/recomendações…"
            className="h-9 w-56 rounded-lg border border-white/[0.06] bg-white/[0.02] pl-9 pr-3 text-xs text-slate-200 placeholder:text-slate-500 focus:border-cyan-400/50 focus:outline-none focus:ring-1 focus:ring-cyan-400"
          />
        </div>
      </header>

      <div className="flex h-11 shrink-0 items-center gap-1 overflow-x-auto border-b border-white/[0.06] bg-[#0f172a]/80 px-6 backdrop-blur">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex h-11 shrink-0 items-center gap-1.5 border-b-2 px-4 text-xs font-medium transition-colors",
                isActive
                  ? "border-cyan-400 bg-cyan-400/[0.04] text-cyan-300"
                  : "border-transparent text-slate-400 hover:text-slate-200",
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <main className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-5">
          <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-5 xl:grid-cols-2">
            {(show("overview") || show("skills")) && (
              <div className="xl:col-span-2">
                <TimelineChart nodes={filteredNodes} />
              </div>
            )}
            {(show("overview") || show("code")) && (
              <div className="xl:col-span-2">
                <HeatmapChart dailyMinutes={dailyMinutes} />
              </div>
            )}
            {(show("overview") || show("skills")) && (
              <div className="xl:col-span-2">
                <RadarCharts challenges={exerciseChallenges} />
              </div>
            )}
            {(show("overview") || show("impact")) && (
              <ProjectBars projects={labProjects} />
            )}
            {(show("overview") || show("skills")) && <Recommendations />}
          </div>
        </div>

        <aside className="hidden w-80 shrink-0 flex-col gap-5 overflow-y-auto border-l border-white/[0.06] bg-[#0d1420] p-4 lg:flex">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Resumo consolidado</p>
            <div className="mt-4 flex flex-col items-center">
              <div className="relative h-36 w-36">
                <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                  <circle cx="60" cy="60" r="52" stroke="white/[0.06]" strokeWidth="10" fill="none" />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    stroke="#22c55e"
                    strokeWidth="10"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={326.72}
                    strokeDashoffset={326.72 - (326.72 * avgNodeProgress) / 100}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-white">{avgNodeProgress}%</span>
                  <span className="text-[10px] text-slate-500">Milestone</span>
                </div>
              </div>
              <p className="mt-3 text-center text-xs text-slate-400">
                {roadmapNodes.filter((n) => n.status === "completo").length}/{roadmapNodes.length} nós concluídos
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Top Tech</p>
            <div className="space-y-2.5">
              {topTech.map((t) => (
                <div key={t.cat}>
                  <div className="mb-1 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="truncate">{t.cat}</span>
                    <span className="font-semibold text-slate-200">{t.value}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <div className="h-full rounded-full" style={{ width: `${t.value}%`, background: CATEGORY_COLORS[t.cat] }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Próximos passos</p>
            <div className="space-y-2">
              {sortedNodes
                .filter((n) => n.status === "em-andamento" || n.status === "bloqueado" || n.status === "não-iniciado")
                .slice(0, 4)
                .map((n) => (
                  <Link
                    key={n.id}
                    href="/roadmap"
                    className="flex items-center gap-3 rounded-lg border border-white/[0.05] bg-white/[0.02] p-2.5 hover:border-cyan-400/30 hover:bg-cyan-400/[0.04]"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.05] text-[10px] font-bold text-cyan-300">
                      {n.order}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-slate-200">{n.title}</p>
                      <p className="text-[10px] text-slate-500">{n.progress}% — {n.status}</p>
                    </div>
                  </Link>
                ))}
              {sortedNodes.every((n) => n.status === "completo") && (
                <p className="text-xs text-slate-500">Trilha completa. 🎉</p>
              )}
            </div>
            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-[11px] text-slate-400">
                <span>Progresso geral da trilha</span>
                <span className="font-semibold text-slate-200">{avgNodeProgress}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div className="h-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-all" style={{ width: `${avgNodeProgress}%` }} />
              </div>
            </div>
            {recommendations.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-[11px] font-semibold text-slate-400">Recomendadas</p>
                {recommendations.slice(0, 3).map((rec) => (
                  <Link
                    key={rec.id}
                    href={rec.href}
                    className="block truncate text-xs text-cyan-300 hover:text-cyan-200"
                  >
                    → {rec.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}
