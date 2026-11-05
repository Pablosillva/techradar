import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/api/auth";
import { ApiError, handleRoute, jsonOk, parseBody } from "@/lib/api/response";
import { cookies } from "next/headers";
import { validateCsrfRequest } from "@/lib/security/csrf";
import { createRoadmapItemSchema } from "@/lib/validations/roadmap";

type RouteContext = { params: Promise<{ id: string }> };

const nestedItemSchema = createRoadmapItemSchema.omit({ roadmapId: true });

/** POST /api/admin/roadmaps/[id]/items — cria item em qualquer trilha (admin). */
export async function POST(request: Request, { params }: RouteContext) {
  return handleRoute(async () => {
    await requireAdminUser();

    // CSRF protection
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get("csrf_token")?.value ?? null;
    const csrfValidation = validateCsrfRequest(request, cookieToken);
    if (!csrfValidation.valid) {
      throw new ApiError(403, csrfValidation.reason, { code: "CSRF_INVALID" });
    }

    const { id: roadmapId } = await params;
    const input = await parseBody(request, nestedItemSchema);

    const roadmap = await prisma.roadmap.findUnique({
      where: { id: roadmapId },
      select: { id: true, userId: true },
    });

    if (!roadmap) {
      throw new ApiError(404, "Trilha não encontrada", { code: "NOT_FOUND" });
    }

    const lastItem = await prisma.roadmapItem.findFirst({
      where: { roadmapId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const item = await prisma.roadmapItem.create({
      data: {
        userId: roadmap.userId,
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
