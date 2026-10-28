import { ALIAS_TO_SLUG } from "./dictionary";

/**
 * Normaliza um termo de skill para o slug canônico.
 * Ex: "reactjs" → "react", "React.js" → "react", "K8s" → "kubernetes"
 */
export function normalizeSkill(raw: string): string | null {
  const cleaned = raw
    .toLowerCase()
    .trim()
    .replace(/[._\-\s]+/g, " ") // separadores viram espaço
    .replace(/\s+/g, " "); // espaços múltiplos viram um

  // Busca direta no mapa de aliases
  const slug = ALIAS_TO_SLUG.get(cleaned);
  if (slug) return slug;

  // Tenta sem espaços (ex: "reactjs" sem espaço)
  const noSpaces = cleaned.replace(/\s/g, "");
  const slugNoSpaces = ALIAS_TO_SLUG.get(noSpaces);
  if (slugNoSpaces) return slugNoSpaces;

  return null;
}

/**
 * Normaliza uma lista de skills, removendo duplicatas e valores inválidos.
 */
export function normalizeSkills(rawSkills: string[]): string[] {
  const slugs = new Set<string>();
  for (const raw of rawSkills) {
    const slug = normalizeSkill(raw);
    if (slug) slugs.add(slug);
  }
  return Array.from(slugs);
}
