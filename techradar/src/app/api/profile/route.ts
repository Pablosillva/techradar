import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api/auth";
import { handleRoute, jsonOk, parseBody } from "@/lib/api/response";
import { updateProfileSchema } from "@/lib/validations/user";

/** PATCH /api/profile — atualiza nome/avatar do próprio usuário. */
export async function PATCH(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser();
    const input = await parseBody(request, updateProfileSchema);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.image !== undefined ? { image: input.image } : {}),
      },
      select: { id: true, name: true, email: true, image: true, role: true },
    });

    return jsonOk(updated);
  });
}
