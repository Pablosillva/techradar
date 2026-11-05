/** Tipos serializáveis usados pela interface do roadmap (client-safe). */

export const ROADMAP_LEVELS = ["beginner", "intermediate", "advanced"] as const;
export type RoadmapLevel = (typeof ROADMAP_LEVELS)[number];

export const ROADMAP_ITEM_STATUSES = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETED",
  "NEEDS_REVIEW",
] as const;
export type RoadmapItemStatus = (typeof ROADMAP_ITEM_STATUSES)[number];

export const STUDY_CONTENT_TYPES = ["NOTE", "LINK", "VIDEO", "ARTICLE", "PDF"] as const;
export type StudyContentType = (typeof STUDY_CONTENT_TYPES)[number];

export interface StudyContentDto {
  id: string;
  title: string;
  type: StudyContentType;
  content: string | null;
  url: string | null;
  order: number;
}

export interface RoadmapItemDto {
  id: string;
  title: string;
  description: string | null;
  status: RoadmapItemStatus;
  order: number;
  estimatedMinutes: number | null;
  resourceUrl: string | null;
  contents: StudyContentDto[];
}

export interface RoadmapDto {
  id: string;
  title: string;
  description: string | null;
  goal: string | null;
  level: RoadmapLevel;
  color: string | null;
  order: number;
  items: RoadmapItemDto[];
}
