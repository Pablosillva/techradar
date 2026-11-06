import { z } from "zod";
import { idSchema, optionalDateSchema, optionalUrlSchema } from "./common";

export const LIBRARY_ITEM_TYPES = ["book", "audiobook", "pdf"] as const;
export const LIBRARY_STATUSES = ["to_read", "reading", "completed"] as const;

export const libraryItemTypeSchema = z.enum(LIBRARY_ITEM_TYPES);
export const libraryStatusSchema = z.enum(LIBRARY_STATUSES);

/**
 * Referência de arquivo: URL http(s) ou caminho interno da aplicação
 * (ex: /api/documents/<id>/file). Nunca aceita javascript:/data:.
 */
export const fileRefSchema = z
  .string()
  .trim()
  .max(2048)
  .refine(
    (value) => {
      if (value.startsWith("/")) return !value.startsWith("//");
      try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "Referência de arquivo inválida" }
  );

export const createLibraryItemSchema = z.object({
  itemType: libraryItemTypeSchema,
  itemId: z.string().trim().min(1).max(128),
  title: z.string().trim().max(200).optional().nullable(),
  author: z.string().trim().max(200).optional().nullable(),
  coverUrl: optionalUrlSchema,
  fileUrl: fileRefSchema.optional().nullable(),
  fileKey: z.string().trim().max(512).optional().nullable(),
  mimeType: z.string().trim().max(120).optional().nullable(),
  fileSize: z.coerce.number().int().min(0).max(100 * 1024 * 1024).optional().nullable(),
  totalPages: z.coerce.number().int().min(0).max(100_000).optional().nullable(),
  durationSec: z.coerce.number().int().min(0).max(1_000_000).optional().nullable(),
  status: libraryStatusSchema.default("to_read"),
  rating: z.coerce.number().int().min(1).max(5).optional().nullable(),
  notes: z.string().max(20_000).optional().nullable(),
});

export const updateLibraryItemSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    author: z.string().trim().max(200).optional().nullable(),
    status: libraryStatusSchema.optional(),
    progress: z.coerce.number().int().min(0).max(100).optional(),
    rating: z.coerce.number().int().min(1).max(5).optional().nullable(),
    notes: z.string().max(20_000).optional().nullable(),
    currentPage: z.coerce.number().int().min(0).max(100_000).optional(),
    positionSec: z.coerce.number().int().min(0).max(1_000_000).optional(),
    totalPages: z.coerce.number().int().min(0).max(100_000).optional().nullable(),
    durationSec: z.coerce.number().int().min(0).max(1_000_000).optional().nullable(),
    lastAccessedAt: optionalDateSchema,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Nenhum campo para atualizar",
  });

export const libraryIdSchema = idSchema;

export type CreateLibraryItemInput = z.infer<typeof createLibraryItemSchema>;
export type UpdateLibraryItemInput = z.infer<typeof updateLibraryItemSchema>;
