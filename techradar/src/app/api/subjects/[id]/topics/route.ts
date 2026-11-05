import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api/auth";
import { ApiError, handleRoute, jsonOk, parseBody } from "@/lib/api/response";
import { createTopicSchema } from "@/lib/validations/learning";

type RouteContext = { params: Promise<{ id: string }> };

const nestedTopicSchema = createTopicSchema.omit({ subjectId: true });

/** POST /api/subjects/[id]/topics */
export async function POST(request: Request, { params }: RouteContext) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id: subjectId } = await params;
    const input = await parseBody(request, nestedTopicSchema);

    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, userId: user.id },
      select: { id: true },
    });

    if (!subject) {
      throw new ApiError(404, "Disciplina não encontrada", { code: "NOT_FOUND" });
    }

    const last = await prisma.topic.findFirst({
      where: { subjectId, userId: user.id },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const topic = await prisma.topic.create({
      data: {
        userId: user.id,
        subjectId,
        title: input.title,
        description: input.description ?? null,
        status: input.status,
        order: input.order ?? (last?.order ?? -1) + 1,
        estimatedMinutes: input.estimatedMinutes ?? null,
      },
    });

    return jsonOk(topic, 201);
  });
}
