import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/exercises/[id]
 * Busca um exercício (dono).
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

  const exercise = await prisma.exercise.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!exercise) {
    return NextResponse.json({ error: "Exercício não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ data: exercise });
}

/**
 * DELETE /api/exercises/[id]
 * Remove um exercício (e submissões via cascade).
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

  const deleted = await prisma.exercise.deleteMany({
    where: { id, userId: session.user.id },
  });

  if (deleted.count === 0) {
    return NextResponse.json({ error: "Exercício não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
