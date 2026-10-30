import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/bookmarks/[id]
 * Busca um marcador (dono).
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

  const bookmark = await prisma.bookmark.findFirst({
    where: { id, userId: session.user.id },
    include: { chapter: true },
  });

  if (!bookmark) {
    return NextResponse.json({ error: "Marcador não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ data: bookmark });
}

/**
 * PUT /api/bookmarks/[id]
 * Atualiza posição e/ou nota do marcador.
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
  const position =
    typeof body.position === "number" ? body.position : undefined;
  const note = typeof body.note === "string" ? body.note.trim() : undefined;

  const bookmark = await prisma.bookmark.update({
    where: { id },
    data: {
      ...(position !== undefined ? { position } : {}),
      ...(note !== undefined ? { note } : {}),
    },
    include: { chapter: true },
  });

  const owned = await prisma.bookmark.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!owned) {
    return NextResponse.json({ error: "Marcador não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ data: bookmark });
}

/**
 * DELETE /api/bookmarks/[id]
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

  const deleted = await prisma.bookmark.deleteMany({
    where: { id, userId: session.user.id },
  });

  if (deleted.count === 0) {
    return NextResponse.json({ error: "Marcador não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
