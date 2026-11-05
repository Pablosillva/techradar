import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api/auth";
import { handleRoute, jsonOk, parseBody } from "@/lib/api/response";
import { updateSettingsSchema } from "@/lib/validations/user";

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
    const input = await parseBody(request, updateSettingsSchema);

    const settings = await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: input,
      create: { userId: user.id, ...SETTINGS_DEFAULTS, ...input },
    });

    return jsonOk(settings);
  });
}
