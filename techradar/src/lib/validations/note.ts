import { z } from "zod";

export const NOTE_SOURCES = ["manual", "ai", "book", "lecture", "highlight"] as const;

export const noteSourceSchema = z.enum(NOTE_SOURCES);

export const createNoteSchema = z.object({
  title: z.string().trim().min(1, "Título obrigatório").max(200),
  markdown: z.string().max(200_000).optional().default(""),
  source: noteSourceSchema.optional(),
  tagIds: z.array(z.string().trim().min(1).max(64)).max(30).optional(),
});

export const updateNoteSchema = createNoteSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Nenhum campo para atualizar",
  });

export const listNotesQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  tagId: z.string().trim().max(64).optional(),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
