/**
 * Modelos de dados do núcleo de estudos (DevPath Hub).
 * Entidades refletem o relacionamento entre Roadmap, Módulos, Aulas,
 * Exercícios, Revisões (SRS) e Métricas de evolução.
 */

export type RoadmapStatus = "não-iniciado" | "em-andamento" | "completo" | "bloqueado";
export type LessonStatus = "não-iniciada" | "em-andamento" | "concluída";
export type ModuleCategory =
  | "web-development"
  | "mobile-dev"
  | "devops"
  | "cloud-computing"
  | "data-science";

export const CATEGORY_LABELS: Record<ModuleCategory, string> = {
  "web-development": "Web Development",
  "mobile-dev": "Mobile Dev",
  devops: "DevOps",
  "cloud-computing": "Cloud Computing",
  "data-science": "Data Science",
};

export const STATUS_LABELS: Record<RoadmapStatus, string> = {
  "não-iniciado": "Não iniciado",
  "em-andamento": "Em andamento",
  completo: "Completo",
  bloqueado: "Bloqueado",
};

/** Nó da trilha no Roadmap. Um nó desbloqueia o próximo ao ser concluído. */
export interface RoadmapNode {
  id: string;
  title: string;
  status: RoadmapStatus;
  order: number;
  /** IDs dos nós que precisam estar concluídos para este ser desbloqueado. */
  unlockedBy?: string[];
  progress: number; // 0-100
}

/** Aula dentro de um módulo. */
export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  videoUrl?: string;
  textContent?: string;
  tags: string[];
  isCompleted: boolean;
  order: number;
}

/** Módulo/conteúdo pertencente a uma trilha. */
export interface Module {
  id: string;
  roadmapNodeId: string;
  title: string;
  category: ModuleCategory;
  progress: number; // 0-100
  lessons: Lesson[];
}

/** Exercício intrinsecamente ligado a um módulo/aula. */
export interface ExerciseQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface Exercise {
  id: string;
  moduleId: string;
  title: string;
  questions: ExerciseQuestion[];
  isCompleted: boolean;
  score?: number; // 0-100
}

/** Flashcard de revisão gerado pelo SRS. */
export interface ReviewFlashcard {
  id: string;
  source: "lesson" | "exercise";
  sourceId: string;
  question: string;
  answer: string;
  dueDate: Date;
  interval: number; // dias
  repetitions: number;
  easeFactor: number;
}

/** Métricas agregadas de evolução. */
export interface Metrics {
  totalStudyMinutes: number;
  exerciseAccuracy: number; // 0-100
  lessonsCompleted: number;
  totalLessons: number;
  timeSpentByCategory: Record<ModuleCategory, number>; // em segundos
}

export interface ActiveTimer {
  moduleId: string;
  startedAt: Date;
}

export interface StudyState {
  roadmapNodes: RoadmapNode[];
  modules: Module[];
  lessonsCompleted: string[]; // ids de lições concluídas
  exercisesDone: Record<string, { score: number; completedAt: Date }>;
  reviewsPending: ReviewFlashcard[];
  timeSpent: Record<string, number>; // moduleId -> segundos
  activeTimer: ActiveTimer | null;
  lastSync: Date;
}
