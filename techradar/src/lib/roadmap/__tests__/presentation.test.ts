import { describe, expect, it } from "vitest";
import {
  CONTENT_TYPE_META,
  LEVEL_META,
  STATUS_META,
  formatDuration,
  safeHttpUrl,
  summarizeOverall,
  summarizeRoadmap,
  trackAccent,
} from "../presentation";
import type { RoadmapDto, RoadmapItemDto } from "../types";

function item(status: RoadmapItemDto["status"], id = Math.random().toString()): RoadmapItemDto {
  return {
    id,
    title: `Item ${id}`,
    description: null,
    status,
    order: 0,
    estimatedMinutes: null,
    resourceUrl: null,
    contents: [],
  };
}

function roadmap(id: string, items: RoadmapItemDto[]): RoadmapDto {
  return {
    id,
    title: `Trilha ${id}`,
    description: null,
    goal: null,
    level: "beginner",
    color: null,
    order: 0,
    items,
  };
}

describe("roadmap presentation", () => {
  it("resume os quatro status e calcula a porcentagem por trilha", () => {
    const summary = summarizeRoadmap({
      items: [
        item("COMPLETED", "1"),
        item("COMPLETED", "2"),
        item("IN_PROGRESS", "3"),
        item("NEEDS_REVIEW", "4"),
        item("NOT_STARTED", "5"),
      ],
    });

    expect(summary).toEqual({
      total: 5,
      completed: 2,
      inProgress: 1,
      needsReview: 1,
      notStarted: 1,
      progress: 40,
    });
  });

  it("retorna progresso zero para trilha vazia", () => {
    expect(summarizeRoadmap({ items: [] })).toMatchObject({
      total: 0,
      progress: 0,
    });
  });

  it("agrega o progresso geral de todas as trilhas", () => {
    const summary = summarizeOverall([
      roadmap("a", [item("COMPLETED", "1"), item("NOT_STARTED", "2")]),
      roadmap("b", [item("COMPLETED", "3")]),
    ]);

    expect(summary.total).toBe(3);
    expect(summary.completed).toBe(2);
    expect(summary.progress).toBe(67);
  });

  it("tem rótulos em português para todos os status exigidos", () => {
    expect(STATUS_META.NOT_STARTED.label).toBe("Não iniciado");
    expect(STATUS_META.IN_PROGRESS.label).toBe("Em andamento");
    expect(STATUS_META.COMPLETED.label).toBe("Concluído");
    expect(STATUS_META.NEEDS_REVIEW.label).toBe("Precisa revisar");
  });

  it("expõe rótulos de níveis e tipos de conteúdo", () => {
    expect(LEVEL_META.beginner.label).toBe("Iniciante");
    expect(LEVEL_META.advanced.label).toBe("Avançado");
    expect(CONTENT_TYPE_META.VIDEO.label).toBe("Vídeo");
    expect(CONTENT_TYPE_META.PDF.label).toBe("PDF");
  });

  it("valida a cor da trilha e formata durações", () => {
    expect(trackAccent("#22d3ee")).toBe("#22d3ee");
    expect(trackAccent("javascript:alert(1)")).toBe("#22d3ee");
    expect(trackAccent(null)).toBe("#22d3ee");
    expect(safeHttpUrl("https://react.dev/learn")).toBe("https://react.dev/learn");
    expect(safeHttpUrl("javascript:alert(1)")).toBeNull();
    expect(safeHttpUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
    expect(safeHttpUrl("")).toBeNull();
    expect(formatDuration(45)).toBe("45 min");
    expect(formatDuration(60)).toBe("1h");
    expect(formatDuration(95)).toBe("1h 35min");
    expect(formatDuration(0)).toBe("");
  });
});
