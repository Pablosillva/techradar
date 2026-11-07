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

/** Pasta dentro do Caderno (Notebook). */
export interface NotebookFolder {
  id: string;
  title: string;
  parentId: string | null;
  order: number;
}

/** Nota dentro do Caderno. */
export interface NotebookNote {
  id: string;
  title: string;
  content: string; // HTML do Tiptap
  parentFolderId: string | null;
  tags: string[];
  relatedModuleId?: string;
  relatedNodeId?: string;
  wordCount: number;
  updatedAt: Date;
  createdAt: Date;
}

/** Projeto do Laboratório. */
export interface LabFile {
  id: string;
  name: string;
  path: string;
  content: string;
  language: "javascript" | "jsx" | "ts" | "tsx" | "css" | "json" | "html";
  isOpen: boolean;
  isActive: boolean;
}

export interface LabProject {
  id: string;
  title: string;
  description: string;
  category: ModuleCategory;
  status: "not-started" | "in-progress" | "completed";
  progress: number; // 0-100
  files: LabFile[];
  relatedNodeId?: string;
  relatedModuleId?: string;
}

/** Projeto de Portfólio (vitrine/coleção sincronizada com o Laboratório). */
export type ProjectStatus = "in-progress" | "completed" | "idea";
export type ProjectCover = "portfolio" | "aws" | "ecommerce" | "python" | "api" | "generic";

export interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  techs: string[];
  progress: number; // 0-100
  status: ProjectStatus;
  isHighlighted: boolean;
  needsReview: boolean;
  commits: number;
  testsPassed: number;
  cover: ProjectCover;
  category: ModuleCategory;
  relatedLabProjectId?: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Linha do terminal simulado. */
export interface TerminalLine {
  id: string;
  type: "input" | "output" | "error" | "success";
  text: string;
  timestamp: Date;
}

/** Estado do terminal. */
export interface TerminalState {
  lines: TerminalLine[];
  currentInput: string;
  historyIndex: number;
  commandHistory: string[];
}

/** Aba aberta no editor. */
export interface OpenTab {
  fileId: string;
  fileName: string;
  language: LabFile["language"];
  isActive: boolean;
}

/** Exercício/desafio de código. */
export interface ExerciseChallenge {
  id: string;
  title: string;
  description: string;
  category: ModuleCategory;
  difficulty: "facil" | "medio" | "dificil";
  language: "javascript" | "python" | "sql" | "java";
  type: "algorithm" | "coding" | "database" | "system-design";
  tags: string[];
  status: "not-started" | "in-progress" | "completed";
  progress: number; // 0-100
  relatedModuleId?: string;
  relatedNodeId?: string;
  timeSpent: number; // segundos
  bestScore?: number; // 0-100
  attempts: number;
  starterCode: string;
  solutionCode?: string;
  testCases: Array<{ input: string; expectedOutput: string }>;
}

/** Resultado de execução de teste simulado. */
export interface ExerciseTestResult {
  passed: boolean;
  testCaseIndex: number;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  timeMs: number;
}

/** Métricas de exercícios. */
export interface ExerciseMetrics {
  totalExercises: number;
  completedExercises: number;
  exercisesByDifficulty: Record<string, number>;
  exercisesByCategory: Record<string, number>;
  totalTimeSpent: number;
  averageScore: number;
}

/** Card de revisão do SRS (Spaced Repetition System). */
export interface ReviewCard {
  id: string;
  title: string;
  moduleId: string;
  question: string;
  answer: string;
  difficulty: "facil" | "medio" | "dificil";
  status: "para-ler" | "concluido" | "arquivado";
  nextReviewDate: Date;
  interval: number; // dias até próxima revisão
  repetitions: number;
  easeFactor: number; // fator de facilidade (SM-2)
  lastReviewedAt: Date | null;
  timesReviewed: number;
  source: "lesson" | "exercise";
  sourceId: string;
}

/** Resultado de uma sessão de revisão. */
export interface ReviewSessionResult {
  reviewId: string;
  isCorrect: boolean;
  difficulty: "facil" | "medio" | "dificil";
  timeSpentSeconds: number;
  reviewedAt: Date;
}

/** Métricas de revisão/SRS. */
export interface ReviewMetrics {
  totalReviews: number;
  pendingReviews: number;
  completedReviews: number;
  accuracyRate: number; // 0-100
  averageResponseTime: number; // segundos
  reviewsByModule: Record<string, number>;
  reviewsByDifficulty: Record<string, number>;
}

/** Métricas agregadas de evolução. */
export interface StudyState {
  roadmapNodes: RoadmapNode[];
  modules: Module[];
  lessonsCompleted: string[]; // ids de lições concluídas
  exercisesDone: Record<string, { score: number; completedAt: Date }>;
  timeSpent: Record<string, number>; // moduleId -> segundos
  activeTimer: ActiveTimer | null;
  lastSync: Date;

  // Caderno / Notas
  notebooks: NotebookNote[];
  notebookFolders: NotebookFolder[];

  // Laboratório
  labProjects: LabProject[];
  activeProjectId: string | null;
  openTabs: OpenTab[];
  activeFileId: string | null;
  terminal: TerminalState;
  labTimeSpent: number; // segundos no laboratório

  // Exercícios / Desafios
  exerciseChallenges: ExerciseChallenge[];
  activeExerciseId: string | null;
  exerciseTestResults: Record<string, ExerciseTestResult[]>;
  exerciseTimeSpent: Record<string, number>; // exerciseId -> segundos
  exerciseMetrics: ExerciseMetrics;

  // Revisões / SRS
  reviewCards: ReviewCard[];
  reviewSessions: ReviewSessionResult[];
  reviewMetrics: ReviewMetrics;
  reviewTimeSpent: number; // segundos no total de revisões

  // Projetos / Portfólio
  projects: PortfolioProject[];
}
