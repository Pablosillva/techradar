/**
 * Algoritmo de repetição espaçada — implementação simplificada do SM-2.
 * (FSRS fica como evolução futura; SM-2 cobre o MVP.)
 */

export type SRSStatus = "NEW" | "LEARNING" | "REVIEW" | "RELEARN";

export interface SRSState {
  ease: number; // fator de facilidade (>= 1.3)
  interval: number; // intervalo em dias
  repetitions: number;
  status: SRSStatus;
  dueDate: Date;
  lastReviewedAt: Date;
}

export const DEFAULT_EASE = 2.5;
export const MIN_EASE = 1.3;
const LEARNING_STEP_MINUTES = 10 * 60 * 1000;

export function createSRSState(): SRSState {
  return {
    ease: DEFAULT_EASE,
    interval: 0,
    repetitions: 0,
    status: "NEW",
    dueDate: new Date(),
    lastReviewedAt: new Date(),
  };
}

/**
 * Avalia o card (quality: 0-5, 3+ = passou).
 * Atualiza ease/interval/reps/status conforme o algoritmo SM-2.
 */
export function reviewCard(state: SRSState, quality: number): SRSState {
  const now = new Date();

  if (quality < 3) {
    // Falha → volta para LEARNING com intervalo curto.
    return {
      ...state,
      ease: Math.max(MIN_EASE, state.ease - 0.2),
      interval: 0,
      repetitions: 0,
      status: "LEARNING",
      dueDate: new Date(now.getTime() + LEARNING_STEP_MINUTES),
      lastReviewedAt: now,
    };
  }

  const repetitions = state.repetitions + 1;
  const intervalDays =
    repetitions === 1 ? 1 : Math.max(1, Math.round(state.ease * state.interval));

  const ease =
    Math.max(MIN_EASE, state.ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

  const status: SRSStatus = repetitions >= 2 ? "REVIEW" : "LEARNING";
  const interval = status === "REVIEW" ? intervalDays : intervalDays;

  return {
    ease,
    interval: intervalDays,
    repetitions,
    status,
    dueDate: new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000),
    lastReviewedAt: now,
  };
}

/** Um card está "due" se status é NEW/LEARNING ou se dueDate <= now. */
export function isDue(state: SRSState, now: Date = new Date()): boolean {
  if (state.status === "NEW") return true;
  if (state.status === "LEARNING") return true;
  return state.dueDate <= now;
}
