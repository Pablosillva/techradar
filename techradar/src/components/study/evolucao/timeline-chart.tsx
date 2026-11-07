"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RoadmapNode, RoadmapStatus } from "@/lib/study/types";

const STATUS_COLORS: Record<RoadmapStatus, string> = {
  "não-iniciado": "#64748b",
  "em-andamento": "#06b6d4",
  completo: "#22c55e",
  bloqueado: "#78716c",
};

const STATUS_LABELS: Record<RoadmapStatus, string> = {
  "não-iniciado": "Próximo",
  "em-andamento": "Atual",
  completo: "Completo",
  bloqueado: "Bloqueado",
};

export function TimelineChart({ nodes }: { nodes: RoadmapNode[] }) {
  const sorted = useMemo(
    () => [...nodes].sort((a, b) => a.order - b.order),
    [nodes],
  );

  const data = useMemo(
    () =>
      sorted.map((n) => ({
        id: n.id,
        name: n.title,
        short: n.title.length > 14 ? n.title.slice(0, 13) + "…" : n.title,
        progress: n.progress,
        status: n.status,
        order: n.order,
      })),
    [sorted],
  );

  const avg = data.length
    ? Math.round(data.reduce((s, d) => s + d.progress, 0) / data.length)
    : 0;

  return (
    <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-5">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Linha do Tempo de Habilidades
        </h3>
        <span className="flex items-center gap-1 text-[10px] text-slate-500">
          <Clock className="h-3 w-3 text-cyan-400" />
          Roadmap
        </span>
      </div>
      <p className="mb-4 text-xs text-slate-500">
        Réplica do status dos nós do Roadmap — verde (completo), ciano (em
        andamento), cinza (bloqueado/próximo).
      </p>

      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">
          Nenhum nó no roadmap. Adicione trilhas em /roadmap para vizualizar.
        </p>
      ) : (
        <>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, bottom: 10, left: 0, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="white/[0.06]" vertical={false} />
                <XAxis
                  dataKey="short"
                  stroke="white/[0.15]"
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                  interval={0}
                  angle={0}
                  height={36}
                />
                <YAxis
                  stroke="white/[0.15]"
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                  domain={[0, 100]}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload as (typeof data)[number];
                    return (
                      <div className="rounded-lg border border-white/10 bg-[#0d1420] px-3 py-2 shadow-xl">
                        <p className="text-xs font-semibold text-white">{d.name}</p>
                        <p className="text-[11px] text-slate-400">
                          {d.progress}% — {STATUS_LABELS[d.status]}
                        </p>
                      </div>
                    );
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="progress"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={(props) => {
                    const { cx = 0, cy = 0, payload } = props as {
                      cx?: number;
                      cy?: number;
                      payload: (typeof data)[number];
                    };
                    const fill = STATUS_COLORS[payload.status];
                    return (
                      <circle
                        key={payload.id}
                        cx={cx}
                        cy={cy}
                        r={6}
                        fill={fill}
                        stroke="#0f172a"
                        strokeWidth={2}
                      />
                    );
                  }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 flex items-start gap-4">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> Completo
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <span className="h-2 w-2 rounded-full bg-cyan-400" /> Em andamento
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <span className="h-2 w-2 rounded-full bg-slate-500" /> Bloqueado
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-slate-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Trilha geral
            </span>
            <span className="font-bold text-slate-200">{avg}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-all duration-500"
              style={{ width: `${avg}%` }}
            />
          </div>
        </>
      )}
    </div>
  );
}

export { TimelineChart as RoadmapChart };
