import { prisma } from "./prisma";
import {
  DAY_MS,
  addDays,
  buildDailySeries,
  buildHeatmapSeries,
  clampPercent,
  computeBestStreak,
  computeStreak,
  computeTechProgress,
  dayKey,
  formatMinutes,
  startOfLocalDay,
  startOfLocalWeek,
  sumMinutesBetween,
  type DailyPoint,
  type TechProgress,
} from "./dashboard/helpers";

export interface DashboardReview {
  id: string;
  front: string;
  reviewNumber: number;
  overdueDays: number;
  priority: "Alta" | "Média";
}

export interface DashboardTask {
  id: string;
  title: string;
  roadmap: string;
  status: string;
  statusLabel: string;
  estimatedMinutes: number | null;
}

export interface DashboardProject {
  id: string;
  title: string;
  description: string | null;
  status: string;
  statusLabel: string;
  progress: number;
  techStack: string[];
}

export interface DashboardActivity {
  id: string;
  kind: "study" | "code" | "note";
  title: string;
  detail: string;
  date: Date;
}

export interface DashboardRecommendation {
  kind: "review" | "roadmap" | "empty";
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  badge?: string;
}

export interface DashboardData {
  user: { name: string };
  metrics: {
    todayMinutes: number;
    dailyGoalMinutes: number;
    todayPercent: number;
    streak: number;
    bestStreak: number;
    weekPercent: number;
    weekDaysStudied: number;
    dueCount: number;
    nextReview: string | null;
  };
  series: DailyPoint[];
  techProgress: TechProgress[];
  reviews: DashboardReview[];
  tasks: DashboardTask[];
  projects: DashboardProject[];
  activity: DashboardActivity[];
  recommendation: DashboardRecommendation;
  quickStats: {
    exercisesSolved: number;
    exercisesTotal: number;
    retention: number;
    cardsReviewed: number;
  };
  heatmap: DailyPoint[];
}

const PROJECT_STATUS_LABELS: Record<string, string> = {
  PLANNING: "Planejamento",
  IN_PROGRESS: "Em desenvolvimento",
  REVIEW: "Em revisão",
  DONE: "Concluído",
  PAUSED: "Pausado",
};

const TASK_STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: "Planejar",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluído",
  NEEDS_REVIEW: "Revisar",
};

const TASK_STATUS_ORDER: Record<string, number> = {
  NEEDS_REVIEW: 0,
  IN_PROGRESS: 1,
  NOT_STARTED: 2,
  COMPLETED: 3,
};

/**
 * Busca tudo que o dashboard precisa em paralelo e devolve dados já calculados.
 * Nenhum valor é hardcoded: metas vêm de UserSettings e o restante do banco.
 */
