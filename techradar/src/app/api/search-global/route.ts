import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/search-global?q=...
 * Busca global em notas, livros e flashcards do usuário.
 */
export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  if (!q.trim()) {
    return NextResponse.json({ data: { notes: [], books: [], flashcards: [] } });
  }

  const [notes, books, flashcards] = await Promise.all([
    prisma.studyNote.findMany({
      where: {
        userId: session.user.id,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { markdown: { contains: q, mode: "insensitive" } },
        ],
      },
      include: { tags: { include: { tag: true } } },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    prisma.libraryItem.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    prisma.flashcard.findMany({
      where: {
        userId: session.user.id,
        OR: [
          { front: { contains: q, mode: "insensitive" } },
          { back: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
  ]);

  return NextResponse.json({
    data: { notes, books, flashcards },
  });
}
