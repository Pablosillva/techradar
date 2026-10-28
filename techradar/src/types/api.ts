/**
 * Tipos compartilhados de request/response da API do TechRadar.
 */

export type TabType = "vagas" | "cursos" | "livros" | "audiobooks" | "tudo";

export type SortType = "relevance" | "date" | "salary" | "rating";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface JobSummary {
  id: string;
  title: string;
  company: string;
  source: string;
  isRemote: boolean;
  level: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  url: string;
  location?: string | null;
  skills: string[];
  postedAt: string | null;
}

export interface CourseSummary {
  id: string;
  title: string;
  provider: string;
  source: string;
  isFree: boolean;
  price: number | null;
  currency: string | null;
  level: string | null;
  rating: number | null;
  url: string;
  skills: string[];
}

export interface BookSummary {
  id: string;
  title: string;
  authors: string[];
  source: string;
  language: string;
  isFree: boolean;
  url: string;
  thumbnailUrl: string | null;
  skills: string[];
}

export interface AudiobookSummary {
  id: string;
  title: string;
  authors: string[];
  source: string;
  language: string;
  isFree: boolean;
  durationMin: number | null;
  url: string;
  skills: string[];
}

export interface RecommendationItem {
  id: string;
  title: string;
  url: string;
  matchScore: number;
  matchedSkills: string[];
  reason: string;
  // Campos específicos por tipo
  provider?: string;
  isFree?: boolean;
  authors?: string[];
  thumbnailUrl?: string | null;
}

export interface RecommendationsResponse {
  origin: {
    type: string;
    id: string;
    title: string;
    skills: string[];
  };
  recommendations: {
    courses: RecommendationItem[];
    books: RecommendationItem[];
    audiobooks: RecommendationItem[];
  };
}

export interface FavoriteItem {
  id: string;
  itemType: "job" | "course" | "book" | "audiobook";
  itemId: string;
  createdAt: string;
  // Dados do item (join)
  item: JobSummary | CourseSummary | BookSummary | AudiobookSummary;
}
