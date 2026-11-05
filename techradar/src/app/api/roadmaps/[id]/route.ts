import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api/auth";
import { ApiError, handleRoute, jsonOk, parseBody } from "@/lib/api/response";
import { updateRoadmapSchema } from "@/lib/validations/roadmap";

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/roadmaps/[id] — trilha completa (itens + conteúdos). */
export async function GET(_request: Request, { params }: RouteContext) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await params;

    const roadmap = await prisma.roadmap.findFirst({
      where: { id, userId: user.id },
      include: {
        items: {
          orderBy: { order: "asc" },
          include: {
            contents: { orderBy: { order: "asc" } },
          },
        },
      },
    });

    if (!roadmap) {
      throw new ApiError(404, "Trilha não encontrada", { code: "NOT_FOUND" });
    }

    return jsonOk(roadmap);
  });
}

/** PATCH /api/roadmaps/[id] — atualiza apenas trilhas do próprio usuário. */
export async function PATCH(request: Request, { params }: RouteContext) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await params;
    const input = await parseBody(request, updateRoadmapSchema);

    const updated = await prisma.roadmap.updateMany({
      where: { id, userId: user.id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.goal !== undefined ? { goal: input.goal } : {}),
        ...(input.level !== undefined ? { level: input.level } : {}),
        ...(input.color !== undefined ? { color: input.color } : {}),
        ...(input.order !== undefined ? { order: input.order } : {}),
        ...(input.isArchived !== undefined ? { isArchived: input.isArchived } : {}),
      },
    });

    if (updated.count === 0) {
      throw new ApiError(404, "Trilha não encontrada", { code: "NOT_FOUND" });
    }

    const roadmap = await prisma.roadmap.findUnique({ where: { id } });
    return jsonOk(roadmap);
  });
}

/** DELETE /api/roadmaps/[id] — remove a trilha (cascade nos itens). */
export async function DELETE(_request: Request, { params }: RouteContext) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await params;

    const deleted = await prisma.roadmap.deleteMany({
      where: { id, userId: user.id },
    });

    if (deleted.count === 0) {
      throw new ApiError(404, "Trilha não encontrada", { code: "NOT_FOUND" });
    }

    return jsonOk({ success: true });
  });
}
