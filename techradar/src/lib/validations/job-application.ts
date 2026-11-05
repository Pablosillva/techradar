import { z } from "zod";
import { nullableDateSchema, optionalUrlSchema } from "./common";

export const JOB_APPLICATION_STATUSES = [
  "SAVED",
  "APPLIED",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "WITHDRAWN",
] as const;

export const jobApplicationStatusSchema = z.enum(JOB_APPLICATION_STATUSES);

export const jobApplicationBaseSchema = z.object({
  company: z.string().trim().min(1).max(120),
  role: z.string().trim().min(2).max(160),
  jobUrl: optionalUrlSchema,
  source: z.string().trim().max(80).optional().nullable(),
  location: z.string().trim().max(120).optional().nullable(),
  isRemote: z.boolean().default(true),
  status: jobApplicationStatusSchema.default("SAVED"),
  salaryMin: z.coerce.number().int().min(0).max(10_000_000).optional().nullable(),
  salaryMax: z.coerce.number().int().min(0).max(10_000_000).optional().nullable(),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, "Moeda deve ter 3 letras (ex: BRL)")
    .default("BRL"),
  appliedAt: nullableDateSchema,
  nextStepAt: nullableDateSchema,
  notes: z.string().max(20_000).optional().nullable(),
});

export const createJobApplicationSchema = jobApplicationBaseSchema.refine(
  (data) => data.salaryMin == null || data.salaryMax == null || data.salaryMin <= data.salaryMax,
  { message: "salaryMin não pode ser maior que salaryMax", path: ["salaryMin"] }
);

export const updateJobApplicationSchema = jobApplicationBaseSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Nenhum campo para atualizar",
  });

export const listJobApplicationsQuerySchema = z.object({
  status: jobApplicationStatusSchema.optional(),
});

export type CreateJobApplicationInput = z.infer<typeof createJobApplicationSchema>;
export type UpdateJobApplicationInput = z.infer<typeof updateJobApplicationSchema>;
