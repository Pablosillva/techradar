"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface FlashcardItem {
  id: string;
  userId: string;
  front: string;
  back: string;
  source?: string | null;
  sourceNoteId?: string | null;
  ease: number;
  interval: number;
  repetitions: number;
  status: string;
  dueDate: string | null;
  lastReviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface FlashcardsStudyProps {
  cards: FlashcardItem[];
}

type Quality = 1 | 3 | 4 | 5;

export function FlashcardsStudy({ cards }: FlashcardsStudyProps) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [quality, setQuality] = useState<Quality | null>(null);
  const [saving, setSaving] = useState(false);

  const card = cards[index];

  const goNext = () => {
    setFlipped(false);
    setQuality(null);
    setIndex((i) => Math.min(i + 1, cards.length));
  };

  const rate = async (q: Quality) => {
    if (!card || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/flashcards/${card.id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ quality: q }),
      });
      if (!res.ok) {
        // falha no registro → segue mesmo assim
      }
      goNext();
    } finally {
      setSaving(false);
    }
  };

  if (cards.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Flashcards
        </h1>
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          Nenhum card pendente. Que tal criar uma nota e gerar flashcards com IA?
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Flashcards
        </h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Card {index + 1} de {cards.length}
        </span>
      </div>

      <Card className="mt-6">
        <CardContent className="flex min-h-64 flex-col items-center justify-center gap-6 p-8">
          {!flipped ? (
            <>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {card.front}
              </p>
              <Button onClick={() => setFlipped(true)}>Mostrar resposta</Button>
            </>
          ) : (
            <>
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">Resposta</p>
                <p className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
                  {card.back}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="destructive" disabled={saving} onClick={() => rate(1)}>
                  Errei
                </Button>
                <Button disabled={saving} onClick={() => rate(3)}>
                  Bom
                </Button>
                <Button disabled={saving} onClick={() => rate(5)}>
                  Fácil
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
