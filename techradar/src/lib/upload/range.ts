/**
 * Interpreta apenas um range simples de bytes:
 * - `bytes=start-end`
 * - `bytes=start-`  (até o fim)
 * - `bytes=-suffix` (últimos N bytes)
 *
 * Retorna null para ranges múltiplos, inválidos ou fora do arquivo.
 */
export interface ByteRange {
  start: number;
  end: number;
}

export function parseByteRange(header: string, size: number): ByteRange | null {
  if (!Number.isFinite(size) || size <= 0) return null;

  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) return null;

  const [, rawStart, rawEnd] = match;
  if (!rawStart && !rawEnd) return null;

  let start: number;
  let end: number;

  if (!rawStart) {
    const suffix = Number(rawEnd);
    if (!Number.isFinite(suffix) || suffix <= 0) return null;
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(rawStart);
    end = rawEnd ? Number(rawEnd) : size - 1;
    if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  }

  if (start < 0 || end < start || start >= size) return null;

  return { start, end: Math.min(end, size - 1) };
}
