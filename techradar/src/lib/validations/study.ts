import { z } from "zod";
import { idSchema, optionalDateSchema } from "./common";

export const STUDY_SESSION_SOURCES = ["manual", "pomodoro", "roadmap", "review"] as const;

export const studySessionSourceSchema = z.enum(STUDY_SESSION_SOURCES);

export const createStudySessionSchema = z
  .object({
    topicId: idSchema.optional().nullable(),
    roadmapItemId: idSchema.optional().nullable(),
    date: optionalDateSchema,
    minutes: z.coerce.number().int().min(1).max(1440),
    source: studySessionSourceSchema.default("manual"),
    notes: z.string().max(5000).optional().nullable(),
  })
  .refine((data) => !(data.topicId && data.roadmapItemId), {
    message: "Vincule a sessão a apenas um tópico ou item de roadmap",
    path: ["topicId"],
  });

export const updateStudySessionSchema = z
  .object({
    date: optionalDateSchema,
    minutes: z.coerce.number().int().min(1).max(1440).optional(),
    source: studySessionSourceSchema.optional(),
    notes: z.string().max(5000).optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Nenhum campo para atualizar",
  });

export const listStudySessionsQuerySchema = z.object({
  from: optionalDateSchema,
  to: optionalDateSchema,
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type CreateStudySessionInput = z.infer<typeof createStudySessionSchema>;
export type UpdateStudySessionInput = z.infer<typeof updateStudySessionSchema>;
