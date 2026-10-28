import { SKILL_DEFINITIONS } from "./dictionary";
import { normalizeSkill } from "./normalize";

/**
 * Extrai skills de um texto usando o dicionário curado.
 * Busca por aliases e slugs no texto (case-insensitive).
 */
export function extractSkillsFromText(text: string): string[] {
  if (!text) return [];

  const lowerText = text.toLowerCase();
  const found = new Set<string>();

  for (const skill of SKILL_DEFINITIONS) {
    // Busca pelo slug
    if (lowerText.includes(skill.slug)) {
      found.add(skill.slug);
      continue;
    }
    // Busca pelos aliases
    for (const alias of skill.aliases) {
      if (lowerText.includes(alias.toLowerCase())) {
        found.add(skill.slug);
        break;
      }
    }
  }

  return Array.from(found);
}

/**
 * Extrai skills de um texto e retorna com contexto (posição no texto).
 * Útil para debug e exibição de "por que esta skill foi identificada".
 */
export function extractSkillsWithPositions(
  text: string
): Array<{ slug: string; position: number }> {
  if (!text) return [];

  const lowerText = text.toLowerCase();
  const results: Array<{ slug: string; position: number }> = [];

  for (const skill of SKILL_DEFINITIONS) {
    const terms = [skill.slug, ...skill.aliases];
    for (const term of terms) {
      const idx = lowerText.indexOf(term.toLowerCase());
      if (idx !== -1) {
        results.push({ slug: skill.slug, position: idx });
        break;
      }
    }
  }

  return results.sort((a, b) => a.position - b.position);
}
