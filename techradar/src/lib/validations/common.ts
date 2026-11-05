import { z } from "zod";

/** Identificador opaco (cuid) recebido de rotas/parametros. */
export const idSchema = z.string().trim().min(1, "ID obrigatório").max(64);

/**
 * URL aceita apenas http/https. Bloqueia `javascript:`, `data:` e `file:`,
 * que são vetores clássicos de XSS quando renderizados em links/iframes.
 */
export const httpUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .refine(
    (value) => {
      try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "URL inválida (use http ou https)" }
  );

export const optionalUrlSchema = httpUrlSchema.optional().nullable();

export const hexColorSchema = z
  .string()
  .regex(/^#(?:[0-9a-fA-F]{3}){1,2}$/, "Cor deve estar em hexadecimal (ex: #0ea5e9)");

export const optionalDateSchema = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.date().optional()
);

export const nullableDateSchema = z.preprocess(
  (value) => (value === "" || value === null ? null : value),
  z.coerce.date().nullable().optional()
);

/** Paginação padrão para listagens (máx. 100 itens por página). */
export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
