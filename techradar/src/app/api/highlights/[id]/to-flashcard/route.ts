import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const toFlashcardSchema = z.object({
  front: z.string().min(1).max(500),
  back: z.string().min(1).max(1000),
});

/**
 * POST /api/highlights/[id]/to-flashcard
 * Cria um flashcard a partir de um destaque.
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
  const parsed = toFlashcardSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const highlight = await prisma.highlight.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!highlight) {
    return NextResponse.json({ error: "Destaque não encontrado" }, { status: 404 });
  }

  const card = await prisma.flashcard.create({
    data: {
      userId: session.user.id as string,
      front: parsed.data.front,
      back: parsed.data.back,
      sourceNoteId: highlight.noteId ?? null,
      source: "code-error", // reutilizando enum-like para destaque de leitura
    },
  });

  return NextResponse.json({ data: card }, { status: 201 });
}
