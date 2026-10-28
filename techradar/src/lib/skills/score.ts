/**
 * Algoritmo de score de recomendação do TechRadar.
 *
 * Score = (cobertura de skills × 0.7) + (popularidade da fonte × 0.3)
 *
 * A cobertura é a proporção de skills da entidade de origem que são
 * cobertas pela entidade candidata. A popularidade é um valor 0-1
 * baseado na fonte (ex: freeCodeCamp = 0.9, blog desconhecido = 0.3).
 */

export interface MatchResult {
  score: number;
  matchedSkills: string[];
  reason: string;
}

/**
 * Calcula o score de match entre duas listas de skills.
 */
export function calculateMatchScore(
  originSkills: string[],
  targetSkills: string[],
  sourcePopularity: number = 0.5
): MatchResult {
  if (originSkills.length === 0) {
    return { score: 0, matchedSkills: [], reason: "Sem skills na origem" };
  }

  const origin = new Set(originSkills);
  const target = new Set(targetSkills);
  const matchedSkills = originSkills.filter((s) => target.has(s));

  const coverage = matchedSkills.length / originSkills.length;
  const score = coverage * 0.7 + sourcePopularity * 0.3;

  const reason =
    matchedSkills.length === 0
      ? "Nenhuma skill em comum"
      : `Cobre ${matchedSkills.length} de ${originSkills.length} skills`;

  return {
    score: Math.round(score * 100) / 100,
    matchedSkills,
    reason,
  };
}

/**
 * Popularidade conhecida de fontes (0-1).
 * Fontes mais conhecidas/confiáveis recebem maior peso.
 */
export const SOURCE_POPULARITY: Record<string, number> = {
  // Vagas
  remotive: 0.8,
  arbeitnow: 0.7,
  trampos: 0.6,
  coodesh: 0.6,

  // Cursos
  freecodecamp: 0.95,
  cs50: 0.95,
  coursera: 0.85,
  udemy: 0.75,
  youtube: 0.7,
  classcentral: 0.6,

  // Livros
  openlibrary: 0.7,
  googlebooks: 0.7,
  oreilly: 0.95,
  manning: 0.9,

  // Audiobooks
  librivox: 0.6,
  audible: 0.85,
  storytel: 0.75,
};

/**
 * Retorna a popularidade de uma fonte (default 0.5).
 */
export function getSourcePopularity(source: string): number {
  return SOURCE_POPULARITY[source.toLowerCase()] ?? 0.5;
}
