import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api/auth";
import { ApiError, handleRoute, jsonOk, parseBody, parseQuery } from "@/lib/api/response";
import {
  createStudySessionSchema,
  listStudySessionsQuerySchema,
} from "@/lib/validations/study";

/** GET /api/study-sessions — histórico de estudo do usuário (com filtros de data). */
export async function GET(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { from, to, limit } = parseQuery(request, listStudySessionsQuerySchema);

    const sessions = await prisma.studySession.findMany({
      where: {
        userId: user.id,
        ...(from || to
          ? {
              date: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {}),
              },
            }
          : {}),
      },
      orderBy: { date: "desc" },
      take: limit,
      include: {
        topic: { select: { id: true, title: true } },
        roadmapItem: { select: { id: true, title: true } },
      },
    });

    const totalMinutes = sessions.reduce((sum, session) => sum + session.minutes, 0);

    return jsonOk({ sessions, totalMinutes });
  });
}

/** POST /api/study-sessions — registra uma sessão de estudo. */
export async function POST(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser();
    const input = await parseBody(request, createStudySessionSchema);

    // Valida ownership dos vínculos opcionais antes de gravar.
    if (input.topicId) {
      const topic = await prisma.topic.findFirst({
        where: { id: input.topicId, userId: user.id },
        select: { id: true },
      });
      if (!topic) {
        throw new ApiError(400, "Tópico inválido", { code: "INVALID_REFERENCE" });
      }
    }

    if (input.roadmapItemId) {
      const item = await prisma.roadmapItem.findFirst({
        where: { id: input.roadmapItemId, userId: user.id },
        select: { id: true },
      });
      if (!item) {
        throw new ApiError(400, "Item de roadmap inválido", { code: "INVALID_REFERENCE" });
      }
    }

    const session = await prisma.studySession.create({
      data: {
        userId: user.id,
        topicId: input.topicId ?? null,
        roadmapItemId: input.roadmapItemId ?? null,
        date: input.date ?? new Date(),
        minutes: input.minutes,
        source: input.source,
        notes: input.notes ?? null,
      },
    });

    return jsonOk(session, 201);
  });
}
