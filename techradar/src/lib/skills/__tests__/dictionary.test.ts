import { describe, it, expect } from "vitest";
import { SKILL_DEFINITIONS, ALIAS_TO_SLUG, SLUG_TO_SKILL } from "../dictionary";

describe("SKILL_DEFINITIONS", () => {
  it("tem pelo menos 50 skills", () => {
    expect(SKILL_DEFINITIONS.length).toBeGreaterThanOrEqual(50);
  });

  it("todas têm slug único", () => {
    const slugs = SKILL_DEFINITIONS.map((s) => s.slug);
    const uniqueSlugs = new Set(slugs);
    expect(slugs.length).toBe(uniqueSlugs.size);
  });

  it("todas têm nome", () => {
    for (const skill of SKILL_DEFINITIONS) {
      expect(skill.name.length).toBeGreaterThan(0);
    }
  });

  it("todas têm categoria válida", () => {
    const validCategories = ["frontend", "backend", "devops", "data", "mobile", "soft"];
    for (const skill of SKILL_DEFINITIONS) {
      expect(validCategories).toContain(skill.category);
    }
  });
});

describe("ALIAS_TO_SLUG", () => {
  it("mapeia aliases corretamente", () => {
    expect(ALIAS_TO_SLUG.get("reactjs")).toBe("react");
    expect(ALIAS_TO_SLUG.get("golang")).toBe("go");
    expect(ALIAS_TO_SLUG.get("k8s")).toBe("kubernetes");
  });

  it("mapeia slug para si mesmo", () => {
    expect(ALIAS_TO_SLUG.get("react")).toBe("react");
    expect(ALIAS_TO_SLUG.get("python")).toBe("python");
  });
});

describe("SLUG_TO_SKILL", () => {
  it("retorna definição pelo slug", () => {
    const react = SLUG_TO_SKILL.get("react");
    expect(react).toBeDefined();
    expect(react?.name).toBe("React");
  });
});
