"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { cn } from "@/lib/utils";
import type { ReviewCard } from "@/lib/study/types";

const DIFFICULTY_COLORS: Record<string, string> = {
  facil: "#22c55e",
  medio: "#f59e0b",
  dificil: "#ef4444",
};

export function ReviewStats({
  metrics,
  cards,
}: {
  metrics: {
    totalReviews: number;
    pendingReviews: number;
    completedReviews: number;
    accuracyRate: number;
    averageResponseTime: number;
    reviewsByModule: Record<string, number>;
    reviewsByDifficulty: Record<string, number>;
  };
  cards: ReviewCard[];
}) {
  const accuracyData = [
    { name: "Precisão", value: metrics.accuracyRate },
    { name: "Meta", value: 80 },
  ];

  const difficultyData = [
    { name: "Fácil", value: metrics.reviewsByDifficulty.facil || 0, color: "#22c55e" },
    { name: "Médio", value: metrics.reviewsByDifficulty.medio || 0, color: "#f59e0b" },
    { name: "Difícil", value: metrics.reviewsByDifficulty.dificil || 0, color: "#ef4444" },
  ];

  return (
    <div className="space-y-6">
      {/* Accuracy chart */}
      <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">
          Precisão da Revisão
        </h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={accuracyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="white/[0.05]" />
              <XAxis dataKey="name" stroke="white/[0.05]" tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <YAxis stroke="white/[0.05]" tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="Precisão" stroke="#06b6d4" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Meta" stroke="#ef4444" strokeWidth={1} strokeDasharray="4 2" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex justify-between text-xs">
          <span className="text-slate-400">Precisão atual</span>
          <span className={`text-slate-200 font-bold ${metrics.accuracyRate >= 80 ? "text-emerald-400" : "text-rose-400"}`}>
            {metrics.accuracyRate}%
          </span>
        </div>
      </div>

      {/* Difficulty breakdown */}
      <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">
          Desempenho por Dificuldade
        </h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={difficultyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="white/[0.05]" />
              <XAxis dataKey="name" stroke="white/[0.05]" tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <YAxis stroke="white/[0.05]" tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} />
              {difficultyData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex justify-between text-xs">
          {difficultyData.map((d) => (
            <span key={d.name} className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${d.color === "#22c55e" ? "bg-emerald-400" : d.color === "#f59e0b" ? "bg-amber-400" : "bg-rose-400"}`} />
              <span className="text-slate-400">{d.name}</span>
              <span className="text-slate-200 font-medium">{d.value}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Response time */}
      <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">
          Tempo de Resposta Médio
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Tempo médio por revisão</span>
          <span className={`text-slate-200 font-bold ${metrics.averageResponseTime <= 30 ? "text-emerald-400" : "text-amber-400"}`}>
            {metrics.averageResponseTime}s
          </span>
        </div>
        <div className="mt-2 h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-violet-500"
            style={{ width: `${Math.min(100, (metrics.averageResponseTime / 60) * 100)}%` }}
          />
        </div>
        <div className="mt-1 text-[10px] text-slate-500">
          Metas: &lt; 30s (ótimo) | 30-60s (bom) | &gt; 60s (precisa melhorar)
        </div>
      </div>

      {/* Reviews by module */}
      <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">
          Revisões por Módulo
        </h3>
        <div className="space-y-2">
          {Object.entries(metrics.reviewsByModule).map(([moduleId, count]) => (
            <div key={moduleId} className="flex items-center justify-between text-xs">
              <span className="text-slate-400 truncate w-24">{moduleId}</span>
              <div className="w-24 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-violet-500"
                  style={{ width: `${Math.min(100, (count / 5) * 100)}%` }}
                />
              </div>
              <span className="text-slate-200 font-medium">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
