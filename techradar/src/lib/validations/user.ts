import { z } from "zod";
import { optionalUrlSchema } from "./common";

export const themeSchema = z.enum(["dark", "light", "system"]);

export const updateSettingsSchema = z
  .object({
    theme: themeSchema.optional(),
    locale: z.string().trim().min(2).max(20).optional(),
    timezone: z.string().trim().min(3).max(60).optional(),
    dailyGoalMinutes: z.coerce.number().int().min(15).max(1440).optional(),
    weeklyGoalMinutes: z.coerce.number().int().min(60).max(10_080).optional(),
    reviewReminders: z.boolean().optional(),
    emailNotifications: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Nenhum campo para atualizar",
  });

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    image: optionalUrlSchema,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Nenhum campo para atualizar",
  });

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
