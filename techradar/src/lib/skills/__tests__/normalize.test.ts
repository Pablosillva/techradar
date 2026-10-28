import { describe, it, expect } from "vitest";
import { normalizeSkill, normalizeSkills } from "../normalize";

describe("normalizeSkill", () => {
  it("normaliza variações comuns", () => {
    expect(normalizeSkill("reactjs")).toBe("react");
    expect(normalizeSkill("React.js")).toBe("react");
    expect(normalizeSkill("REACT")).toBe("react");
    expect(normalizeSkill("react")).toBe("react");
  });

  it("normaliza aliases", () => {
    expect(normalizeSkill("golang")).toBe("go");
    expect(normalizeSkill("k8s")).toBe("kubernetes");
    expect(normalizeSkill("postgres")).toBe("postgresql");
    expect(normalizeSkill("node")).toBe("nodejs");
  });

  it("retorna null para skills desconhecidas", () => {
    expect(normalizeSkill("unknown-skill-xyz")).toBeNull();
    expect(normalizeSkill("")).toBeNull();
  });

  it("normaliza com espaços e separadores", () => {
    expect(normalizeSkill("react js")).toBe("react");
    expect(normalizeSkill("react-js")).toBe("react");
    expect(normalizeSkill("react_js")).toBe("react");
  });
});

describe("normalizeSkills", () => {
  it("remove duplicatas", () => {
    const result = normalizeSkills(["react", "reactjs", "React"]);
    expect(result).toEqual(["react"]);
  });

  it("remove valores inválidos", () => {
    const result = normalizeSkills(["react", "unknown", "typescript"]);
    expect(result).toContain("react");
    expect(result).toContain("typescript");
    expect(result).not.toContain("unknown");
  });

  it("retorna lista vazia para input vazio", () => {
    expect(normalizeSkills([])).toEqual([]);
  });
});
