import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/library/[id]
 * Busca um item da biblioteca (dono).
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

  const item = await prisma.libraryItem.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!item) {
    return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ data: item });
}

/**
 * PUT /api/library/[id]
 * Atualiza status, progresso, rating e notas do item.
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
  const status = typeof body.status === "string" ? body.status : undefined;
  const progress =
    typeof body.progress === "number" ? body.progress : undefined;
  const rating = typeof body.rating === "number" ? body.rating : undefined;
  const notes =
    typeof body.notes === "string" ? body.notes.trim() : undefined;

  if (status && !["to_read", "reading", "completed"].includes(status)) {
    return NextResponse.json(
      { error: 'status deve ser "to_read", "reading" ou "completed"' },
      { status: 400 }
    );
  }

  const item = await prisma.libraryItem.update({
    where: { id },
    data: {
      ...(status ? { status } : {}),
      ...(progress !== undefined ? { progress } : {}),
      ...(rating !== undefined ? { rating } : {}),
      ...(notes !== undefined ? { notes } : {}),
    },
  });

  const owned = await prisma.libraryItem.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!owned) {
    return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ data: owned });
}

/**
 * DELETE /api/library/[id]
 * Remove um item da biblioteca.
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

  const deleted = await prisma.libraryItem.deleteMany({
    where: { id, userId: session.user.id },
  });

  if (deleted.count === 0) {
    return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
