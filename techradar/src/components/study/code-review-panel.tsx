"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/study/code-editor";

interface CodeReviewPanelProps {
  exerciseId: string;
  language?: string;
  initialCode?: string;
  solutionCode?: string;
}

interface ReviewResult {
  feedback?: string;
  score?: number;
}

type Mode = "starter" | "from-scratch";

export function CodeReviewPanel({
  exerciseId,
  language = "typescript",
  initialCode = "",
  solutionCode = "",
}: CodeReviewPanelProps) {
  const [mode, setMode] = useState<Mode>("starter");
  const [code, setCode] = useState(initialCode);
  const [review, setReview] = useState<ReviewResult | null>(null);
  const [loading, setLoading] = useState(false);

  const switchMode = (next: Mode) => {
    setMode(next);
    setCode(next === "starter" ? initialCode : "");
    setReview(null);
  };

  const submitReview = async () => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/exercises/${exerciseId}/ai-review`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code, solutionCode }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setReview(json.review ?? null);
        if (json.review?.score < 70) {
          await fetch("/api/code-errors", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              exerciseId,
              summary: json.review.feedback ?? "Erro no código.",
              code,
              aiFeedback: json.review.feedback,
            }),
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          variant={mode === "starter" ? "default" : "outline"}
          onClick={() => switchMode("starter")}
        >
          Usar starter
        </Button>
        <Button
          variant={mode === "from-scratch" ? "default" : "outline"}
          onClick={() => switchMode("from-scratch")}
        >
          Digitar do zero
        </Button>
      </div>

      {mode === "from-scratch" ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Modo <strong>digitar do zero</strong>: escreva a solução a partir do enunciado, sem
          starter.
        </p>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Modo <strong>starter</strong>: código inicial fornecido, com possibilidade de editar.
        </p>
      )}

      <CodeEditor value={code} onChange={setCode} language={language} />

      <Button onClick={submitReview} disabled={loading || !code.trim()}>
        {loading ? "Revisando com IA..." : "Solicitar feedback da IA"}
      </Button>

      {review?.feedback ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            Feedback IA {typeof review.score === "number" ? `· Score: ${review.score}/100` : ""}
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
            {review.feedback}
          </p>
        </div>
      ) : null}
    </div>
  );
}
