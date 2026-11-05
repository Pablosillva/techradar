import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api/auth";
import { handleRoute, jsonOk, parseBody, parseQuery } from "@/lib/api/response";
import { createNoteSchema, listNotesQuerySchema } from "@/lib/validations/note";

/** GET /api/notes — lista notas do usuário com busca opcional. */
export async function GET(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { q, tagId } = parseQuery(request, listNotesQuerySchema);

    const notes = await prisma.note.findMany({
      where: {
        userId: user.id,
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { markdown: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(tagId ? { tags: { some: { tagId, tag: { userId: user.id } } } } : {}),
      },
      include: { tags: { include: { tag: true } } },
      orderBy: { updatedAt: "desc" },
    });

    return jsonOk(notes);
  });
}

/** POST /api/notes — cria uma nota. */
export async function POST(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser();
    const input = await parseBody(request, createNoteSchema);

    // Só permite vincular tags que pertencem ao próprio usuário.
    let tagIds: string[] = [];
    if (input.tagIds?.length) {
      const ownedTags = await prisma.tag.findMany({
        where: { id: { in: input.tagIds }, userId: user.id },
        select: { id: true },
      });
      tagIds = ownedTags.map((tag) => tag.id);
    }

    const note = await prisma.note.create({
      data: {
        userId: user.id,
        title: input.title,
        markdown: input.markdown ?? "",
        source: input.source ?? "manual",
        ...(tagIds.length ? { tags: { create: tagIds.map((tagId) => ({ tagId })) } } : {}),
      },
      include: { tags: { include: { tag: true } } },
    });

    return jsonOk(note, 201);
  });
}