export async function getDashboardData(userId: string): Promise<DashboardData> {
  const now = new Date();
  const todayStart = startOfLocalDay(now);
  const tomorrow = addDays(todayStart, 1);
  const weekStart = startOfLocalWeek(now);
  const historyStart = addDays(todayStart, -119);

  const [
    user,
    settings,
    sessions,
    dueCount,
    dueCards,
    roadmapItems,
    projects,
    exercisesTotal,
    exercisesSolved,
    allCards,
    submissions,
    notesCount,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    }),
    prisma.userSettings.findUnique({ where: { userId } }),
    prisma.studySession.findMany({
      where: { userId, date: { gte: historyStart } },
      select: {
        id: true,
        date: true,
        minutes: true,
        notes: true,
        topic: { select: { title: true } },
        roadmapItem: { select: { title: true } },
      },
      orderBy: { date: "desc" },
    }),
    prisma.flashcard.count({
      where: {
        userId,
        OR: [{ dueDate: { lte: now } }, { status: "NEW" }],
      },
    }),
    prisma.flashcard.findMany({
      where: {
        userId,
        OR: [{ dueDate: { lte: now } }, { status: "NEW" }],
      },
      orderBy: { dueDate: "asc" },
      take: 5,
      select: { id: true, front: true, repetitions: true, dueDate: true },
    }),
    prisma.roadmapItem.findMany({
      where: { userId, roadmap: { isArchived: false } },
      select: {
        id: true,
        title: true,
        status: true,
        estimatedMinutes: true,
        order: true,
        roadmap: { select: { title: true, order: true } },
      },
      orderBy: [{ roadmap: { order: "asc" } }, { order: "asc" }],
    }),
    prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 3,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        progress: true,
        techStack: true,
      },
    }),
    prisma.exercise.count({ where: { userId } }),
    prisma.exercise.count({ where: { userId, submissions: { some: {} } } }),
    prisma.flashcard.findMany({
      where: { userId },
      select: { repetitions: true, interval: true, dueDate: true },
    }),
    prisma.codeSubmission.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        createdAt: true,
        exercise: { select: { title: true } },
      },
    }),
    prisma.note.count({ where: { userId } }),
  ]);

  const dailyGoalMinutes = settings?.dailyGoalMinutes ?? 240;
  const weeklyGoalMinutes = settings?.weeklyGoalMinutes ?? 1200;

  const todayMinutes = sumMinutesBetween(sessions, todayStart, tomorrow);
  const weekMinutes = sessions
    .filter((session) => session.date.getTime() >= weekStart.getTime())
    .reduce((total, session) => total + session.minutes, 0);

  const weekDaysStudied = new Set(
    sessions
      .filter((session) => session.date.getTime() >= weekStart.getTime())
      .map((session) => dayKey(session.date))
  ).size;

  const heatmap = buildHeatmapSeries(sessions, 5, now);
  const series = buildDailySeries(sessions, 30, now);
  const streak = computeStreak(sessions.map((session) => session.date), now);
  const bestStreak = Math.max(
    computeBestStreak(sessions.map((session) => session.date)),
    streak
  );

  const techProgress = computeTechProgress(roadmapItems);

  const pendingTasks = roadmapItems
    .filter((item) => item.status !== "COMPLETED")
    .sort((a, b) => {
      const order = (TASK_STATUS_ORDER[a.status] ?? 9) - (TASK_STATUS_ORDER[b.status] ?? 9);
      return order !== 0 ? order : a.order - b.order;
    })
    .slice(0, 6);

  const reviews: DashboardReview[] = dueCards.map((card) => {
    const overdueDays = card.dueDate
      ? Math.max(0, Math.floor((now.getTime() - card.dueDate.getTime()) / DAY_MS))
      : 0;

    return {
      id: card.id,
      front: card.front,
      reviewNumber: Math.max(1, card.repetitions + 1),
      overdueDays,
      priority: overdueDays >= 2 ? "Alta" : "Média",
    };
  });

  const inProgress = pendingTasks.find((item) => item.status === "IN_PROGRESS");
  const notStarted = pendingTasks.find((item) => item.status === "NOT_STARTED");
  const nextItem = inProgress ?? notStarted;

  let recommendation: DashboardRecommendation;

  if (reviews.length > 0) {
    recommendation = {
      kind: "review",
      eyebrow: "Recomendação de hoje",
      title: `Revise: ${reviews[0].front}`,
      description:
        reviews[0].overdueDays > 0
          ? `Este cartão está ${reviews[0].overdueDays} dia(s) atrasado. Você tem ${dueCount} revisões pendentes e ${reviews[0].overdueDays > 3 ? "a retenção cai rápido" : "revisar hoje mantém a curva de memória"}.`
          : `Você tem ${dueCount} revisões pendentes. Comece pelo cartão mais antigo para manter a retenção.`,
      href: "/flashcards",
      cta: "Revisar agora",
      badge: `${dueCount} pendentes`,
    };
  } else if (nextItem) {
    recommendation = {
      kind: "roadmap",
      eyebrow: "Continue de onde parou",
      title: nextItem.title,
      description: `Próximo passo em "${nextItem.roadmap.title}". ${
        nextItem.estimatedMinutes
          ? `Estimativa de ${formatMinutes(nextItem.estimatedMinutes)} de estudo.`
          : "Abra o item para ler o conteúdo e marcar o progresso."
      }`,
      href: "/roadmap",
      cta: "Ir para o estudo",
      badge: inProgress ? "Em andamento" : "Não iniciado",
    };
  } else {
    recommendation = {
      kind: "empty",
      eyebrow: "Comece agora",
      title: "Monte sua primeira trilha",
      description:
        notesCount > 0
          ? `Você já tem ${notesCount} nota(s). Organize os próximos passos em uma trilha com itens e conteúdos.`
          : "Crie uma trilha, adicione itens e conteúdos teóricos para o dashboard acompanhar seu progresso real.",
      href: "/roadmap",
      cta: "Criar trilha",
    };
  }

  const recentSessions = sessions.slice(0, 3).map<DashboardActivity>((session) => {
    const topic = session.topic?.title ?? session.roadmapItem?.title ?? session.notes ?? "Sessão livre";
    return {
      id: `session-${session.id}`,
      kind: "study",
      title: `Estudou ${topic}`,
      detail: `${session.minutes} min de foco`,
      date: session.date,
    };
  });

  const recentSubmissions = submissions.map<DashboardActivity>((submission) => ({
    id: `submission-${submission.id}`,
    kind: "code",
    title: `Enviou código em ${submission.exercise.title}`,
    detail: "Treino de código",
    date: submission.createdAt,
  }));

  const activity = [...recentSessions, ...recentSubmissions]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 4);

  const cardsReviewed = allCards.filter((card) => card.repetitions > 0).length;
  const cardsRetained = allCards.filter((card) => card.repetitions >= 2).length;
  const retention = cardsReviewed === 0 ? 0 : clampPercent((cardsRetained / cardsReviewed) * 100);

  return {
    user: { name: user?.name ?? "Estudante" },
    metrics: {
      todayMinutes,
      dailyGoalMinutes,
      todayPercent: clampPercent((todayMinutes / dailyGoalMinutes) * 100),
      streak,
      bestStreak,
      weekPercent: clampPercent((weekMinutes / weeklyGoalMinutes) * 100),
      weekDaysStudied,
      dueCount,
      nextReview: reviews[0]?.front ?? null,
    },
    series,
    techProgress,
    reviews,
    tasks: pendingTasks.map((item) => ({
      id: item.id,
      title: item.title,
      roadmap: item.roadmap.title,
      status: item.status,
      statusLabel: TASK_STATUS_LABELS[item.status] ?? item.status,
      estimatedMinutes: item.estimatedMinutes,
    })),
    projects: projects.map((project) => ({
      id: project.id,
      title: project.title,
      description: project.description,
      status: project.status,
      statusLabel: PROJECT_STATUS_LABELS[project.status] ?? project.status,
      progress: project.progress,
      techStack: project.techStack,
    })),
    activity,
    recommendation,
    quickStats: {
      exercisesSolved,
      exercisesTotal,
      retention,
      cardsReviewed,
    },
    heatmap,
  };
}

