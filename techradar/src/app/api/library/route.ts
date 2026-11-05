import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api/auth";
import { handleRoute, jsonOk, parseBody } from "@/lib/api/response";
import { createLibraryItemSchema } from "@/lib/validations/library";

/**
 * GET /api/library
 * Lista itens da biblioteca do usuário autenticado.
 */
export async function GET() {
  return handleRoute(async () => {
    const user = await requireUser();

    const items = await prisma.libraryItem.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    });

    return jsonOk(items);
  });
}

/**
 * POST /api/library
 * Adiciona um livro, PDF ou audiobook à biblioteca do usuário.
 */
export async function POST(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser();
    const input = await parseBody(request, createLibraryItemSchema);

    const item = await prisma.libraryItem.create({
      data: {
        userId: user.id,
        itemType: input.itemType,
        itemId: input.itemId,
        title: input.title ?? null,
        author: input.author ?? null,
        coverUrl: input.coverUrl ?? null,
        fileUrl: input.fileUrl ?? null,
        fileKey: input.fileKey ?? null,
        mimeType: input.mimeType ?? null,
        fileSize: input.fileSize ?? null,
        totalPages: input.totalPages ?? null,
        durationSec: input.durationSec ?? null,
        status: input.status,
        progress: input.status === "completed" ? 100 : 0,
        rating: input.rating ?? null,
        notes: input.notes ?? null,
      },
    });

    return jsonOk(item, 201);
  });
}
