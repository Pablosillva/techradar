import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api/auth";
import { ApiError, handleRoute, jsonOk, parseBody } from "@/lib/api/response";
import { updateStudySessionSchema } from "@/lib/validations/study";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await params;
    const input = await parseBody(request, updateStudySessionSchema);

    const updated = await prisma.studySession.updateMany({
      where: { id, userId: user.id },
      data: {
        ...(input.date !== undefined ? { date: input.date } : {}),
        ...(input.minutes !== undefined ? { minutes: input.minutes } : {}),
        ...(input.source !== undefined ? { source: input.source } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
    });

    if (updated.count === 0) {
      throw new ApiError(404, "Sessão não encontrada", { code: "NOT_FOUND" });
    }

    return jsonOk(await prisma.studySession.findUnique({ where: { id } }));
  });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await params;

    const deleted = await prisma.studySession.deleteMany({
      where: { id, userId: user.id },
    });

    if (deleted.count === 0) {
      throw new ApiError(404, "Sessão não encontrada", { code: "NOT_FOUND" });
    }

    return jsonOk({ success: true });
  });
}
