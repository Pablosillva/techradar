import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/api/auth";
import { ApiError, handleRoute, jsonOk, parseBody } from "@/lib/api/response";
import { cookies } from "next/headers";
import { validateCsrfRequest } from "@/lib/security/csrf";
import { updateStudyContentSchema } from "@/lib/validations/roadmap";

type RouteContext = { params: Promise<{ id: string }> };

/** PATCH /api/admin/study-contents/[id] — atualiza qualquer conteúdo (admin). */
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
    const input = await parseBody(request, updateStudyContentSchema);

    const updated = await prisma.studyContent.updateMany({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.type !== undefined ? { type: input.type } : {}),
        ...(input.content !== undefined ? { content: input.content } : {}),
        ...(input.url !== undefined ? { url: input.url } : {}),
        ...(input.order !== undefined ? { order: input.order } : {}),
      },
    });

    if (updated.count === 0) {
      throw new ApiError(404, "Conteúdo não encontrado", { code: "NOT_FOUND" });
    }

    return jsonOk(await prisma.studyContent.findUnique({ where: { id } }));
  });
}

/** DELETE /api/admin/study-contents/[id] */
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

    const deleted = await prisma.studyContent.deleteMany({ where: { id } });

    if (deleted.count === 0) {
      throw new ApiError(404, "Conteúdo não encontrado", { code: "NOT_FOUND" });
    }

    return jsonOk({ success: true });
  });
}
