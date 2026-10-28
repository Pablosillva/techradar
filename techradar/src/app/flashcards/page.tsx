import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FlashcardsStudy, type FlashcardItem } from "@/components/study/flashcards-study";
import { Card, CardContent } from "@/components/ui/card";

export default async function FlashcardsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/entrar");
  }

  const now = new Date();
  const [cards, totalCards, learningCards] = await Promise.all([
    prisma.flashcard.findMany({
      where: {
        userId: session.user.id,
        OR: [{ status: "NEW" }, { status: "LEARNING" }, { dueDate: { lte: now } }],
      },
      orderBy: { dueDate: "asc" },
    }),
    prisma.flashcard.count({ where: { userId: session.user.id } }),
    prisma.flashcard.count({
      where: { userId: session.user.id, status: { in: ["NEW", "LEARNING"] } },
    }),
  ]);

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

  return (
    <>
      {/* Painel de progresso */}
      <div className="mx-auto max-w-2xl px-4 pt-8 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total de cards</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {totalCards}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-gray-500 dark:text-gray-400">Pendentes (NEW/LEARNING)</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {learningCards}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-gray-500 dark:text-gray-400">Para revisar</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {cards.length}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <FlashcardsStudy cards={items} />
    </>
  );
}
