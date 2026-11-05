import { describe, expect, it } from "vitest";
import {
  addDays,
  buildDailySeries,
  buildHeatmapSeries,
  clampPercent,
  computeBestStreak,
  computeStreak,
  computeTechProgress,
  dayKey,
  formatMinutes,
  startOfLocalDay,
  startOfLocalWeek,
  sumMinutesBetween,
} from "../helpers";

const NOW = new Date(2026, 10, 5, 12, 0, 0); // quinta-feira, 05/11/2026

function daysAgo(amount: number) {
  return addDays(NOW, -amount);
}

describe("dashboard helpers", () => {
  it("normaliza o início do dia e da semana (segunda)", () => {
    expect(dayKey(startOfLocalDay(NOW))).toBe("2026-11-05");
    expect(dayKey(startOfLocalWeek(NOW))).toBe("2026-11-02");
  });

  it("calcula sequência incluindo hoje", () => {
    const dates = [daysAgo(0), daysAgo(1), daysAgo(2)];
    expect(computeStreak(dates, NOW)).toBe(3);
  });

  it("mantém a sequência quando o usuário ainda não estudou hoje", () => {
    const dates = [daysAgo(1), daysAgo(2), daysAgo(3)];
    expect(computeStreak(dates, NOW)).toBe(3);
  });

  it("quebra a sequência em dias sem estudo", () => {
    const dates = [daysAgo(0), daysAgo(2), daysAgo(3)];
    expect(computeStreak(dates, NOW)).toBe(1);
  });

  it("encontra a maior sequência do histórico", () => {
    const dates = [daysAgo(10), daysAgo(9), daysAgo(8), daysAgo(7), daysAgo(2)];
    expect(computeBestStreak(dates)).toBe(4);
  });

  it("gera série diária contínua de 30 dias", () => {
    const series = buildDailySeries(
      [
        { date: daysAgo(0), minutes: 90 },
        { date: daysAgo(0), minutes: 30 },
        { date: daysAgo(3), minutes: 45 },
      ],
      30,
      NOW
    );

    expect(series).toHaveLength(30);
    expect(series[29].minutes).toBe(120);
    expect(series[26].minutes).toBe(45);
    expect(series[0].minutes).toBe(0);
  });

  it("alinha o heatmap à segunda-feira e zera dias futuros", () => {
    const heatmap = buildHeatmapSeries([{ date: NOW, minutes: 60 }], 5, NOW);

    expect(heatmap).toHaveLength(35);
    expect(dayKey(heatmap[0].date)).toBe("2026-10-05");
    expect(dayKey(heatmap[34].date)).toBe("2026-11-08");
    expect(heatmap[34].minutes).toBe(0); // domingo futuro
  });

  it("soma minutos apenas dentro do intervalo", () => {
    const sessions = [
      { date: daysAgo(1), minutes: 30 },
      { date: daysAgo(0), minutes: 60 },
    ];
    const from = startOfLocalDay(NOW);
    expect(sumMinutesBetween(sessions, from, addDays(from, 1))).toBe(60);
  });

  it("formata minutos e limita percentuais", () => {
    expect(formatMinutes(0)).toBe("0h");
    expect(formatMinutes(45)).toBe("45m");
    expect(formatMinutes(120)).toBe("2h");
    expect(formatMinutes(155)).toBe("2h 35m");
    expect(clampPercent(140)).toBe(100);
    expect(clampPercent(-5)).toBe(0);
    expect(clampPercent(Number.NaN)).toBe(0);
  });

  it("deriva progresso por tecnologia a partir dos itens do roadmap", () => {
    const progress = computeTechProgress([
      { title: "React: componentes", status: "COMPLETED" },
      { title: "React avançado", status: "IN_PROGRESS" },
      { title: "PostgreSQL e modelagem", status: "COMPLETED" },
      { title: "TypeScript na prática", status: "NOT_STARTED" },
    ]);

    const react = progress.find((item) => item.name === "React");
    const postgres = progress.find((item) => item.name === "PostgreSQL");
    const typescript = progress.find((item) => item.name === "TypeScript");

    expect(react).toMatchObject({ total: 2, completed: 1, percent: 50 });
    expect(postgres).toMatchObject({ total: 1, completed: 1, percent: 100 });
    expect(typescript).toMatchObject({ total: 1, completed: 0, percent: 0 });
  });
});
