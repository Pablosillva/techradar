import { describe, it, expect } from "vitest";
import { extractSkillsFromText } from "../extract";

describe("extractSkillsFromText", () => {
  it("extrai skills de um texto de vaga", () => {
    const text = "We are looking for a Senior React Developer with TypeScript and Node.js experience.";
    const skills = extractSkillsFromText(text);
    expect(skills).toContain("react");
    expect(skills).toContain("typescript");
    expect(skills).toContain("nodejs");
  });

  it("extrai skills com aliases", () => {
    const text = "Experience with ReactJS and Next.js required.";
    const skills = extractSkillsFromText(text);
    expect(skills).toContain("react");
    expect(skills).toContain("nextjs");
  });

  it("retorna lista vazia para texto sem skills", () => {
    const text = "We are looking for a great team player.";
    const skills = extractSkillsFromText(text);
    expect(skills).toEqual([]);
  });

  it("retorna lista vazia para texto vazio", () => {
    expect(extractSkillsFromText("")).toEqual([]);
  });

  it("não duplica skills", () => {
    const text = "React ReactJS react.js";
    const skills = extractSkillsFromText(text);
    expect(skills.filter((s) => s === "react")).toHaveLength(1);
  });
});
