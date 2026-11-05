import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api/auth";
import { ApiError, handleRoute, jsonOk, parseBody } from "@/lib/api/response";
import { createSubjectSchema } from "@/lib/validations/learning";

type RouteContext = { params: Promise<{ id: string }> };

const nestedSubjectSchema = createSubjectSchema.omit({ learningPathId: true });

/** POST /api/learning-paths/[id]/subjects */
export async function POST(request: Request, { params }: RouteContext) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id: learningPathId } = await params;
    const input = await parseBody(request, nestedSubjectSchema);

    const path = await prisma.learningPath.findFirst({
      where: { id: learningPathId, userId: user.id },
      select: { id: true },
    });

    if (!path) {
      throw new ApiError(404, "Trilha não encontrada", { code: "NOT_FOUND" });
    }

    const last = await prisma.subject.findFirst({
      where: { learningPathId, userId: user.id },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const subject = await prisma.subject.create({
      data: {
        userId: user.id,
        learningPathId,
        title: input.title,
        description: input.description ?? null,
        order: input.order ?? (last?.order ?? -1) + 1,
      },
    });

    return jsonOk(subject, 201);
  });
}
