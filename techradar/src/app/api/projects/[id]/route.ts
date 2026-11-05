import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api/auth";
import { ApiError, handleRoute, jsonOk, parseBody } from "@/lib/api/response";
import { updateProjectSchema } from "@/lib/validations/project";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await params;

    const project = await prisma.project.findFirst({ where: { id, userId: user.id } });

    if (!project) {
      throw new ApiError(404, "Projeto não encontrado", { code: "NOT_FOUND" });
    }

    return jsonOk(project);
  });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await params;
    const input = await parseBody(request, updateProjectSchema);

    const updated = await prisma.project.updateMany({
      where: { id, userId: user.id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.progress !== undefined ? { progress: input.progress } : {}),
        ...(input.techStack !== undefined ? { techStack: input.techStack } : {}),
        ...(input.repoUrl !== undefined ? { repoUrl: input.repoUrl } : {}),
        ...(input.liveUrl !== undefined ? { liveUrl: input.liveUrl } : {}),
        ...(input.startedAt !== undefined ? { startedAt: input.startedAt } : {}),
        ...(input.completedAt !== undefined
          ? { completedAt: input.completedAt }
          : input.status === "DONE"
            ? { completedAt: new Date() }
            : {}),
      },
    });

    if (updated.count === 0) {
      throw new ApiError(404, "Projeto não encontrado", { code: "NOT_FOUND" });
    }

    return jsonOk(await prisma.project.findUnique({ where: { id } }));
  });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await params;

    const deleted = await prisma.project.deleteMany({
      where: { id, userId: user.id },
    });

    if (deleted.count === 0) {
      throw new ApiError(404, "Projeto não encontrado", { code: "NOT_FOUND" });
    }

    return jsonOk({ success: true });
  });
}
