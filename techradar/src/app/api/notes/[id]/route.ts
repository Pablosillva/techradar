import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api/auth";
import { ApiError, handleRoute, jsonOk, parseBody } from "@/lib/api/response";
import { updateNoteSchema } from "@/lib/validations/note";

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/notes/[id] — busca uma nota do próprio usuário. */
export async function GET(_request: Request, { params }: RouteContext) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await params;

    const note = await prisma.note.findFirst({
      where: { id, userId: user.id },
      include: { tags: { include: { tag: true } } },
    });

    if (!note) {
      throw new ApiError(404, "Nota não encontrada", { code: "NOT_FOUND" });
    }

    return jsonOk(note);
  });
}

/** PUT /api/notes/[id] — atualiza somente notas do próprio usuário. */
export async function PUT(request: Request, { params }: RouteContext) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await params;
    const input = await parseBody(request, updateNoteSchema);

    // Verifica ownership ANTES de tocar em qualquer relação (evita IDOR).
    const owned = await prisma.note.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });

    if (!owned) {
      throw new ApiError(404, "Nota não encontrada", { code: "NOT_FOUND" });
    }

    let tagIds: string[] | undefined;
    if (input.tagIds) {
      const ownedTags = await prisma.tag.findMany({
        where: { id: { in: input.tagIds }, userId: user.id },
        select: { id: true },
      });
      tagIds = ownedTags.map((tag) => tag.id);
    }

    const note = await prisma.$transaction(async (tx) => {
      if (tagIds) {
        await tx.noteTag.deleteMany({ where: { noteId: id } });
      }

      return tx.note.update({
        where: { id },
        data: {
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.markdown !== undefined ? { markdown: input.markdown } : {}),
          ...(input.source !== undefined ? { source: input.source } : {}),
          ...(tagIds?.length ? { tags: { create: tagIds.map((tagId) => ({ tagId })) } } : {}),
        },
        include: { tags: { include: { tag: true } } },
      });
    });

    return jsonOk(note);
  });
}

/** DELETE /api/notes/[id] */
export async function DELETE(_request: Request, { params }: RouteContext) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await params;

    const deleted = await prisma.note.deleteMany({
      where: { id, userId: user.id },
    });

    if (deleted.count === 0) {
      throw new ApiError(404, "Nota não encontrada", { code: "NOT_FOUND" });
    }

    return jsonOk({ success: true });
  });
}
