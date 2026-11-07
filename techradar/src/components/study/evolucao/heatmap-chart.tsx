"use client";

import { useMemo } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

export function HeatmapChart({ dailyMinutes }: { dailyMinutes: Record<string, number> }) {
  const weeks = useMemo(() => {
    const today = new Date();
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const start = new Date(end);
    start.setDate(end.getDate() - 364);
    start.setDate(start.getDate() - start.getDay());

    const out: Array<Array<{ date: string; day: number; month: number; minutes: number; level: number }>> = [];
    const cursor = new Date(start);

    while (cursor <= end) {
      const week: Array<{ date: string; day: number; month: number; minutes: number; level: number }> = [];
      for (let d = 0; d < 7; d++) {
        const key = cursor.toISOString().slice(0, 10);
        const minutes = dailyMinutes[key] ?? 0;
        const hours = minutes / 60;
        const level = hours <= 0 ? 0 : hours < 1 ? 1 : hours < 2 ? 2 : hours < 3 ? 3 : 4;
        week.push({ date: key, day: cursor.getDay(), month: cursor.getMonth(), minutes, level });
        cursor.setDate(cursor.getDate() + 1);
      }
      out.push(week);
    }
    return out;
  }, [dailyMinutes]);

  const monthLabels = useMemo(() => {
    return weeks.map((w) => {
      const first = w[0];
      return first.month;
    });
  }, [weeks]);

  return (
    <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Mapa de Calor de Atividade
        </h3>
        <span className="flex items-center gap-1 text-[10px] text-cyan-400">
          <Clock className="h-3 w-3" /> Code Commit Graph
        </span>
      </div>

      <div className="w-full overflow-x-auto">
        <div className="min-w-[560px]">
          <div className="mb-1 flex gap-[3px] pl-7">
            {monthLabels.map((m, i) => (
              <span key={i} className="w-[13px] text-center text-[9px] text-slate-500">
                {i === 0 || monthLabels[i - 1] !== m ? MONTHS[m].slice(0, 3) : ""}
              </span>
            ))}
          </div>
          <div className="flex gap-[3px]">
            <div className="flex flex-col gap-[3px]">
              {WEEKDAYS.map((label, i) => (
                <span key={i} className="flex h-[13px] items-center text-[9px] text-slate-600 w-5">
                  {i % 2 === 0 ? label : ""}
                </span>
              ))}
            </div>
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((cell) => {
                  const tooltip = `${Math.round(cell.minutes / 60 * 10) / 10}h estudadas em ${new Date(cell.date + "T12:00:00").toLocaleDateString("pt-BR")}`;
                  return (
                    <div
                      key={cell.date}
                      title={tooltip}
                      className={cn(
                        "h-[13px] w-[13px] rounded-[3px] transition-colors hover:ring-1 hover:ring-cyan-400 cursor-pointer",
                        cell.level === 0 && "bg-[#1e293b]",
                        cell.level === 1 && "bg-cyan-400/25",
                        cell.level === 2 && "bg-cyan-400/50",
                        cell.level === 3 && "bg-cyan-400/80",
                        cell.level === 4 && "bg-cyan-400",
                      )}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-end gap-2 text-[10px] text-slate-500">
            <span>Menos</span>
            <span className="h-[10px] w-[10px] rounded-[3px] bg-[#1e293b]" />
            <span className="h-[10px] w-[10px] rounded-[3px] bg-cyan-400/25" />
            <span className="h-[10px] w-[10px] rounded-[3px] bg-cyan-400/50" />
            <span className="h-[10px] w-[10px] rounded-[3px] bg-cyan-400/80" />
            <span className="h-[10px] w-[10px] rounded-[3px] bg-cyan-400" />
            <span>Mais</span>
          </div>
        </div>
      </div>
    </div>
  );
}
