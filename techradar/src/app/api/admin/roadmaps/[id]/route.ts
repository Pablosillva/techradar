import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/api/auth";
import { ApiError, handleRoute, jsonOk, parseBody } from "@/lib/api/response";
import { cookies } from "next/headers";
import { validateCsrfRequest } from "@/lib/security/csrf";
import { updateRoadmapSchema } from "@/lib/validations/roadmap";

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/admin/roadmaps/[id] — trilha completa (admin: ignora ownership). */
export async function GET(_request: Request, { params }: RouteContext) {
  return handleRoute(async () => {
    await requireAdminUser();
    const { id } = await params;

    const roadmap = await prisma.roadmap.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: {
          orderBy: { order: "asc" },
          include: { contents: { orderBy: { order: "asc" } } },
        },
      },
    });

    if (!roadmap) {
      throw new ApiError(404, "Trilha não encontrada", { code: "NOT_FOUND" });
    }

    return jsonOk(roadmap);
  });
}

/** PATCH /api/admin/roadmaps/[id] — atualiza qualquer trilha. */
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
    const input = await parseBody(request, updateRoadmapSchema);

    const updated = await prisma.roadmap.updateMany({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.goal !== undefined ? { goal: input.goal } : {}),
        ...(input.level !== undefined ? { level: input.level } : {}),
        ...(input.color !== undefined ? { color: input.color } : {}),
        ...(input.order !== undefined ? { order: input.order } : {}),
        ...(input.isArchived !== undefined ? { isArchived: input.isArchived } : {}),
      },
    });

    if (updated.count === 0) {
      throw new ApiError(404, "Trilha não encontrada", { code: "NOT_FOUND" });
    }

    return jsonOk(await prisma.roadmap.findUnique({ where: { id } }));
  });
}

/** DELETE /api/admin/roadmaps/[id] — remove qualquer trilha (cascade nos itens). */
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

    const deleted = await prisma.roadmap.deleteMany({ where: { id } });

    if (deleted.count === 0) {
      throw new ApiError(404, "Trilha não encontrada", { code: "NOT_FOUND" });
    }

    return jsonOk({ success: true });
  });
}
