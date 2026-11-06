import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api/auth";
import { handleRoute, jsonOk, parseBody, ApiError } from "@/lib/api/response";
import { updateSettingsSchema } from "@/lib/validations/user";
import { cookies } from "next/headers";
import { validateCsrfRequest } from "@/lib/security/csrf";

const SETTINGS_DEFAULTS = {
  theme: "dark",
  locale: "pt-BR",
  timezone: "America/Sao_Paulo",
  dailyGoalMinutes: 240,
  weeklyGoalMinutes: 1200,
  reviewReminders: true,
  emailNotifications: false,
};

/** GET /api/settings — preferências do usuário (cria padrões se não existirem). */
export async function GET() {
  return handleRoute(async () => {
    const user = await requireUser();

    const settings = await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, ...SETTINGS_DEFAULTS },
    });

    return jsonOk(settings);
  });
}

/** PATCH /api/settings */
export async function PATCH(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser();

    // CSRF protection (double-submit cookie + header).
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get("csrf_token")?.value ?? null;
    const csrfValidation = validateCsrfRequest(request, cookieToken);
    if (!csrfValidation.valid) {
      throw new ApiError(403, csrfValidation.reason, { code: "CSRF_INVALID" });
    }

    const input = await parseBody(request, updateSettingsSchema);

    const settings = await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: input,
      create: { userId: user.id, ...SETTINGS_DEFAULTS, ...input },
    });

    return jsonOk(settings);
  });
}
