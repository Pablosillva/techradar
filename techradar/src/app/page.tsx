import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock3, Flame, RefreshCw, Sparkles, Target } from "lucide-react";
import { auth } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard";
import { formatMinutes } from "@/lib/dashboard/helpers";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { StudyChart } from "@/components/dashboard/study-chart";
import { TechProgressPanel } from "@/components/dashboard/tech-progress";
import { RecommendationCard } from "@/components/dashboard/recommendation-card";
import { ReviewsPanel } from "@/components/dashboard/reviews-panel";
import { QuickStatsPanel } from "@/components/dashboard/quick-stats";
import { ActivityPanel } from "@/components/dashboard/activity-panel";
import { TasksPanel } from "@/components/dashboard/tasks-panel";
import { ProjectsPanel } from "@/components/dashboard/projects-panel";
import { StudyHeatmap } from "@/components/dashboard/study-heatmap";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/entrar");
  }

  const data = await getDashboardData(session.user.id);
  const firstName = data.user.name.split(" ")[0] || "Estudante";

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-cyan-400/25 bg-cyan-400/10 text-cyan-300">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Bem-vindo, {firstName}! <span aria-hidden="true">🚀</span>
            </h1>
            <p className="mt-0.5 text-sm text-slate-400">
              Grandes conquistas são feitas de pequenos avanços diários.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button asChild href="/evolucao" variant="outline" size="sm">
            Ver métricas
          </Button>
          <Button asChild href={data.recommendation.href} size="sm">
            Continuar estudando
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* Coluna principal */}
        <div className="min-w-0 space-y-6">
          {/* Métricas */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
            <StatCard
              title="Horas Hoje"
              value={formatMinutes(data.metrics.todayMinutes)}
              subtitle={`Meta diária: ${formatMinutes(data.metrics.dailyGoalMinutes)}`}
              icon={Clock3}
              accent="cyan"
              progress={data.metrics.todayPercent}
              hint={`${data.metrics.todayPercent}%`}
            />
            <StatCard
              title="Sequência"
              value={`${data.metrics.streak} ${data.metrics.streak === 1 ? "dia" : "dias"}`}
              subtitle={`Recorde: ${data.metrics.bestStreak} dias`}
              icon={Flame}
              accent="amber"
              hint={`+${data.metrics.streak}`}
            />
            <StatCard
              title="Metas"
              value={`${data.metrics.weekPercent}%`}
              subtitle={`${data.metrics.weekDaysStudied} de 7 dias com estudo`}
              icon={Target}
              accent="violet"
              progress={data.metrics.weekPercent}
              hint="semana"
            />
            <StatCard
              title="Revisões Pendentes"
              value={String(data.metrics.dueCount)}
              subtitle={
                data.metrics.nextReview
                  ? `Próxima: ${data.metrics.nextReview}`
                  : "Nenhuma revisão pendente"
              }
              icon={RefreshCw}
              accent="emerald"
              hint={data.metrics.dueCount > 0 ? "SRS" : "em dia"}
            />
          </div>

          {/* Gráfico + tecnologias */}
          <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
            <StudyChart series={data.series} />
            <TechProgressPanel items={data.techProgress} />
          </div>

          {/* Tarefas + projetos */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <TasksPanel tasks={data.tasks} />
            <ProjectsPanel projects={data.projects} />
          </div>

          {/* Calendário */}
          <StudyHeatmap days={data.heatmap} />
        </div>

        {/* Painel lateral direito */}
        <aside className="min-w-0 space-y-6">
          <RecommendationCard recommendation={data.recommendation} />
          <ReviewsPanel reviews={data.reviews} total={data.metrics.dueCount} />
          <QuickStatsPanel
            exercisesSolved={data.quickStats.exercisesSolved}
            exercisesTotal={data.quickStats.exercisesTotal}
            retention={data.quickStats.retention}
            cardsReviewed={data.quickStats.cardsReviewed}
          />
          <ActivityPanel activity={data.activity} />
        </aside>
      </div>

      <p className="pb-2 text-center text-[11px] text-slate-600">
        Dados atualizados a partir do seu banco de estudos.{" "}
        <Link href="/configuracoes" className="text-slate-500 hover:text-slate-300">
          Ajustar metas
        </Link>
      </p>
    </div>
  );
}
