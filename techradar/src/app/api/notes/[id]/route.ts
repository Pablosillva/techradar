import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateNoteSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  markdown: z.string().optional(),
  source: z.enum(["manual", "ai", "book", "lecture", "highlight"]).optional(),
  tagIds: z.array(z.string()).optional(),
});

/**
 * GET /api/notes/[id]
 * Busca uma nota (dono).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const note = await prisma.studyNote.findFirst({
    where: { id, userId: session.user.id },
    include: {
      tags: { include: { tag: true } },
    },
  });

  if (!note) {
    return NextResponse.json({ error: "Nota não encontrada" }, { status: 404 });
  }

  return NextResponse.json({ data: note });
}

/**
 * PUT /api/notes/[id]
 * Atualiza uma nota.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = updateNoteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { title, markdown, source, tagIds } = parsed.data;

  // Sincroniza tags (substitui completamente)
  await prisma.noteTag.deleteMany({ where: { noteId: id } });

  const note = await prisma.studyNote.update({
    where: { id },
    data: {
      ...(title ? { title } : {}),
      ...(markdown !== undefined ? { markdown } : {}),
      ...(source ? { source } : {}),
      ...(tagIds?.length
        ? {
            tags: {
              create: tagIds.map((tagId) => ({ tagId })),
            },
          }
        : {}),
    },
    include: {
      tags: { include: { tag: true } },
    },
  });

  return NextResponse.json({ data: note });
}

/**
 * DELETE /api/notes/[id]
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const deleted = await prisma.studyNote.deleteMany({
    where: { id, userId: session.user.id },
  });

  if (deleted.count === 0) {
    return NextResponse.json({ error: "Nota não encontrada" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
