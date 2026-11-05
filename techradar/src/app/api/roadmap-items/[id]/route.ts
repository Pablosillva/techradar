import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api/auth";
import { ApiError, handleRoute, jsonOk, parseBody } from "@/lib/api/response";
import { updateRoadmapItemSchema } from "@/lib/validations/roadmap";

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/roadmap-items/[id] — item com conteúdos teóricos. */
export async function GET(_request: Request, { params }: RouteContext) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await params;

    const item = await prisma.roadmapItem.findFirst({
      where: { id, userId: user.id },
      include: {
        contents: { orderBy: { order: "asc" } },
        roadmap: { select: { id: true, title: true } },
      },
    });

    if (!item) {
      throw new ApiError(404, "Item não encontrado", { code: "NOT_FOUND" });
    }

    return jsonOk(item);
  });
}

/** PATCH /api/roadmap-items/[id] — atualiza progresso/conteúdo do item. */
export async function PATCH(request: Request, { params }: RouteContext) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await params;
    const input = await parseBody(request, updateRoadmapItemSchema);

    // Se o item mudar de trilha, a trilha de destino também precisa ser do usuário.
    if (input.roadmapId) {
      const target = await prisma.roadmap.findFirst({
        where: { id: input.roadmapId, userId: user.id },
        select: { id: true },
      });
      if (!target) {
        throw new ApiError(404, "Trilha de destino não encontrada", { code: "NOT_FOUND" });
      }
    }

    const updated = await prisma.roadmapItem.updateMany({
      where: { id, userId: user.id },
      data: {
        ...(input.roadmapId !== undefined ? { roadmapId: input.roadmapId } : {}),
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.order !== undefined ? { order: input.order } : {}),
        ...(input.estimatedMinutes !== undefined
          ? { estimatedMinutes: input.estimatedMinutes }
          : {}),
        ...(input.resourceUrl !== undefined ? { resourceUrl: input.resourceUrl } : {}),
        ...(input.status !== undefined
          ? {
              status: input.status,
              completedAt: input.status === "COMPLETED" ? new Date() : null,
            }
          : {}),
      },
    });

    if (updated.count === 0) {
      throw new ApiError(404, "Item não encontrado", { code: "NOT_FOUND" });
    }

    const item = await prisma.roadmapItem.findUnique({
      where: { id },
      include: { contents: { orderBy: { order: "asc" } } },
    });

    return jsonOk(item);
  });
}

/** DELETE /api/roadmap-items/[id] */
export async function DELETE(_request: Request, { params }: RouteContext) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await params;

    const deleted = await prisma.roadmapItem.deleteMany({
      where: { id, userId: user.id },
    });

    if (deleted.count === 0) {
      throw new ApiError(404, "Item não encontrado", { code: "NOT_FOUND" });
    }

    return jsonOk({ success: true });
  });
}
