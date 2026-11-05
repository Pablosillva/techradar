import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api/auth";
import { ApiError, handleRoute, jsonOk, parseBody } from "@/lib/api/response";
import { createRoadmapItemSchema } from "@/lib/validations/roadmap";

type RouteContext = { params: Promise<{ id: string }> };

const nestedItemSchema = createRoadmapItemSchema.omit({ roadmapId: true });

/** POST /api/roadmaps/[id]/items — cria item na trilha do próprio usuário. */
export async function POST(request: Request, { params }: RouteContext) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id: roadmapId } = await params;
    const input = await parseBody(request, nestedItemSchema);

    const roadmap = await prisma.roadmap.findFirst({
      where: { id: roadmapId, userId: user.id },
      select: { id: true },
    });

    if (!roadmap) {
      throw new ApiError(404, "Trilha não encontrada", { code: "NOT_FOUND" });
    }

    const lastItem = await prisma.roadmapItem.findFirst({
      where: { roadmapId, userId: user.id },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const item = await prisma.roadmapItem.create({
      data: {
        userId: user.id,
        roadmapId,
        title: input.title,
        description: input.description ?? null,
        status: input.status,
        order: input.order ?? (lastItem?.order ?? -1) + 1,
        estimatedMinutes: input.estimatedMinutes ?? null,
        resourceUrl: input.resourceUrl ?? null,
        completedAt: input.status === "COMPLETED" ? new Date() : null,
      },
    });

    return jsonOk(item, 201);
  });
}
