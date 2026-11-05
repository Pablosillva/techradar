import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api/auth";
import { ApiError, handleRoute, jsonOk, parseBody } from "@/lib/api/response";
import { updateLearningPathSchema } from "@/lib/validations/learning";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await params;

    const path = await prisma.learningPath.findFirst({
      where: { id, userId: user.id },
      include: {
        subjects: {
          orderBy: { order: "asc" },
          include: { topics: { orderBy: { order: "asc" } } },
        },
      },
    });

    if (!path) {
      throw new ApiError(404, "Trilha não encontrada", { code: "NOT_FOUND" });
    }

    return jsonOk(path);
  });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await params;
    const input = await parseBody(request, updateLearningPathSchema);

    const updated = await prisma.learningPath.updateMany({
      where: { id, userId: user.id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.level !== undefined ? { level: input.level } : {}),
        ...(input.order !== undefined ? { order: input.order } : {}),
        ...(input.isArchived !== undefined ? { isArchived: input.isArchived } : {}),
      },
    });

    if (updated.count === 0) {
      throw new ApiError(404, "Trilha não encontrada", { code: "NOT_FOUND" });
    }

    return jsonOk(await prisma.learningPath.findUnique({ where: { id } }));
  });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await params;

    const deleted = await prisma.learningPath.deleteMany({
      where: { id, userId: user.id },
    });

    if (deleted.count === 0) {
      throw new ApiError(404, "Trilha não encontrada", { code: "NOT_FOUND" });
    }

    return jsonOk({ success: true });
  });
}
