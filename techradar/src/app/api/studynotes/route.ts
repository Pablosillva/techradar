import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateFlashcardsFromNote } from "@/lib/ai";

/**
 * GET /api/studynotes
 * Lista as notas do usuário autenticado.
 */
export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const notes = await prisma.studyNote.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: notes });
}

/**
 * POST /api/studynotes
 * Cria uma nota. Se solicitado (generate: true), gera flashcards via IA.
 */
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const markdown = typeof body.markdown === "string" ? body.markdown.trim() : "";
  if (!title || !markdown) {
    return NextResponse.json({ error: "title e markdown são obrigatórios" }, { status: 400 });
  }

  const userId = session.user.id as string;

  const note = await prisma.studyNote.create({
    data: { userId, title, markdown, source: body.source ?? "manual" },
  });

  let generatedCards: { front: string; back: string }[] = [];
  if (body.generate !== false && process.env.ANTHROPIC_API_KEY) {
    const { cards } = await generateFlashcardsFromNote(markdown, body.context);
    generatedCards = cards;

    for (const card of cards) {
      await prisma.flashcard.create({
        data: {
          userId,
          front: card.front,
          back: card.back,
          sourceNoteId: note.id,
          source: "ai",
        },
      });
    }
  }

  return NextResponse.json({ data: note, generatedCards }, { status: 201 });
}