export interface ShellData {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    role: string;
  } | null;
  counts: {
    applications: number;
    tasks: number;
    reviews: number;
  };
  weekPercent: number;
  notifications: Array<{ label: string; href: string }>;
}

/** Dados leves usados pelo shell (sidebar/topbar) em qualquer página. */
export async function getShellData(userId: string): Promise<ShellData> {
  const now = new Date();
  const weekStart = startOfLocalWeek(now);

  const [user, settings, applications, tasks, reviews, weekSessions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, image: true, role: true },
    }),
    prisma.userSettings.findUnique({ where: { userId } }),
    prisma.jobApplication.count({
      where: { userId, status: { in: ["SAVED", "APPLIED", "INTERVIEW", "OFFER"] } },
    }),
    prisma.roadmapItem.count({
      where: { userId, status: { in: ["NOT_STARTED", "IN_PROGRESS", "NEEDS_REVIEW"] } },
    }),
    prisma.flashcard.count({
      where: { userId, OR: [{ dueDate: { lte: now } }, { status: "NEW" }] },
    }),
    prisma.studySession.findMany({
      where: { userId, date: { gte: weekStart } },
      select: { minutes: true },
    }),
  ]);

  const weekMinutes = weekSessions.reduce((total, session) => total + session.minutes, 0);
  const weeklyGoalMinutes = settings?.weeklyGoalMinutes ?? 1200;

  const notifications: Array<{ label: string; href: string }> = [];
  if (reviews > 0) notifications.push({ label: `${reviews} revisões pendentes`, href: "/flashcards" });
  if (applications > 0)
    notifications.push({ label: `${applications} candidaturas em andamento`, href: "/candidaturas" });
  if (tasks > 0) notifications.push({ label: `${tasks} itens no roadmap`, href: "/roadmap" });

  return {
    user: user
      ? {
          id: user.id,
          name: user.name ?? "Estudante",
          email: user.email ?? "",
          image: user.image,
          role: user.role,
        }
      : null,
    counts: { applications, tasks, reviews },
    weekPercent: clampPercent((weekMinutes / weeklyGoalMinutes) * 100),
    notifications,
  };
}
