import { describe, it, expect } from "vitest";
import { cn, formatSalary, timeAgo, truncate } from "../utils";

describe("cn", () => {
  it("combina classes", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("mescla classes conflitantes do Tailwind", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("ignora valores falsy", () => {
    expect(cn("foo", false, undefined, null, "bar")).toBe("foo bar");
  });
});

describe("formatSalary", () => {
  it("formata intervalo salarial", () => {
    expect(formatSalary(5000, 10000, "USD")).toContain("$5,000");
    expect(formatSalary(5000, 10000, "USD")).toContain("$10,000");
  });

  it("formata apenas mínimo", () => {
    expect(formatSalary(5000, null, "USD")).toContain("$5,000");
  });

  it("formata apenas máximo", () => {
    expect(formatSalary(null, 10000, "USD")).toContain("$10,000");
  });

  it("retorna null quando não há valores", () => {
    expect(formatSalary(null, null, "USD")).toBeNull();
  });
});

describe("timeAgo", () => {
  it("retorna 'agora mesmo' para datas recentes", () => {
    expect(timeAgo(new Date())).toBe("agora mesmo");
  });

  it("formata minutos", () => {
    const date = new Date(Date.now() - 5 * 60 * 1000);
    expect(timeAgo(date)).toBe("há 5 min");
  });

  it("formata horas", () => {
    const date = new Date(Date.now() - 3 * 60 * 60 * 1000);
    expect(timeAgo(date)).toBe("há 3h");
  });

  it("formata dias", () => {
    const date = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    expect(timeAgo(date)).toBe("há 5d");
  });
});

describe("truncate", () => {
  it("trunca texto longo", () => {
    expect(truncate("Hello World", 5)).toBe("Hello…");
  });

  it("não trunca texto curto", () => {
    expect(truncate("Hello", 10)).toBe("Hello");
  });

  it("retorna vazio para string vazia", () => {
    expect(truncate("", 10)).toBe("");
  });
});
