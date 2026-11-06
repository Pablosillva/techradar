import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api/auth";
import { ApiError, handleRoute, jsonOk, parseBody } from "@/lib/api/response";
import { updateLibraryItemSchema } from "@/lib/validations/library";
import { deleteStoredFile } from "@/lib/upload";

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/library/[id] — item da biblioteca (somente do dono). */
export async function GET(_request: Request, { params }: RouteContext) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await params;

    const item = await prisma.libraryItem.findFirst({
      where: { id, userId: user.id },
    });

    if (!item) {
      throw new ApiError(404, "Item não encontrado", { code: "NOT_FOUND" });
    }

    return jsonOk(item);
  });
}

/**
 * Atualiza status, progresso, rating, notas e posição de leitura/escuta.
 * A verificação de ownership acontece no próprio UPDATE (userId no where),
 * impedindo que um usuário altere dados de outro mesmo sabendo o ID.
 */
async function updateLibraryItem(request: Request, id: string) {
  const user = await requireUser();
  const input = await parseBody(request, updateLibraryItemSchema);

  // Calcula progresso automaticamente quando a posição é informada.
  let progress = input.progress;
  if (progress === undefined) {
    if (input.currentPage !== undefined && input.totalPages) {
      progress = Math.min(100, Math.round((input.currentPage / input.totalPages) * 100));
    } else if (input.positionSec !== undefined && input.durationSec) {
      progress = Math.min(100, Math.round((input.positionSec / input.durationSec) * 100));
    }
  }

  const updated = await prisma.libraryItem.updateMany({
    where: { id, userId: user.id },
    data: {
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(progress !== undefined ? { progress } : {}),
      ...(input.rating !== undefined ? { rating: input.rating } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.currentPage !== undefined ? { currentPage: input.currentPage } : {}),
      ...(input.positionSec !== undefined ? { positionSec: input.positionSec } : {}),
      ...(input.totalPages !== undefined ? { totalPages: input.totalPages } : {}),
      ...(input.durationSec !== undefined ? { durationSec: input.durationSec } : {}),
      lastAccessedAt: input.lastAccessedAt ?? new Date(),
    },
  });

  if (updated.count === 0) {
    throw new ApiError(404, "Item não encontrado", { code: "NOT_FOUND" });
  }

  return jsonOk(await prisma.libraryItem.findUnique({ where: { id } }));
}

/** PUT /api/library/[id] (compatibilidade) */
export async function PUT(request: Request, { params }: RouteContext) {
  return handleRoute(async () => {
    const { id } = await params;
    return updateLibraryItem(request, id);
  });
}

/** PATCH /api/library/[id] */
export async function PATCH(request: Request, { params }: RouteContext) {
  return handleRoute(async () => {
    const { id } = await params;
    return updateLibraryItem(request, id);
  });
}

/** DELETE /api/library/[id] */
export async function DELETE(_request: Request, { params }: RouteContext) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await params;

    const item = await prisma.libraryItem.findFirst({
      where: { id, userId: user.id },
      select: { fileKey: true },
    });

    if (!item) {
      throw new ApiError(404, "Item não encontrado", { code: "NOT_FOUND" });
    }

    const deleted = await prisma.libraryItem.deleteMany({
      where: { id, userId: user.id },
    });

    if (deleted.count === 0) {
      throw new ApiError(404, "Item não encontrado", { code: "NOT_FOUND" });
    }

    await deleteStoredFile(item.fileKey);

    return jsonOk({ success: true });
  });
}
