import { promises as fs } from "fs";
import { randomBytes } from "crypto";
import { join } from "path";

/** Diretório de armazenamento de arquivos de biblioteca (fora da pasta pública). */
export const UPLOAD_DIR = join(process.cwd(), "uploads", "lib");

/** Tamanho máximo por tipo (bytes). */
export const MAX_UPLOAD_SIZE = {
  pdf: 100 * 1024 * 1024, // 100 MB
  audio: 300 * 1024 * 1024, // 300 MB (audiobooks podem ser grandes)
} as const;

export type AcceptedKind = "pdf" | "audio";

export const ACCEPTED_MIMES: Record<string, { kind: AcceptedKind; ext: string }> = {
  "application/pdf": { kind: "pdf", ext: "pdf" },
  "audio/mpeg": { kind: "audio", ext: "mp3" },
  "audio/mp4": { kind: "audio", ext: "m4a" },
  "audio/ogg": { kind: "audio", ext: "ogg" },
  "audio/wav": { kind: "audio", ext: "wav" },
  "audio/flac": { kind: "audio", ext: "flac" },
} as const;

/** Detecta o tipo real pelo magic number (cabeçalho binário), nunca pelo nome/MIME do cliente. */
export function detectFileType(buffer: Buffer): { kind: AcceptedKind; mime: string; ext: string } | null {
  // MP3: ID3 header (apenas 3 bytes necessários)
  if (
    buffer.length >= 3 &&
    buffer[0] === 0x49 &&
    buffer[1] === 0x44 &&
    buffer[2] === 0x33
  ) {
    return { kind: "audio", mime: "audio/mpeg", ext: "mp3" };
  }

  // MP3: sincronismo de quadro MPEG (apenas 2 bytes necessários: 0xFF 0xEx)
  if (buffer.length >= 2 && buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) {
    return { kind: "audio", mime: "audio/mpeg", ext: "mp3" };
  }

  if (buffer.length < 4) return null;

  // PDF: %PDF (4 bytes)
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return { kind: "pdf", mime: "application/pdf", ext: "pdf" };
  }

  // FLAC: fLaC (4 bytes)
  if (
    buffer[0] === 0x66 &&
    buffer[1] === 0x4c &&
    buffer[2] === 0x61 &&
    buffer[3] === 0x43
  ) {
    return { kind: "audio", mime: "audio/flac", ext: "flac" };
  }

  // OGG: OggS (4 bytes)
  if (
    buffer[0] === 0x4f &&
    buffer[1] === 0x67 &&
    buffer[2] === 0x67 &&
    buffer[3] === 0x53
  ) {
    return { kind: "audio", mime: "audio/ogg", ext: "ogg" };
  }

  // WAV: RIFF .... WAVE (12 bytes)
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x41 &&
    buffer[10] === 0x56 &&
    buffer[11] === 0x45
  ) {
    return { kind: "audio", mime: "audio/wav", ext: "wav" };
  }

  // ISO BMFF (M4A/AAC): caixa "ftyp" no offset 4 (12 bytes)
  if (
    buffer.length >= 12 &&
    buffer[4] === 0x66 &&
    buffer[5] === 0x74 &&
    buffer[6] === 0x79 &&
    buffer[7] === 0x70
  ) {
    return { kind: "audio", mime: "audio/mp4", ext: "m4a" };
  }

  return null;
}

export function maxSizeFor(kind: AcceptedKind): number {
  return MAX_UPLOAD_SIZE[kind];
}

export function storagePath(fileName: string): string {
  return join(UPLOAD_DIR, fileName);
}

export async function ensureUploadDir(): Promise<void> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

export function generateFileKey(ext: string): string {
  return `${randomBytes(16).toString("hex")}.${ext}`;
}

/**
 * Remove o arquivo físico correspondente à chave, com validação de formato.
 * Silencioso quando o arquivo já não existe (idempotente).
 */
export async function deleteStoredFile(fileKey: string | null | undefined): Promise<void> {
  if (!fileKey || !/^[a-z0-9]+\.[a-z0-9]+$/i.test(fileKey)) return;
  await fs.unlink(storagePath(fileKey)).catch(() => undefined);
}
