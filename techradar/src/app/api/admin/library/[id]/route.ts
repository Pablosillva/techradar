import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/api/auth";
import { ApiError, handleRoute, jsonOk, parseBody } from "@/lib/api/response";
import { cookies } from "next/headers";
import { validateCsrfRequest } from "@/lib/security/csrf";
import { updateLibraryItemSchema } from "@/lib/validations/library";

type RouteContext = { params: Promise<{ id: string }> };

/** PATCH /api/admin/library/[id] — atualiza qualquer item da biblioteca (admin). */
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
    const input = await parseBody(request, updateLibraryItemSchema);

    let progress = input.progress;
    if (progress === undefined) {
      if (input.currentPage !== undefined && input.totalPages) {
        progress = Math.min(100, Math.round((input.currentPage / input.totalPages) * 100));
      } else if (input.positionSec !== undefined && input.durationSec) {
        progress = Math.min(100, Math.round((input.positionSec / input.durationSec) * 100));
      }
    }

    const updated = await prisma.libraryItem.updateMany({
      where: { id },
      data: {
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(progress !== undefined ? { progress } : {}),
        ...(input.rating !== undefined ? { rating: input.rating } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        ...(input.currentPage !== undefined ? { currentPage: input.currentPage } : {}),
        ...(input.positionSec !== undefined ? { positionSec: input.positionSec } : {}),
        ...(input.totalPages !== undefined ? { totalPages: input.totalPages } : {}),
        ...(input.durationSec !== undefined ? { durationSec: input.durationSec } : {}),
        lastAccessedAt: new Date(),
      },
    });

    if (updated.count === 0) {
      throw new ApiError(404, "Item não encontrado", { code: "NOT_FOUND" });
    }

    return jsonOk(await prisma.libraryItem.findUnique({ where: { id } }));
  });
}

/** DELETE /api/admin/library/[id] — remove qualquer item da biblioteca (admin). */
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

    const deleted = await prisma.libraryItem.deleteMany({ where: { id } });

    if (deleted.count === 0) {
      throw new ApiError(404, "Item não encontrado", { code: "NOT_FOUND" });
    }

    return jsonOk({ success: true });
  });
}
