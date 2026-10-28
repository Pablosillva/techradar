import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/flashcards
 * Lista os flashcards do usuário autenticado.
 * Query: ?due=true → apenas cards pendentes (SRS).
 */
export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const due = searchParams.get("due") === "true";

  const cards = await prisma.flashcard.findMany({
    where: {
      userId: session.user.id,
      ...(due
        ? {
            OR: [
              { status: "NEW" },
              { status: "LEARNING" },
              { dueDate: { lte: new Date() } },
            ],
          }
        : {}),
    },
    orderBy: { dueDate: "asc" },
  });

  return NextResponse.json({ data: cards });
}

/**
 * POST /api/flashcards
 * Cria um flashcard manualmente.
 */
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const front = typeof body.front === "string" ? body.front.trim() : "";
  const back = typeof body.back === "string" ? body.back.trim() : "";

  if (!front || !back) {
    return NextResponse.json(
      { error: "front e back são obrigatórios" },
      { status: 400 }
    );
  }

  const userId = session.user.id as string;

  const card = await prisma.flashcard.create({
    data: {
      userId,
      front,
      back,
      source: body.source ?? "manual",
      sourceNoteId: body.sourceNoteId ?? null,
    },
  });

  return NextResponse.json({ data: card }, { status: 201 });
}
