import type {
  RoadmapDto,
  RoadmapItemStatus,
  RoadmapLevel,
  StudyContentType,
} from "./types";

export type BadgeTone = "default" | "secondary" | "outline" | "success" | "warning" | "danger";

export interface StatusMeta {
  label: string;
  description: string;
  badge: BadgeTone;
  dot: string;
  select: string;
}

/** Rótulos e cores dos quatro estados exigidos pela etapa. */
export const STATUS_META: Record<RoadmapItemStatus, StatusMeta> = {
  NOT_STARTED: {
    label: "Não iniciado",
    description: "Ainda não começou",
    badge: "secondary",
    dot: "bg-slate-500",
    select: "border-slate-600/60 text-slate-300",
  },
  IN_PROGRESS: {
    label: "Em andamento",
    description: "Estudando agora",
    badge: "default",
    dot: "bg-cyan-400",
    select: "border-cyan-400/30 text-cyan-200",
  },
  COMPLETED: {
    label: "Concluído",
    description: "Conteúdo dominado",
    badge: "success",
    dot: "bg-emerald-400",
    select: "border-emerald-400/30 text-emerald-200",
  },
  NEEDS_REVIEW: {
    label: "Precisa revisar",
    description: "Revisão pendente",
    badge: "warning",
    dot: "bg-amber-400",
    select: "border-amber-400/30 text-amber-200",
  },
};

export const LEVEL_META: Record<RoadmapLevel, { label: string; badge: BadgeTone }> = {
  beginner: { label: "Iniciante", badge: "secondary" },
  intermediate: { label: "Intermediário", badge: "default" },
  advanced: { label: "Avançado", badge: "warning" },
};

export const CONTENT_TYPE_META: Record<StudyContentType, { label: string }> = {
  NOTE: { label: "Nota" },
  LINK: { label: "Link" },
  VIDEO: { label: "Vídeo" },
  ARTICLE: { label: "Artigo" },
  PDF: { label: "PDF" },
};

export interface RoadmapSummary {
  total: number;
  completed: number;
  inProgress: number;
  needsReview: number;
  notStarted: number;
  progress: number;
}

/** Calcula a barra de progresso e os contadores de uma trilha. */
export function summarizeRoadmap(roadmap: Pick<RoadmapDto, "items">): RoadmapSummary {
  const total = roadmap.items.length;
  let completed = 0;
  let inProgress = 0;
  let needsReview = 0;
  let notStarted = 0;

  for (const item of roadmap.items) {
    switch (item.status) {
      case "COMPLETED":
        completed += 1;
        break;
      case "IN_PROGRESS":
        inProgress += 1;
        break;
      case "NEEDS_REVIEW":
        needsReview += 1;
        break;
      default:
        notStarted += 1;
    }
  }

  return {
    total,
    completed,
    inProgress,
    needsReview,
    notStarted,
    progress: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}

export function summarizeOverall(roadmaps: RoadmapDto[]): RoadmapSummary {
  const items = roadmaps.flatMap((roadmap) => roadmap.items);
  return summarizeRoadmap({ items });
}

/** Cor de destaque da trilha com fallback seguro. */
export function trackAccent(color: string | null | undefined): string {
  return color && /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(color) ? color : "#22d3ee";
}

/** Aceita apenas links http/https; evita javascript:/data: vindos de dados antigos. */
export function safeHttpUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

/** "45 min", "1h", "1h 30min". */
export function formatDuration(minutes: number | null | undefined): string {
  if (!minutes || minutes <= 0) return "";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}min`;
}
