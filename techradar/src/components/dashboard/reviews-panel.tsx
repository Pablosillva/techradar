import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardReview } from "@/lib/dashboard";

interface ReviewsPanelProps {
  reviews: DashboardReview[];
  total: number;
}

export function ReviewsPanel({ reviews, total }: ReviewsPanelProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <RotateCcw className="h-4 w-4 text-rose-300" />
          Revisões Vencidas
        </CardTitle>
        <Badge variant="danger">{total}</Badge>
      </CardHeader>

      <CardContent className="space-y-2 pt-0">
        {reviews.length === 0 ? (
          <p className="py-3 text-center text-xs text-slate-500">
            Nenhuma revisão pendente. Seu SRS está em dia! 🎉
          </p>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className="flex items-center gap-3 rounded-lg border border-white/[0.04] bg-white/[0.02] p-2.5"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-400/10 text-rose-300">
                <AlertTriangle className="h-3.5 w-3.5" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-slate-200">{review.front}</p>
                <p className="text-[10px] text-slate-500">
                  Revisão {review.reviewNumber} •{" "}
                  {review.overdueDays === 0
                    ? "vence hoje"
                    : `${review.overdueDays} dia${review.overdueDays > 1 ? "s" : ""} atrasada`}
                </p>
              </div>

              <Badge variant={review.priority === "Alta" ? "danger" : "warning"}>{review.priority}</Badge>
            </div>
          ))
        )}

        <Link
          href="/flashcards"
          className="block pt-1 text-center text-[11px] font-medium text-cyan-300 transition-colors hover:text-cyan-200"
        >
          Ver todas as revisões →
        </Link>
      </CardContent>
    </Card>
  );
}
