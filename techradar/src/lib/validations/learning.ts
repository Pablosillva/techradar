import { z } from "zod";
import { idSchema } from "./common";
import { roadmapItemStatusSchema } from "./roadmap";

export const learningLevelSchema = z.enum(["beginner", "intermediate", "advanced"]);

export const createLearningPathSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(5000).optional().nullable(),
  level: learningLevelSchema.default("beginner"),
  order: z.coerce.number().int().min(0).max(9999).optional(),
});

export const updateLearningPathSchema = createLearningPathSchema
  .partial()
  .extend({ isArchived: z.boolean().optional() });

export const createSubjectSchema = z.object({
  learningPathId: idSchema,
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(5000).optional().nullable(),
  order: z.coerce.number().int().min(0).max(9999).optional(),
});

export const updateSubjectSchema = createSubjectSchema
  .omit({ learningPathId: true })
  .partial()
  .extend({ learningPathId: idSchema.optional() });

export const createTopicSchema = z.object({
  subjectId: idSchema,
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(5000).optional().nullable(),
  status: roadmapItemStatusSchema.default("NOT_STARTED"),
  order: z.coerce.number().int().min(0).max(9999).optional(),
  estimatedMinutes: z.coerce.number().int().min(1).max(6000).optional().nullable(),
});

export const updateTopicSchema = createTopicSchema
  .omit({ subjectId: true })
  .partial()
  .extend({ subjectId: idSchema.optional() });

export type CreateLearningPathInput = z.infer<typeof createLearningPathSchema>;
export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type CreateTopicInput = z.infer<typeof createTopicSchema>;
