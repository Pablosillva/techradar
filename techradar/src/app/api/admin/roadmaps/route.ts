import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/api/auth";
import { ApiError, handleRoute, jsonOk, parseBody, parseQuery } from "@/lib/api/response";
import { cookies } from "next/headers";
import { validateCsrfRequest } from "@/lib/security/csrf";
import {
  adminCreateRoadmapSchema,
  listRoadmapsQuerySchema,
  updateRoadmapSchema,
} from "@/lib/validations/roadmap";

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/admin/roadmaps — lista todas as trilhas (admin: ignora ownership). */
export async function GET(request: Request) {
  return handleRoute(async () => {
    await requireAdminUser();
    const { includeArchived } = parseQuery(request, listRoadmapsQuerySchema);

    const roadmaps = await prisma.roadmap.findMany({
      where: includeArchived ? {} : { isArchived: false },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: {
          select: { id: true, status: true },
          orderBy: { order: "asc" },
        },
        _count: { select: { items: true } },
      },
    });

    const data = roadmaps.map((roadmap) => {
      const items = roadmap.items as Array<{ status: string }>;
      const total = items.length;
      const completed = items.filter((i) => i.status === "COMPLETED").length;
      return {
        id: roadmap.id,
        title: roadmap.title,
        description: roadmap.description,
        level: roadmap.level,
        color: roadmap.color,
        order: roadmap.order,
        isArchived: roadmap.isArchived,
        owner: roadmap.user,
        itemCount: total,
        completedCount: completed,
        progress: total === 0 ? 0 : Math.round((completed / total) * 100),
        createdAt: roadmap.createdAt,
        updatedAt: roadmap.updatedAt,
      };
    });

    return jsonOk(data);
  });
}

/** POST /api/admin/roadmaps — cria uma trilha para qualquer usuário. */
export async function POST(request: Request) {
  return handleRoute(async () => {
    await requireAdminUser();

    // CSRF protection
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get("csrf_token")?.value ?? null;
    const csrfValidation = validateCsrfRequest(request, cookieToken);
    if (!csrfValidation.valid) {
      throw new ApiError(403, csrfValidation.reason, { code: "CSRF_INVALID" });
    }

    const input = await parseBody(request, adminCreateRoadmapSchema);

    const roadmap = await prisma.roadmap.create({
      data: {
        userId: input.userId,
        title: input.title,
        description: input.description ?? null,
        goal: input.goal ?? null,
        level: input.level,
        color: input.color ?? null,
        order: input.order ?? 0,
      },
    });

    return jsonOk(roadmap, 201);
  });
}
