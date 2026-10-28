import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reviewCard, type SRSStatus } from "@/lib/srs";

/**
 * PUT /api/flashcards/[id]
 * Registra a avaliação (quality: 0-5) do card e aplica o algoritmo SRS (SM-2).
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
  const quality = Number(body.quality);

  if (Number.isNaN(quality) || quality < 0 || quality > 5) {
    return NextResponse.json({ error: "quality deve ser entre 0 e 5" }, { status: 400 });
  }

  const card = await prisma.flashcard.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!card) {
    return NextResponse.json({ error: "Flashcard não encontrado" }, { status: 404 });
  }

  const next = reviewCard(
    {
      ease: card.ease,
      interval: card.interval,
      repetitions: card.repetitions,
      status: card.status as SRSStatus,
      dueDate: card.dueDate ?? new Date(),
      lastReviewedAt: card.lastReviewedAt ?? new Date(),
    },
    quality
  );

  const updated = await prisma.flashcard.update({
    where: { id },
    data: {
      ease: next.ease,
      interval: next.interval,
      repetitions: next.repetitions,
      status: next.status,
      dueDate: next.dueDate,
      lastReviewedAt: next.lastReviewedAt,
    },
  });

  return NextResponse.json({ data: updated });
}

/**
 * DELETE /api/flashcards/[id]
 * Remove um flashcard.
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

  const deleted = await prisma.flashcard.deleteMany({
    where: { id, userId: session.user.id },
  });

  if (deleted.count === 0) {
    return NextResponse.json({ error: "Flashcard não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
