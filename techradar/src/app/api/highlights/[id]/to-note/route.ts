import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const toNoteSchema = z.object({
  title: z.string().min(1).max(200),
  markdown: z.string().optional(),
});

/**
 * POST /api/highlights/[id]/to-note
 * Cria uma StudyNote a partir de um destaque.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = toNoteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const highlight = await prisma.highlight.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!highlight) {
    return NextResponse.json({ error: "Destaque não encontrado" }, { status: 404 });
  }

  const markdown = parsed.data.markdown || `> ${highlight.text}\n\nFonte: página ${highlight.page}`;

  const note = await prisma.studyNote.create({
    data: {
      userId: session.user.id as string,
      title: parsed.data.title,
      markdown,
      source: "highlight",
    },
  });

  // Vincula o destaque à nota
  await prisma.highlight.update({
    where: { id },
    data: { noteId: note.id },
  });

  return NextResponse.json({ data: note }, { status: 201 });
}
