import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api/auth";
import { ApiError, handleRoute, jsonOk, parseBody } from "@/lib/api/response";
import { updateSubjectSchema } from "@/lib/validations/learning";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await params;
    const input = await parseBody(request, updateSubjectSchema);

    if (input.learningPathId) {
      const target = await prisma.learningPath.findFirst({
        where: { id: input.learningPathId, userId: user.id },
        select: { id: true },
      });
      if (!target) {
        throw new ApiError(404, "Trilha de destino não encontrada", { code: "NOT_FOUND" });
      }
    }

    const updated = await prisma.subject.updateMany({
      where: { id, userId: user.id },
      data: {
        ...(input.learningPathId !== undefined ? { learningPathId: input.learningPathId } : {}),
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.order !== undefined ? { order: input.order } : {}),
      },
    });

    if (updated.count === 0) {
      throw new ApiError(404, "Disciplina não encontrada", { code: "NOT_FOUND" });
    }

    return jsonOk(await prisma.subject.findUnique({ where: { id } }));
  });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await params;

    const deleted = await prisma.subject.deleteMany({
      where: { id, userId: user.id },
    });

    if (deleted.count === 0) {
      throw new ApiError(404, "Disciplina não encontrada", { code: "NOT_FOUND" });
    }

    return jsonOk({ success: true });
  });
}
