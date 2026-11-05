import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api/auth";
import { ApiError, handleRoute, jsonOk, parseBody } from "@/lib/api/response";
import { updateStudyContentSchema } from "@/lib/validations/roadmap";

type RouteContext = { params: Promise<{ id: string }> };

/** PATCH /api/study-contents/[id] */
export async function PATCH(request: Request, { params }: RouteContext) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await params;
    const input = await parseBody(request, updateStudyContentSchema);

    const updated = await prisma.studyContent.updateMany({
      where: { id, userId: user.id },
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

    const content = await prisma.studyContent.findUnique({ where: { id } });
    return jsonOk(content);
  });
}

/** DELETE /api/study-contents/[id] */
export async function DELETE(_request: Request, { params }: RouteContext) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await params;

    const deleted = await prisma.studyContent.deleteMany({
      where: { id, userId: user.id },
    });

    if (deleted.count === 0) {
      throw new ApiError(404, "Conteúdo não encontrado", { code: "NOT_FOUND" });
    }

    return jsonOk({ success: true });
  });
}
