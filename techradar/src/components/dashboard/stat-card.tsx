import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const ACCENTS = {
  cyan: {
    ring: "ring-cyan-400/20",
    icon: "bg-cyan-400/10 text-cyan-300",
    bar: "from-cyan-400 to-sky-500",
  },
  violet: {
    ring: "ring-violet-400/20",
    icon: "bg-violet-400/10 text-violet-300",
    bar: "from-violet-400 to-fuchsia-500",
  },
  amber: {
    ring: "ring-amber-400/20",
    icon: "bg-amber-400/10 text-amber-300",
    bar: "from-amber-400 to-orange-500",
  },
  emerald: {
    ring: "ring-emerald-400/20",
    icon: "bg-emerald-400/10 text-emerald-300",
    bar: "from-emerald-400 to-teal-500",
  },
} as const;

export interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  accent: keyof typeof ACCENTS;
  progress?: number;
  hint?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent,
  progress,
  hint,
}: StatCardProps) {
  const theme = ACCENTS[accent];

  return (
    <Card className="group relative overflow-hidden p-4 transition-colors hover:border-white/[0.12]">
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-cyan-400/[0.04] blur-2xl transition-opacity group-hover:opacity-100"
        aria-hidden="true"
      />
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl ring-1",
            theme.icon,
            theme.ring
          )}
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
        </span>
        <span className="text-xs font-medium text-slate-400">{title}</span>
      </div>

      <div className="mt-3 flex items-end justify-between gap-2">
        <span className="text-[26px] font-bold leading-none tracking-tight text-white">
          {value}
        </span>
        {hint && (
          <span className="rounded-md border border-white/[0.06] bg-white/[0.03] px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
            {hint}
          </span>
        )}
      </div>

      <p className="mt-1.5 truncate text-[11px] text-slate-500">{subtitle}</p>

      {progress !== undefined && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className={cn("progress-bar h-full rounded-full bg-gradient-to-r", theme.bar)}
            style={{ width: `${Math.max(2, Math.min(100, progress))}%` }}
          />
        </div>
      )}
    </Card>
  );
}
