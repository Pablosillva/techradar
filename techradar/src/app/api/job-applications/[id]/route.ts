import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api/auth";
import { ApiError, handleRoute, jsonOk, parseBody } from "@/lib/api/response";
import { updateJobApplicationSchema } from "@/lib/validations/job-application";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await params;

    const application = await prisma.jobApplication.findFirst({
      where: { id, userId: user.id },
    });

    if (!application) {
      throw new ApiError(404, "Candidatura não encontrada", { code: "NOT_FOUND" });
    }

    return jsonOk(application);
  });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await params;
    const input = await parseBody(request, updateJobApplicationSchema);

    const updated = await prisma.jobApplication.updateMany({
      where: { id, userId: user.id },
      data: {
        ...(input.company !== undefined ? { company: input.company } : {}),
        ...(input.role !== undefined ? { role: input.role } : {}),
        ...(input.jobUrl !== undefined ? { jobUrl: input.jobUrl } : {}),
        ...(input.source !== undefined ? { source: input.source } : {}),
        ...(input.location !== undefined ? { location: input.location } : {}),
        ...(input.isRemote !== undefined ? { isRemote: input.isRemote } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.salaryMin !== undefined ? { salaryMin: input.salaryMin } : {}),
        ...(input.salaryMax !== undefined ? { salaryMax: input.salaryMax } : {}),
        ...(input.currency !== undefined ? { currency: input.currency } : {}),
        ...(input.appliedAt !== undefined ? { appliedAt: input.appliedAt } : {}),
        ...(input.nextStepAt !== undefined ? { nextStepAt: input.nextStepAt } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
    });

    if (updated.count === 0) {
      throw new ApiError(404, "Candidatura não encontrada", { code: "NOT_FOUND" });
    }

    return jsonOk(await prisma.jobApplication.findUnique({ where: { id } }));
  });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await params;

    const deleted = await prisma.jobApplication.deleteMany({
      where: { id, userId: user.id },
    });

    if (deleted.count === 0) {
      throw new ApiError(404, "Candidatura não encontrada", { code: "NOT_FOUND" });
    }

    return jsonOk({ success: true });
  });
}
