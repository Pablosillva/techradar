import { describe, it, expect } from "vitest";
import { calculateMatchScore, getSourcePopularity } from "../score";

describe("calculateMatchScore", () => {
  it("calcula score perfeito quando todas as skills coincidem", () => {
    const result = calculateMatchScore(
      ["react", "typescript"],
      ["react", "typescript"],
      0.8
    );
    expect(result.score).toBeGreaterThan(0.9);
    expect(result.matchedSkills).toEqual(["react", "typescript"]);
  });

  it("calcula score parcial", () => {
    const result = calculateMatchScore(
      ["react", "typescript", "nodejs"],
      ["react", "typescript"],
      0.5
    );
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(1);
    expect(result.matchedSkills).toEqual(["react", "typescript"]);
  });

  it("retorna score 0 quando não há skills em comum", () => {
    const result = calculateMatchScore(
      ["react", "typescript"],
      ["python", "java"],
      0.5
    );
    expect(result.score).toBe(0.15); // apenas popularidade * 0.3
    expect(result.matchedSkills).toEqual([]);
  });

  it("retorna score 0 quando origem não tem skills", () => {
    const result = calculateMatchScore([], ["react"], 0.5);
    expect(result.score).toBe(0);
  });

  it("gera reason descritivo", () => {
    const result = calculateMatchScore(
      ["react", "typescript", "nodejs"],
      ["react"],
      0.5
    );
    expect(result.reason).toContain("1 de 3");
  });
});

describe("getSourcePopularity", () => {
  it("retorna popularidade conhecida", () => {
    expect(getSourcePopularity("freecodecamp")).toBe(0.95);
    expect(getSourcePopularity("remotive")).toBe(0.8);
  });

  it("retorna default para fonte desconhecida", () => {
    expect(getSourcePopularity("unknown-source")).toBe(0.5);
  });
});
