import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { DashboardRecommendation } from "@/lib/dashboard";

interface RecommendationCardProps {
  recommendation: DashboardRecommendation;
}

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  return (
    <Card className="relative overflow-hidden border-cyan-400/20 bg-gradient-to-br from-cyan-400/[0.09] via-[#0d1420] to-violet-500/[0.09]">
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-violet-500/20 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-300">
            <Sparkles className="h-3.5 w-3.5" />
            {recommendation.eyebrow}
          </span>
          {recommendation.badge && (
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] font-medium text-slate-300">
              {recommendation.badge}
            </span>
          )}
        </div>

        <h2 className="mt-3 text-[17px] font-bold leading-snug text-white">
          {recommendation.title}
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">
          {recommendation.description}
        </p>

        <Button asChild href={recommendation.href} variant="glow" className="mt-4 w-full">
          {recommendation.cta}
        </Button>

        <p className="mt-2 text-center text-[10px] text-slate-600">
          <Link href="/flashcards" className="hover:text-slate-400">
            Ver todas as revisões →
          </Link>
        </p>
      </div>
    </Card>
  );
}
