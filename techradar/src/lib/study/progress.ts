/** Cálculos puros de progresso e formatação de tempo para leitores. */

/** Progresso percentual (0-100) a partir da posição e duração. */
export function calculateProgress(
  positionSec: number | null | undefined,
  durationSec: number | null | undefined,
): number {
  if (!durationSec || durationSec <= 0) return 0;
  if (!positionSec || positionSec <= 0) return 0;
  return Math.min(100, Math.round((positionSec / durationSec) * 100));
}

/** Formata segundos como "M:SS" ou "H:MM:SS". */
export function formatTime(seconds: number | null | undefined): string {
  const total = Math.max(0, Math.floor(seconds ?? 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Arredonda posição para salvar no banco (evita atualizações excessivas). */
export function roundPosition(seconds: number | null | undefined): number | null {
  if (!seconds || seconds <= 0) return null;
  return Math.round(seconds * 10) / 10;
}
