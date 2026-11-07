"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import type { PortfolioProject } from "@/lib/study/types";

const DONUT_COLORS = ["#22c55e", "#06b6d4", "#64748b"];

export function PortfolioCharts({ projects }: { projects: PortfolioProject[] }) {
  const donutData = useMemo(() => {
    const counts = {
      completed: projects.filter((p) => p.status === "completed" || p.progress >= 100).length,
      "in-progress": projects.filter((p) => p.status === "in-progress").length,
      idea: projects.filter((p) => p.status === "idea").length,
    };
    return [
      { name: "Concluído", value: counts.completed, fill: DONUT_COLORS[0] },
      { name: "Em Andamento", value: counts["in-progress"], fill: DONUT_COLORS[1] },
      { name: "Em Ideia", value: counts.idea, fill: DONUT_COLORS[2] },
    ].filter((d) => d.value > 0);
  }, [projects]);

  const techData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of projects) {
      for (const t of p.techs) map[t] = (map[t] ?? 0) + 1;
    }
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [projects]);

  return (
    <div className="space-y-6">
      {/* Donut */}
      <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-5">
        <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Visão Geral do Portfólio
        </h3>
        {donutData.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-500">Nenhum projeto ainda.</p>
        ) : (
          <>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={52}
                    outerRadius={72}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {donutData.map((d, i) => (
                      <Cell key={i} fill={d.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#0d1420", border: "1px solid white/10", borderRadius: 8, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 space-y-1.5">
              {donutData.map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="h-2 w-2 rounded-full" style={{ background: d.fill }} />
                  <span className="flex-1">{d.name}</span>
                  <span className="font-bold text-slate-200">{d.value}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Bar */}
      <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-5">
        <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Tecnologias Mais Utilizadas
        </h3>
        {techData.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-500">Sem tecnologias registradas.</p>
        ) : (
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={techData} layout="horizontal" margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="white/[0.06]" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "#0d1420", border: "1px solid white/10", borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="value" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="mt-4 border-t border-white/[0.05] pt-3">
          <p className="mb-2 text-[11px] font-semibold text-slate-400">Recursos de Projeto</p>
          <div className="space-y-1.5">
            {donutData.map((d) => (
              <label key={d.name} className="flex items-center gap-2 text-xs text-slate-400">
                <input type="checkbox" checked readOnly className="h-3.5 w-3.5 rounded border-white/20 bg-transparent" />
                <span className="h-2 w-2 rounded-full" style={{ background: d.fill }} />
                {d.name}
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
