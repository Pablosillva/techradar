import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api/auth";
import { ApiError, handleRoute, jsonOk, parseBody } from "@/lib/api/response";
import { updateTopicSchema } from "@/lib/validations/learning";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await params;
    const input = await parseBody(request, updateTopicSchema);

    if (input.subjectId) {
      const target = await prisma.subject.findFirst({
        where: { id: input.subjectId, userId: user.id },
        select: { id: true },
      });
      if (!target) {
        throw new ApiError(404, "Disciplina de destino não encontrada", { code: "NOT_FOUND" });
      }
    }

    const updated = await prisma.topic.updateMany({
      where: { id, userId: user.id },
      data: {
        ...(input.subjectId !== undefined ? { subjectId: input.subjectId } : {}),
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.order !== undefined ? { order: input.order } : {}),
        ...(input.estimatedMinutes !== undefined
          ? { estimatedMinutes: input.estimatedMinutes }
          : {}),
      },
    });

    if (updated.count === 0) {
      throw new ApiError(404, "Tópico não encontrado", { code: "NOT_FOUND" });
    }

    return jsonOk(await prisma.topic.findUnique({ where: { id } }));
  });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await params;

    const deleted = await prisma.topic.deleteMany({
      where: { id, userId: user.id },
    });

    if (deleted.count === 0) {
      throw new ApiError(404, "Tópico não encontrado", { code: "NOT_FOUND" });
    }

    return jsonOk({ success: true });
  });
}
