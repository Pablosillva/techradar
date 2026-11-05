import { z } from "zod";
import { hexColorSchema, idSchema, optionalUrlSchema } from "./common";

export const ROADMAP_LEVELS = ["beginner", "intermediate", "advanced"] as const;
export const ROADMAP_ITEM_STATUSES = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETED",
  "NEEDS_REVIEW",
] as const;
export const STUDY_CONTENT_TYPES = ["NOTE", "LINK", "VIDEO", "ARTICLE", "PDF"] as const;

export const roadmapLevelSchema = z.enum(ROADMAP_LEVELS);
export const roadmapItemStatusSchema = z.enum(ROADMAP_ITEM_STATUSES);
export const studyContentTypeSchema = z.enum(STUDY_CONTENT_TYPES);

export const createRoadmapSchema = z.object({
  title: z.string().trim().min(3, "Título deve ter ao menos 3 caracteres").max(120),
  description: z.string().trim().max(5000).optional().nullable(),
  goal: z.string().trim().max(2000).optional().nullable(),
  level: roadmapLevelSchema.default("beginner"),
  color: hexColorSchema.optional().nullable(),
  order: z.coerce.number().int().min(0).max(9999).optional(),
});

export const updateRoadmapSchema = createRoadmapSchema
  .partial()
  .extend({ isArchived: z.boolean().optional() });

export const createRoadmapItemSchema = z.object({
  roadmapId: idSchema,
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(5000).optional().nullable(),
  status: roadmapItemStatusSchema.default("NOT_STARTED"),
  order: z.coerce.number().int().min(0).max(9999).optional(),
  estimatedMinutes: z.coerce.number().int().min(1).max(6000).optional().nullable(),
  resourceUrl: optionalUrlSchema,
});

export const updateRoadmapItemSchema = createRoadmapItemSchema
  .omit({ roadmapId: true })
  .partial()
  .extend({ roadmapId: idSchema.optional() });

export const studyContentBaseSchema = z.object({
  roadmapItemId: idSchema,
  title: z.string().trim().min(3).max(160),
  type: studyContentTypeSchema.default("NOTE"),
  content: z.string().max(100_000).optional().nullable(),
  url: optionalUrlSchema,
  order: z.coerce.number().int().min(0).max(9999).optional(),
});

export const createStudyContentSchema = studyContentBaseSchema.refine(
  (data) => Boolean(data.content?.trim() || data.url),
  {
    message: "Informe o conteúdo teórico ou um link",
    path: ["content"],
  }
);

export const updateStudyContentSchema = z
  .object({
    title: z.string().trim().min(3).max(160).optional(),
    type: studyContentTypeSchema.optional(),
    content: z.string().max(100_000).optional().nullable(),
    url: optionalUrlSchema,
    order: z.coerce.number().int().min(0).max(9999).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Nenhum campo para atualizar",
  });

export const listRoadmapsQuerySchema = z.object({
  includeArchived: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
});

export type CreateRoadmapInput = z.infer<typeof createRoadmapSchema>;
export type UpdateRoadmapInput = z.infer<typeof updateRoadmapSchema>;
export type CreateRoadmapItemInput = z.infer<typeof createRoadmapItemSchema>;
export type UpdateRoadmapItemInput = z.infer<typeof updateRoadmapItemSchema>;
export type CreateStudyContentInput = z.infer<typeof createStudyContentSchema>;

/** Criação de trilha pelo admin: exige o dono (userId). */
export const adminCreateRoadmapSchema = createRoadmapSchema.extend({
  userId: idSchema,
});
