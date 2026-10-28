import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FlashcardsStudy, type FlashcardItem } from "@/components/study/flashcards-study";

export default async function FlashcardsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/entrar");
  }

  const now = new Date();
  const cards = await prisma.flashcard.findMany({
    where: {
      userId: session.user.id,
      OR: [{ status: "NEW" }, { status: "LEARNING" }, { dueDate: { lte: now } }],
    },
    orderBy: { dueDate: "asc" },
  });

  const items: FlashcardItem[] = cards.map((c) => ({
    id: c.id,
    userId: c.userId,
    front: c.front,
    back: c.back,
    source: c.source,
    sourceNoteId: c.sourceNoteId,
    ease: c.ease,
    interval: c.interval,
    repetitions: c.repetitions,
    status: c.status,
    dueDate: c.dueDate?.toISOString() ?? null,
    lastReviewedAt: c.lastReviewedAt?.toISOString() ?? null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  return <FlashcardsStudy cards={items} />;
}
