"use client";

import { useMemo } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { ExerciseChallenge } from "@/lib/study/types";

type RadarAxis = { name: string; value: number };

function axisValue(challenges: ExerciseChallenge[], match: (c: ExerciseChallenge) => boolean): number {
  const sub = challenges.filter(match);
  if (!sub.length) return 0;
  const done = sub.filter((c) => c.status === "completed").length;
  return Math.round((done / sub.length) * 100);
}

export function RadarCharts({ challenges }: { challenges: ExerciseChallenge[] }) {
  const frontendData: RadarAxis[] = useMemo(
    () => [
      { name: "React", value: axisValue(challenges, (c) => (c.tags ?? []).some((t) => /react|frontend/i.test(t)) || c.language === "javascript") },
      { name: "CSS", value: axisValue(challenges, (c) => (c.tags ?? []).some((t) => /css|style/i.test(t))) },
      { name: "HTML", value: axisValue(challenges, (c) => (c.tags ?? []).some((t) => /html/i.test(t))) },
      { name: "TypeScript", value: axisValue(challenges, (c) => /typescript|tsx|ts/i.test(c.language)) },
    ],
    [challenges],
  );

  const backendData: RadarAxis[] = useMemo(
    () => [
      { name: "Node.js", value: axisValue(challenges, (c) => (c.tags ?? []).some((t) => /node/i.test(t)) || /javascript|python/i.test(c.language)) },
      { name: "SQL", value: axisValue(challenges, (c) => c.language === "sql" || (c.tags ?? []).some((t) => /sql/i.test(t))) },
      { name: "API", value: axisValue(challenges, (c) => (c.tags ?? []).some((t) => /api/i.test(t))) },
      { name: "Docker", value: axisValue(challenges, (c) => (c.tags ?? []).some((t) => /docker|deploy|aws/i.test(t))) },
    ],
    [challenges],
  );

  const hasData = challenges.length > 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-5">
        <h3 className="mb-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Radar — Frontend
        </h3>
        {!hasData ? (
          <p className="py-8 text-center text-xs text-slate-500">
            Conclua exercícios para alimentar o radar.
          </p>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={frontendData}>
                <PolarGrid stroke="white/[0.07]" />
                <PolarAngleAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#475569", fontSize: 9 }} />
                <Tooltip
                  contentStyle={{ background: "#0d1420", border: "1px solid white/10", borderRadius: 8, fontSize: 12 }}
                />
                <Radar dataKey="value" stroke="#06b6d4" strokeWidth={2} fill="#06b6d4" fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-5">
        <h3 className="mb-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Radar — Backend
        </h3>
        {!hasData ? (
          <p className="py-8 text-center text-xs text-slate-500">
            Conclua exercícios para alimentar o radar.
          </p>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={backendData}>
                <PolarGrid stroke="white/[0.07]" />
                <PolarAngleAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#475569", fontSize: 9 }} />
                <Tooltip
                  contentStyle={{ background: "#0d1420", border: "1px solid white/10", borderRadius: 8, fontSize: 12 }}
                />
                <Radar dataKey="value" stroke="#f59e0b" strokeWidth={2} fill="#f59e0b" fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
