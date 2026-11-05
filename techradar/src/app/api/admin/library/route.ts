import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/api/auth";
import { handleRoute, jsonOk } from "@/lib/api/response";

/** GET /api/admin/library — lista itens da biblioteca de todos os usuários (admin). */
export async function GET() {
  return handleRoute(async () => {
    await requireAdminUser();

    const items = await prisma.libraryItem.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return jsonOk(
      items.map((item) => ({
        id: item.id,
        userId: item.userId,
        owner: item.user,
        itemType: item.itemType,
        title: item.title,
        author: item.author,
        status: item.status,
        progress: item.progress,
        currentPage: item.currentPage,
        totalPages: item.totalPages,
        positionSec: item.positionSec,
        durationSec: item.durationSec,
        rating: item.rating,
        fileUrl: item.fileUrl,
        fileKey: item.fileKey,
        mimeType: item.mimeType,
        fileSize: item.fileSize,
        coverUrl: item.coverUrl,
        notes: item.notes,
        lastAccessedAt: item.lastAccessedAt,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }))
    );
  });
}
