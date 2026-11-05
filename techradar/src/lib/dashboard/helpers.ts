/**
 * Helpers puros do dashboard (sem I/O) — fáceis de testar.
 * Todas as datas são tratadas no fuso local do servidor.
 */

export const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfLocalDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function addDays(date: Date, amount: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

/** Chave estável por dia local: YYYY-MM-DD. */
export function dayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function startOfLocalWeek(date: Date): Date {
  const base = startOfLocalDay(date);
  const weekDay = base.getDay(); // 0 = domingo
  const diff = (weekDay + 6) % 7; // segunda como início
  return addDays(base, -diff);
}

/** Sequência atual: dias consecutivos com estudo, terminando hoje ou ontem. */
export function computeStreak(dates: Date[], now: Date = new Date()): number {
  const studied = new Set(dates.map(dayKey));
  let cursor = startOfLocalDay(now);

  if (!studied.has(dayKey(cursor))) {
    cursor = addDays(cursor, -1);
  }

  let streak = 0;
  while (studied.has(dayKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

/** Maior sequência dentro do período analisado. */
export function computeBestStreak(dates: Date[]): number {
  const uniqueDays = Array.from(new Set(dates.map(dayKey))).sort();
  let best = 0;
  let current = 0;
  let previous: Date | null = null;

  for (const key of uniqueDays) {
    const [year, month, day] = key.split("-").map(Number);
    const currentDate = new Date(year, month - 1, day);

    if (previous && Math.round((currentDate.getTime() - previous.getTime()) / DAY_MS) === 1) {
      current += 1;
    } else {
      current = 1;
    }

    best = Math.max(best, current);
    previous = currentDate;
  }

  return best;
}

export interface DailyPoint {
  date: Date;
  key: string;
  label: string;
  minutes: number;
}

/**
 * Série diária contínua (inclui dias sem estudo) para o gráfico de 30 dias.
 */
export function buildDailySeries(
  sessions: Array<{ date: Date; minutes: number }>,
  totalDays: number,
  now: Date = new Date()
): DailyPoint[] {
  const totals = new Map<string, number>();

  for (const session of sessions) {
    const key = dayKey(session.date);
    totals.set(key, (totals.get(key) ?? 0) + session.minutes);
  }

  const start = startOfLocalDay(addDays(now, -(totalDays - 1)));

  return Array.from({ length: totalDays }, (_, index) => {
    const date = addDays(start, index);
    const key = dayKey(date);

    return {
      date,
      key,
      label: `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`,
      minutes: totals.get(key) ?? 0,
    };
  });
}

/** Série alinhada ao início da semana (segunda) para o heatmap de 5 semanas. */
export function buildHeatmapSeries(
  sessions: Array<{ date: Date; minutes: number }>,
  weeks: number,
  now: Date = new Date()
): DailyPoint[] {
  const totals = new Map<string, number>();

  for (const session of sessions) {
    const key = dayKey(session.date);
    totals.set(key, (totals.get(key) ?? 0) + session.minutes);
  }

  const start = addDays(startOfLocalWeek(now), -(weeks - 1) * 7);
  const todayKey = dayKey(now);

  return Array.from({ length: weeks * 7 }, (_, index) => {
    const date = addDays(start, index);
    const key = dayKey(date);

    return {
      date,
      key,
      label: `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`,
      minutes: key > todayKey ? 0 : totals.get(key) ?? 0,
    };
  });
}

/** Soma de minutos dentro de um intervalo [from, to). */
export function sumMinutesBetween(
  sessions: Array<{ date: Date; minutes: number }>,
  from: Date,
  to: Date
): number {
  return sessions.reduce((total, session) => {
    const time = session.date.getTime();
    return time >= from.getTime() && time < to.getTime() ? total + session.minutes : total;
  }, 0);
}

/** Formata minutos como "2h 30m" ou "45m". */
export function formatMinutes(minutes: number): string {
  if (minutes <= 0) return "0h";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}m`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}m`;
}

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export const TECH_KEYWORDS = [
  { name: "React", pattern: /react/i, color: "#22d3ee" },
  { name: "TypeScript", pattern: /typescript|\bts\b/i, color: "#60a5fa" },
  { name: "Next.js", pattern: /next(?:\.js)?|app router/i, color: "#a78bfa" },
  { name: "Node.js", pattern: /node(?:\.js)?|express/i, color: "#4ade80" },
  { name: "PostgreSQL", pattern: /postgres|sql/i, color: "#c084fc" },
  { name: "Prisma", pattern: /prisma/i, color: "#38bdf8" },
] as const;

export interface TechProgress {
  name: string;
  color: string;
  total: number;
  completed: number;
  percent: number;
}

/**
 * Deriva o progresso por tecnologia a partir dos itens reais do roadmap.
 * Um item pode contribuir para mais de uma tecnologia (ex: "Next.js + TypeScript").
 */
export function computeTechProgress(
  items: Array<{ title: string; status: string }>
): TechProgress[] {
  const progress = TECH_KEYWORDS.map((tech) => {
    const matches = items.filter((item) => tech.pattern.test(item.title));
    const completed = matches.filter((item) => item.status === "COMPLETED").length;

    return {
      name: tech.name,
      color: tech.color,
      total: matches.length,
      completed,
      percent: matches.length === 0 ? 0 : clampPercent((completed / matches.length) * 100),
    };
  }).filter((tech) => tech.total > 0);

  return progress.sort((a, b) => b.percent - a.percent).slice(0, 5);
}
