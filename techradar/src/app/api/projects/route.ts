import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api/auth";
import { handleRoute, jsonOk, parseBody, parseQuery } from "@/lib/api/response";
import { createProjectSchema, listProjectsQuerySchema } from "@/lib/validations/project";

/** GET /api/projects — projetos do portfólio do usuário. */
export async function GET(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { status } = parseQuery(request, listProjectsQuerySchema);

    const projects = await prisma.project.findMany({
      where: { userId: user.id, ...(status ? { status } : {}) },
      orderBy: [{ updatedAt: "desc" }],
    });

    return jsonOk(projects);
  });
}

/** POST /api/projects */
export async function POST(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser();
    const input = await parseBody(request, createProjectSchema);

    const project = await prisma.project.create({
      data: {
        userId: user.id,
        title: input.title,
        description: input.description ?? null,
        status: input.status,
        progress: input.progress,
        techStack: input.techStack,
        repoUrl: input.repoUrl ?? null,
        liveUrl: input.liveUrl ?? null,
        startedAt: input.startedAt ?? null,
        completedAt: input.completedAt ?? (input.status === "DONE" ? new Date() : null),
      },
    });

    return jsonOk(project, 201);
  });
}
