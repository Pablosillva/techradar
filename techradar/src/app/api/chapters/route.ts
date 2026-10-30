import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/chapters?bookId=...
 * Lista capítulos de um livro.
 */
export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const bookId = searchParams.get("bookId");

  const chapters = await prisma.chapter.findMany({
    where: bookId ? { bookId } : {},
    orderBy: { order: "asc" },
  });

  return NextResponse.json({ data: chapters });
}

/**
 * POST /api/chapters
 * Cria um capítulo (apenas o dono do livro).
 */
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const bookId = typeof body.bookId === "string" ? body.bookId : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const order = typeof body.order === "number" ? body.order : 1;

  if (!bookId || !title) {
    return NextResponse.json(
      { error: "bookId e title são obrigatórios" },
      { status: 400 }
    );
  }

  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) {
    return NextResponse.json({ error: "Livro não encontrado" }, { status: 404 });
  }

  const chapter = await prisma.chapter.create({
    data: { bookId, title, order },
  });

  return NextResponse.json({ data: chapter }, { status: 201 });
}
