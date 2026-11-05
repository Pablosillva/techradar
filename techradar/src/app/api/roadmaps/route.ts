import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api/auth";
import { handleRoute, jsonOk, parseBody, parseQuery } from "@/lib/api/response";
import { createRoadmapSchema, listRoadmapsQuerySchema } from "@/lib/validations/roadmap";

/**
 * GET /api/roadmaps
 * Lista as trilhas do usuário autenticado com progresso calculado.
 */
export async function GET(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { includeArchived } = parseQuery(request, listRoadmapsQuerySchema);

    const roadmaps = await prisma.roadmap.findMany({
      where: {
        userId: user.id,
        ...(includeArchived ? {} : { isArchived: false }),
      },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      include: {
        items: {
          select: { id: true, title: true, status: true, order: true },
          orderBy: { order: "asc" },
        },
      },
    });

    const data = roadmaps.map((roadmap) => {
      const total = roadmap.items.length;
      const completed = roadmap.items.filter((item) => item.status === "COMPLETED").length;

      return {
        ...roadmap,
        progress: total === 0 ? 0 : Math.round((completed / total) * 100),
        completedItems: completed,
        totalItems: total,
      };
    });

    return jsonOk(data);
  });
}

/**
 * POST /api/roadmaps
 * Cria uma trilha de estudo para o usuário autenticado.
 */
export async function POST(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser();
    const input = await parseBody(request, createRoadmapSchema);

    const roadmap = await prisma.roadmap.create({
      data: {
        userId: user.id,
        title: input.title,
        description: input.description ?? null,
        goal: input.goal ?? null,
        level: input.level,
        color: input.color ?? null,
        order: input.order ?? 0,
      },
    });

    return jsonOk(roadmap, 201);
  });
}
