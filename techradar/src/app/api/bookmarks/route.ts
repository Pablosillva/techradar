import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/bookmarks
 * Lista marcadores do usuário.
 */
export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const itemType = searchParams.get("itemType"); // "book" | "audiobook"
  const itemId = searchParams.get("itemId");

  const where: Record<string, unknown> = { userId: session.user.id };
  if (itemType) where.itemType = itemType;
  if (itemId) where.itemId = itemId;

  const bookmarks = await prisma.bookmark.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { chapter: true },
  });

  return NextResponse.json({ data: bookmarks });
}

/**
 * POST /api/bookmarks
 * Cria um marcador de leitura (posição → nota).
 */
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const itemType = typeof body.itemType === "string" ? body.itemType : "";
  const itemId = typeof body.itemId === "string" ? body.itemId : "";
  const position = typeof body.position === "number" ? body.position : 0;
  const note = typeof body.note === "string" ? body.note.trim() : undefined;
  const chapterId =
    typeof body.chapterId === "string" ? body.chapterId : null;

  if (!itemType || !itemId) {
    return NextResponse.json(
      { error: "itemType e itemId são obrigatórios" },
      { status: 400 }
    );
  }

  const bookmark = await prisma.bookmark.create({
    data: {
      userId: session.user.id as string,
      itemType,
      itemId,
      chapterId,
      position,
      note,
    },
    include: { chapter: true },
  });

  return NextResponse.json({ data: bookmark }, { status: 201 });
}
