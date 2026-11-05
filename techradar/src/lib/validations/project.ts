import { z } from "zod";
import { optionalUrlSchema, nullableDateSchema } from "./common";

export const PROJECT_STATUSES = ["PLANNING", "IN_PROGRESS", "REVIEW", "DONE", "PAUSED"] as const;

export const projectStatusSchema = z.enum(PROJECT_STATUSES);

export const createProjectSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(10_000).optional().nullable(),
  status: projectStatusSchema.default("PLANNING"),
  progress: z.coerce.number().int().min(0).max(100).default(0),
  techStack: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  repoUrl: optionalUrlSchema,
  liveUrl: optionalUrlSchema,
  startedAt: nullableDateSchema,
  completedAt: nullableDateSchema,
});

export const updateProjectSchema = createProjectSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Nenhum campo para atualizar",
  });

export const listProjectsQuerySchema = z.object({
  status: projectStatusSchema.optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
