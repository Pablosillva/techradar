import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMinutes, type DailyPoint } from "@/lib/dashboard/helpers";

interface StudyHeatmapProps {
  days: DailyPoint[];
}

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function intensity(minutes: number): string {
  if (minutes <= 0) return "rgba(148, 163, 184, 0.08)";
  if (minutes < 30) return "rgba(34, 211, 238, 0.20)";
  if (minutes < 60) return "rgba(34, 211, 238, 0.38)";
  if (minutes < 120) return "rgba(34, 211, 238, 0.62)";
  return "rgba(34, 211, 238, 0.95)";
}

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export function StudyHeatmap({ days }: StudyHeatmapProps) {
  const weeks = Math.ceil(days.length / 7);
  const totalMinutes = days.reduce((total, day) => total + day.minutes, 0);
  const activeDays = days.filter((day) => day.minutes > 0).length;

  const first = days[0]?.date;
  const last = days[days.length - 1]?.date;
  const monthLabel = (date?: Date) =>
    date ? `${MONTHS[date.getMonth()]} ${date.getFullYear()}` : "";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-sm">
            <CalendarDays className="h-4 w-4 text-cyan-300" />
            Calendário de Estudos
          </CardTitle>
          <p className="mt-1 text-[11px] text-slate-500">
            {formatMinutes(totalMinutes)} nos últimos {days.length} dias • {activeDays} dias ativos
          </p>
        </div>
        <Link href="/evolucao" className="text-[11px] font-medium text-cyan-300 hover:text-cyan-200">
          Ver detalhes →
        </Link>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex gap-2">
          <div className="flex flex-col justify-between py-0.5 text-[9px] text-slate-600">
            {WEEKDAYS.map((day) => (
              <span key={day} className="h-3.5 leading-3.5">
                {day}
              </span>
            ))}
          </div>

          <div className="flex flex-1 gap-1.5">
            {Array.from({ length: weeks }, (_, weekIndex) => (
              <div key={weekIndex} className="flex flex-1 flex-col gap-1.5">
                {Array.from({ length: 7 }, (_, dayIndex) => {
                  const day = days[weekIndex * 7 + dayIndex];
                  if (!day) return <span key={dayIndex} className="h-3.5" />;

                  return (
                    <span
                      key={day.key}
                      title={`${day.label}: ${formatMinutes(day.minutes)}`}
                      className="h-3.5 w-full rounded-[3px] ring-1 ring-inset ring-white/[0.03] transition-transform hover:scale-110"
                      style={{ backgroundColor: intensity(day.minutes) }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between pl-8 text-[9px] text-slate-600">
          <span>{monthLabel(first)}</span>
          <span>{monthLabel(last)}</span>
        </div>

        <div className="mt-3 flex items-center justify-end gap-1.5 text-[9px] text-slate-600">
          <span>0h</span>
          {[0, 20, 45, 90, 150].map((minutes) => (
            <span
              key={minutes}
              className="h-2.5 w-2.5 rounded-[2px]"
              style={{ backgroundColor: intensity(minutes) }}
            />
          ))}
          <span>8h+</span>
        </div>
      </CardContent>
    </Card>
  );
}
