import { describe, expect, it } from "vitest";
import { calculateProgress, formatTime, roundPosition } from "../progress";

describe("study progress helpers", () => {
  it("calcula progresso percentual entre posição e duração", () => {
    expect(calculateProgress(30, 60)).toBe(50);
    expect(calculateProgress(0, 60)).toBe(0);
    expect(calculateProgress(60, 60)).toBe(100);
    expect(calculateProgress(120, 60)).toBe(100); // limitado a 100
  });

  it("retorna zero quando duração ausente ou inválida", () => {
    expect(calculateProgress(30, 0)).toBe(0);
    expect(calculateProgress(30, null)).toBe(0);
    expect(calculateProgress(null, 60)).toBe(0);
  });

  it("formata tempo como M:SS e H:MM:SS", () => {
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(45)).toBe("0:45");
    expect(formatTime(65)).toBe("1:05");
    expect(formatTime(3665)).toBe("1:01:05");
    expect(formatTime(null)).toBe("0:00");
  });

  it("arredonda posição para salvar", () => {
    expect(roundPosition(12.34)).toBe(12.3);
    expect(roundPosition(0)).toBeNull();
    expect(roundPosition(null)).toBeNull();
  });
});
