import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/api/auth";
import { ApiError, handleRoute, jsonOk, parseBody } from "@/lib/api/response";
import { cookies } from "next/headers";
import { validateCsrfRequest } from "@/lib/security/csrf";
import { updateRoadmapItemSchema } from "@/lib/validations/roadmap";

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/admin/roadmap-items/[id] — item com conteúdos (admin: ignora ownership). */
export async function GET(_request: Request, { params }: RouteContext) {
  return handleRoute(async () => {
    await requireAdminUser();
    const { id } = await params;

    const item = await prisma.roadmapItem.findUnique({
      where: { id },
      include: {
        contents: { orderBy: { order: "asc" } },
        roadmap: { select: { id: true, title: true, userId: true } },
      },
    });

    if (!item) {
      throw new ApiError(404, "Item não encontrado", { code: "NOT_FOUND" });
    }

    return jsonOk(item);
  });
}

/** PATCH /api/admin/roadmap-items/[id] — atualiza qualquer item. */
export async function PATCH(request: Request, { params }: RouteContext) {
  return handleRoute(async () => {
    await requireAdminUser();

    // CSRF protection
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get("csrf_token")?.value ?? null;
    const csrfValidation = validateCsrfRequest(request, cookieToken);
    if (!csrfValidation.valid) {
      throw new ApiError(403, csrfValidation.reason, { code: "CSRF_INVALID" });
    }

    const { id } = await params;
    const input = await parseBody(request, updateRoadmapItemSchema);

    let targetUserId: string | undefined;

    if (input.roadmapId) {
      const target = await prisma.roadmap.findUnique({
        where: { id: input.roadmapId },
        select: { id: true, userId: true },
      });
      if (!target) {
        throw new ApiError(404, "Trilha de destino não encontrada", { code: "NOT_FOUND" });
      }
      targetUserId = target.userId;
    }

    const updated = await prisma.roadmapItem.updateMany({
      where: { id },
      data: {
        ...(input.roadmapId !== undefined ? { roadmapId: input.roadmapId } : {}),
        ...(targetUserId ? { userId: targetUserId } : {}),
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

    // Mantém o ownership dos conteúdos coerente com a trilha de destino.
    if (targetUserId) {
      await prisma.studyContent.updateMany({
        where: { roadmapItemId: id },
        data: { userId: targetUserId },
      });
    }

    return jsonOk(await prisma.roadmapItem.findUnique({ where: { id } }));
  });
}

/** DELETE /api/admin/roadmap-items/[id] */
export async function DELETE(_request: Request, { params }: RouteContext) {
  return handleRoute(async () => {
    await requireAdminUser();

    // CSRF protection
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get("csrf_token")?.value ?? null;
    const csrfValidation = validateCsrfRequest(_request, cookieToken);
    if (!csrfValidation.valid) {
      throw new ApiError(403, csrfValidation.reason, { code: "CSRF_INVALID" });
    }

    const { id } = await params;

    const deleted = await prisma.roadmapItem.deleteMany({ where: { id } });

    if (deleted.count === 0) {
      throw new ApiError(404, "Item não encontrado", { code: "NOT_FOUND" });
    }

    return jsonOk({ success: true });
  });
}
