import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api/auth";
import { handleRoute, jsonOk, parseBody, parseQuery } from "@/lib/api/response";
import {
  createJobApplicationSchema,
  listJobApplicationsQuerySchema,
} from "@/lib/validations/job-application";

/** GET /api/job-applications — acompanhamento de candidaturas. */
export async function GET(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { status } = parseQuery(request, listJobApplicationsQuerySchema);

    const applications = await prisma.jobApplication.findMany({
      where: { userId: user.id, ...(status ? { status } : {}) },
      orderBy: [{ updatedAt: "desc" }],
    });

    return jsonOk(applications);
  });
}

/** POST /api/job-applications */
export async function POST(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser();
    const input = await parseBody(request, createJobApplicationSchema);

    const application = await prisma.jobApplication.create({
      data: {
        userId: user.id,
        company: input.company,
        role: input.role,
        jobUrl: input.jobUrl ?? null,
        source: input.source ?? null,
        location: input.location ?? null,
        isRemote: input.isRemote,
        status: input.status,
        salaryMin: input.salaryMin ?? null,
        salaryMax: input.salaryMax ?? null,
        currency: input.currency,
        appliedAt: input.appliedAt ?? null,
        nextStepAt: input.nextStepAt ?? null,
        notes: input.notes ?? null,
      },
    });

    return jsonOk(application, 201);
  });
}
