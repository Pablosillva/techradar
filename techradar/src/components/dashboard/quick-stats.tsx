import Link from "next/link";
import { Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface QuickStatsPanelProps {
  exercisesSolved: number;
  exercisesTotal: number;
  retention: number;
  cardsReviewed: number;
}

function ProgressRing({
  value,
  color,
  track = "rgba(148, 163, 184, 0.12)",
}: {
  value: number;
  color: string;
  track?: string;
}) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, value)) / 100) * circumference;

  return (
    <svg viewBox="0 0 72 72" className="h-[72px] w-[72px]" aria-hidden="true">
      <circle cx="36" cy="36" r={radius} fill="none" stroke={track} strokeWidth="6" />
      <circle
        cx="36"
        cy="36"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 36 36)"
      />
      <text
        x="36"
        y="39"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#e2e8f0"
        fontSize="13"
        fontWeight="700"
      >
        {value}%
      </text>
    </svg>
  );
}

export function QuickStatsPanel({
  exercisesSolved,
  exercisesTotal,
  retention,
  cardsReviewed,
}: QuickStatsPanelProps) {
  const exercisePercent =
    exercisesTotal === 0 ? 0 : Math.round((exercisesSolved / exercisesTotal) * 100);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Zap className="h-4 w-4 text-amber-300" />
          Estatísticas Rápidas
        </CardTitle>
      </CardHeader>

      <CardContent className="grid grid-cols-2 gap-4 pt-0">
        <div className="flex flex-col items-center rounded-xl border border-white/[0.04] bg-white/[0.02] px-3 py-4 text-center">
          <ProgressRing value={exercisePercent} color="#22d3ee" />
          <p className="mt-2 text-[11px] font-medium text-slate-300">Exercícios Resolvidos</p>
          <p className="text-[10px] text-slate-500">
            {exercisesSolved}/{exercisesTotal} • {exercisePercent}%
          </p>
        </div>

        <div className="flex flex-col items-center rounded-xl border border-white/[0.04] bg-white/[0.02] px-3 py-4 text-center">
          <ProgressRing value={retention} color="#8b5cf6" />
          <p className="mt-2 text-[11px] font-medium text-slate-300">Taxa de Retenção</p>
          <p className="text-[10px] text-slate-500">{cardsReviewed} cartões revisados</p>
        </div>

        <Link
          href="/evolucao"
          className="col-span-2 text-center text-[11px] font-medium text-cyan-300 transition-colors hover:text-cyan-200"
        >
          Ver evolução completa →
        </Link>
      </CardContent>
    </Card>
  );
}
