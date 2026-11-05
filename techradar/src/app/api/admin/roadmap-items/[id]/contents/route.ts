import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/api/auth";
import { ApiError, handleRoute, jsonOk, parseBody } from "@/lib/api/response";
import { studyContentBaseSchema } from "@/lib/validations/roadmap";

type RouteContext = { params: Promise<{ id: string }> };

const nestedContentSchema = studyContentBaseSchema
  .omit({ roadmapItemId: true })
  .refine((data) => Boolean(data.content?.trim() || data.url), {
    message: "Informe o conteúdo teórico ou um link",
    path: ["content"],
  });

/** POST /api/admin/roadmap-items/[id]/contents — adiciona conteúdo a qualquer item (admin). */
export async function POST(request: Request, { params }: RouteContext) {
  return handleRoute(async () => {
    await requireAdminUser();
    const { id: roadmapItemId } = await params;
    const input = await parseBody(request, nestedContentSchema);

    const item = await prisma.roadmapItem.findUnique({
      where: { id: roadmapItemId },
      select: { id: true, userId: true },
    });

    if (!item) {
      throw new ApiError(404, "Item não encontrado", { code: "NOT_FOUND" });
    }

    const lastContent = await prisma.studyContent.findFirst({
      where: { roadmapItemId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const content = await prisma.studyContent.create({
      data: {
        userId: item.userId,
        roadmapItemId,
        title: input.title,
        type: input.type,
        content: input.content ?? null,
        url: input.url ?? null,
        order: input.order ?? (lastContent?.order ?? -1) + 1,
      },
    });

    return jsonOk(content, 201);
  });
}
