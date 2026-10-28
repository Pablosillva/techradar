"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/study/code-editor";

interface CodeReviewPanelProps {
  exerciseId: string;
  language?: string;
  initialCode?: string;
}

interface ReviewResult {
  feedback?: string;
  score?: number;
}

export function CodeReviewPanel({
  exerciseId,
  language = "typescript",
  initialCode = "",
}: CodeReviewPanelProps) {
  const [code, setCode] = useState(initialCode);
  const [review, setReview] = useState<ReviewResult | null>(null);
  const [loading, setLoading] = useState(false);

  const submitReview = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/exercises/${exerciseId}/ai-review`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setReview(json.review ?? null);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
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
