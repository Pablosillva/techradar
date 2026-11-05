import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMinutes, type DailyPoint } from "@/lib/dashboard/helpers";

interface StudyChartProps {
  series: DailyPoint[];
}

interface Point {
  x: number;
  y: number;
  minutes: number;
  label: string;
}

/** Curva suave (Catmull-Rom → Bézier) para o gráfico de área. */
function buildSmoothPath(points: Point[]): string {
  if (points.length === 0) return "";

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let index = 0; index < points.length - 1; index++) {
    const current = points[index];
    const next = points[index + 1];
    const controlX = (current.x + next.x) / 2;

    path += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
  }

  return path;
}

export function StudyChart({ series }: StudyChartProps) {
  const width = 720;
  const height = 232;
  const paddingX = 12;
  const paddingTop = 16;
  const baseline = height - 28;

  const peak = Math.max(60, ...series.map((point) => point.minutes));
  const axisMax = Math.ceil(peak / 60) * 60;

  const points: Point[] = series.map((point, index) => ({
    x: paddingX + (index / Math.max(1, series.length - 1)) * (width - paddingX * 2),
    y: baseline - (point.minutes / axisMax) * (baseline - paddingTop),
    minutes: point.minutes,
    label: point.label,
  }));

  const linePath = buildSmoothPath(points);
  const areaPath = `${linePath} L ${points[points.length - 1]?.x ?? width} ${baseline} L ${points[0]?.x ?? 0} ${baseline} Z`;
  const lastPoint = points[points.length - 1];
  const totalMinutes = series.reduce((total, point) => total + point.minutes, 0);
  const activeDays = series.filter((point) => point.minutes > 0).length;

  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
        <div>
          <CardTitle className="flex items-center gap-2 text-sm">
            <BarChart3 className="h-4 w-4 text-cyan-300" />
            Evolução dos Estudos
          </CardTitle>
          <p className="mt-1 text-[11px] text-slate-500">
            Últimos 30 dias • {formatMinutes(totalMinutes)} • {activeDays} dias ativos
          </p>
        </div>
        <span className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-300">
          Hoje {formatMinutes(series[series.length - 1]?.minutes ?? 0)}
        </span>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex flex-col justify-between pb-7 text-[9px] text-slate-600">
            {[...yTicks].reverse().map((tick) => (
              <span key={tick}>{formatMinutes(Math.round(axisMax * tick))}</span>
            ))}
          </div>

          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-56 w-full pl-7"
            role="img"
            aria-label={`Gráfico de evolução dos estudos nos últimos 30 dias. Total de ${formatMinutes(totalMinutes)}.`}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="study-area" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
              </linearGradient>
            </defs>

            {yTicks.map((tick) => {
              const y = baseline - tick * (baseline - paddingTop);
              return (
                <line
                  key={tick}
                  x1={paddingX}
                  x2={width - paddingX}
                  y1={y}
                  y2={y}
                  stroke="rgba(148, 163, 184, 0.12)"
                  strokeWidth="1"
                  strokeDasharray="4 6"
                />
              );
            })}

            <path d={areaPath} fill="url(#study-area)" />
            <path
              d={linePath}
              fill="none"
              stroke="#22d3ee"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {lastPoint && (
              <>
                <circle cx={lastPoint.x} cy={lastPoint.y} r="5" fill="#070b12" stroke="#22d3ee" strokeWidth="2.5" />
                <circle cx={lastPoint.x} cy={lastPoint.y} r="9" fill="#22d3ee" opacity="0.12" />
              </>
            )}

            {points.map((point) => (
              <circle key={point.label} cx={point.x} cy={point.y} r="7" fill="transparent">
                <title>{`${point.label}: ${formatMinutes(point.minutes)}`}</title>
              </circle>
            ))}
          </svg>

          {lastPoint && lastPoint.minutes > 0 && (
            <div className="pointer-events-none absolute right-8 top-2 rounded-md border border-white/10 bg-[#0d1420] px-2 py-1 text-[10px] font-medium text-cyan-300 shadow-lg">
              {lastPoint.label} • {formatMinutes(lastPoint.minutes)}
            </div>
          )}
        </div>

        <div className="mt-1 flex justify-between pl-7 text-[9px] text-slate-600">
          {series
            .filter((_, index) => index % 5 === 0 || index === series.length - 1)
            .map((point) => (
              <span key={point.key}>{point.label}</span>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
