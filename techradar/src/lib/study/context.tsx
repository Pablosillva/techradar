"use client";

import { createContext, useContext, useEffect, useRef, useReducer, useCallback, type ReactNode } from "react";
import { studyReducer, initialState, type StudyState } from "./reducer";
import type { ModuleCategory, Module, Lesson, RoadmapNode } from "@/lib/study/types";

function moduleProgress(module: Module): number {
  if (module.lessons.length === 0) return 0;
  const completed = module.lessons.filter((l) => l.isCompleted).length;
  return Math.round((completed / module.lessons.length) * 100);
}

function nodeProgress(state: StudyState, nodeId: string): number {
  const node = state.roadmapNodes.find((n) => n.id === nodeId);
  if (!node) return 0;
  const modules = state.modules.filter((m) => m.roadmapNodeId === nodeId);
  if (modules.length === 0) return node.progress;
  const avg = modules.reduce((acc, m) => acc + moduleProgress(m), 0) / modules.length;
  return Math.round(avg);
}

function isNodeUnlocked(state: StudyState, node: RoadmapNode): boolean {
  if (!node.unlockedBy || node.unlockedBy.length === 0) return true;
  return node.unlockedBy.every((id) => state.roadmapNodes.find((n) => n.id === id)?.status === "completo");
}

function computeMetrics(state: StudyState) {
  const totalLessons = state.modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const completedLessons = state.lessonsCompleted.length;

  const allScores = Object.values(state.exercisesDone).map((e) => e.score);
  const exerciseAccuracy =
    allScores.length === 0 ? 0 : Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);

  const totalStudyMinutes = Math.round(Object.values(state.timeSpent).reduce((a, b) => a + b, 0) / 60);

  const timeSpentByCategory: Record<ModuleCategory, number> = {
    "web-development": 0,
    "mobile-dev": 0,
    devops: 0,
    "cloud-computing": 0,
    "data-science": 0,
  };
  for (const module of state.modules) {
    timeSpentByCategory[module.category] += state.timeSpent[module.id] ?? 0;
  }

  return {
    totalStudyMinutes,
    exerciseAccuracy,
    lessonsCompleted: completedLessons,
    totalLessons,
    timeSpentByCategory,
  };
}

interface StudyContextValue extends StudyState {
  metrics: ReturnType<typeof computeMetrics>;
  modulesByCategory: (category: ModuleCategory) => Module[];
  moduleById: (id: string) => Module | undefined;
  nodeById: (id: string) => RoadmapNode | undefined;
  lessonsForModule: (moduleId: string) => Lesson[];
  isModuleLocked: (moduleId: string) => boolean;
  categoryProgress: (category: ModuleCategory) => number;
  pendingReviewsCount: number;
  completeLesson: (moduleId: string, lessonId: string) => void;
  uncompleteLesson: (moduleId: string, lessonId: string) => void;
  startTimer: (moduleId: string) => void;
  stopTimer: () => void;
  completeExercise: (exerciseId: string, score: number) => void;
  generateReviews: () => void;
  markReviewDone: (reviewId: string) => void;
}

const StudyContext = createContext<StudyContextValue | null>(null);

interface StudyProviderProps {
  children: ReactNode;
}

export function StudyProvider({ children }: StudyProviderProps) {
  const [state, dispatch] = useReducer(studyReducer, initialState);
  const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!state.activeTimer) {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
        timerInterval.current = null;
      }
      return;
    }
    timerInterval.current = setInterval(() => {
      dispatch({ type: "TICK_TIMER", payload: { seconds: 1 } });
    }, 1000);
    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
      timerInterval.current = null;
    };
  }, [state.activeTimer]);

  const completeLesson = useCallback((moduleId: string, lessonId: string) => {
    dispatch({ type: "COMPLETE_LESSON", payload: { moduleId, lessonId } });
  }, []);

  const uncompleteLesson = useCallback((moduleId: string, lessonId: string) => {
    dispatch({ type: "UNCOMPLETE_LESSON", payload: { moduleId, lessonId } });
  }, []);

  const startTimer = useCallback((moduleId: string) => {
    dispatch({ type: "START_TIMER", payload: { moduleId } });
  }, []);

  const stopTimer = useCallback(() => {
    dispatch({ type: "STOP_TIMER" });
  }, []);

  const completeExercise = useCallback((exerciseId: string, score: number) => {
    dispatch({ type: "COMPLETE_EXERCISE", payload: { exerciseId, score } });
  }, []);

  const generateReviews = useCallback(() => {
    dispatch({ type: "GENERATE_REVIEWS" });
  }, []);

  const markReviewDone = useCallback((reviewId: string) => {
    dispatch({ type: "MARK_REVIEW_DONE", payload: { reviewId } });
  }, []);

  const metrics = computeMetrics(state);

  const modulesByCategory = (category: ModuleCategory) => state.modules.filter((m) => m.category === category);
  const moduleById = (id: string) => state.modules.find((m) => m.id === id);
  const nodeById = (id: string) => state.roadmapNodes.find((n) => n.id === id);
  const lessonsForModule = (moduleId: string) => {
    const module = moduleById(moduleId);
    return module ? module.lessons : [];
  };
  const isModuleLocked = (moduleId: string): boolean => {
    const module = moduleById(moduleId);
    if (!module) return true;
    const node = nodeById(module.roadmapNodeId);
    if (!node) return true;
    return !isNodeUnlocked(state, node);
  };
  const categoryProgress = (category: ModuleCategory): number => {
    const mods = state.modules.filter((m) => m.category === category);
    if (mods.length === 0) return 0;
    return Math.round(mods.reduce((acc, m) => acc + moduleProgress(m), 0) / mods.length);
  };
  const pendingReviewsCount = state.reviewsPending.length;

  const contextValue: StudyContextValue = {
    ...state,
    metrics,
    modulesByCategory,
    moduleById,
    nodeById,
    lessonsForModule,
    isModuleLocked,
    categoryProgress,
    pendingReviewsCount,
    completeLesson,
    uncompleteLesson,
    startTimer,
    stopTimer,
    completeExercise,
    generateReviews,
    markReviewDone,
  };

  return <StudyContext.Provider value={contextValue}>{children}</StudyContext.Provider>;
}

export function useStudy() {
  const ctx = useContext(StudyContext);
  if (!ctx) {
    throw new Error("useStudy deve ser usado dentro de StudyProvider");
  }
  return ctx;
}

export { StudyContext };
