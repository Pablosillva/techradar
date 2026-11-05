import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api/auth";
import { ApiError, handleRoute, jsonOk, parseBody } from "@/lib/api/response";
import { studyContentBaseSchema } from "@/lib/validations/roadmap";

type RouteContext = { params: Promise<{ id: string }> };

const nestedContentSchema = studyContentBaseSchema
  .omit({ roadmapItemId: true })
  .refine((data) => Boolean(data.content?.trim() || data.url), {
    message: "Informe o conteúdo teórico ou um link",
    path: ["content"],
  });

/** POST /api/roadmap-items/[id]/contents — adiciona conteúdo teórico ao item. */
export async function POST(request: Request, { params }: RouteContext) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id: roadmapItemId } = await params;
    const input = await parseBody(request, nestedContentSchema);

    const item = await prisma.roadmapItem.findFirst({
      where: { id: roadmapItemId, userId: user.id },
      select: { id: true },
    });

    if (!item) {
      throw new ApiError(404, "Item não encontrado", { code: "NOT_FOUND" });
    }

    const lastContent = await prisma.studyContent.findFirst({
      where: { roadmapItemId, userId: user.id },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const content = await prisma.studyContent.create({
      data: {
        userId: user.id,
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
