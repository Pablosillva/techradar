import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api/auth";
import { handleRoute, jsonOk, parseBody } from "@/lib/api/response";
import { createLearningPathSchema } from "@/lib/validations/learning";

/** GET /api/learning-paths — trilhas macro com disciplinas e tópicos. */
export async function GET() {
  return handleRoute(async () => {
    const user = await requireUser();

    const paths = await prisma.learningPath.findMany({
      where: { userId: user.id, isArchived: false },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      include: {
        subjects: {
          orderBy: { order: "asc" },
          include: { topics: { orderBy: { order: "asc" } } },
        },
      },
    });

    return jsonOk(paths);
  });
}

/** POST /api/learning-paths */
export async function POST(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser();
    const input = await parseBody(request, createLearningPathSchema);

    const path = await prisma.learningPath.create({
      data: {
        userId: user.id,
        title: input.title,
        description: input.description ?? null,
        level: input.level,
        order: input.order ?? 0,
      },
    });

    return jsonOk(path, 201);
  });
}
