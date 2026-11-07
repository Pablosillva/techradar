"use client";

import { createContext, useContext, useEffect, useRef, useReducer, useCallback, type ReactNode } from "react";
import { studyReducer, initialState, type StudyState } from "./reducer";
import type {
  ModuleCategory,
  Module,
  Lesson,
  RoadmapNode,
  NotebookFolder,
  NotebookNote,
  LabFile,
  LabProject,
  TerminalLine,
  TerminalState,
  OpenTab,
  ExerciseChallenge,
  ExerciseTestResult,
  ExerciseMetrics,
} from "@/lib/study/types";

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

interface StudyContextValue extends StudyState {
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
  // Notebook actions
  createFolder: (title: string, parentId: string | null) => void;
  deleteFolder: (folderId: string) => void;
  updateFolder: (folderId: string, title: string) => void;
  createNote: (title: string, content: string, parentFolderId: string | null, tags: string[], relatedModuleId?: string, relatedNodeId?: string) => void;
  updateNote: (noteId: string, title?: string, content?: string, tags?: string[]) => void;
  deleteNote: (noteId: string) => void;
  moveNote: (noteId: string, parentFolderId: string | null) => void;
  addTagToNote: (noteId: string, tag: string) => void;
  removeTagFromNote: (noteId: string, tag: string) => void;
  getNotesByFolder: (folderId: string | null) => NotebookNote[];
  getFolderById: (folderId: string) => NotebookFolder | undefined;
  getFoldersByParent: (parentId: string | null) => NotebookFolder[];
  // Lab actions
  setActiveProject: (projectId: string) => void;
  updateLabFile: (fileId: string, content: string) => void;
  setActiveFile: (fileId: string | null) => void;
  addOpenTab: (tab: OpenTab) => void;
  removeOpenTab: (fileId: string) => void;
  setActiveTab: (fileId: string) => void;
  terminalInput: (text: string) => void;
  terminalExecute: (command: string) => void;
  terminalAddLine: (line: TerminalLine) => void;
  tickLabTimer: (seconds: number) => void;
  getActiveProject: () => LabProject | undefined;
  getActiveFile: () => LabFile | undefined;
  getOpenTabs: () => OpenTab[];
  // Exercise challenge actions
  startExercise: (exerciseId: string) => void;
  completeChallenge: (exerciseId: string, score: number, testResults: ExerciseTestResult[]) => void;
  failChallenge: (exerciseId: string, testResults: ExerciseTestResult[]) => void;
  updateExerciseCode: (exerciseId: string, code: string) => void;
  addExerciseTime: (exerciseId: string, seconds: number) => void;
  getActiveExercise: () => ExerciseChallenge | undefined;
  getChallengesByCategory: (category: ModuleCategory) => ExerciseChallenge[];
  getChallengesByDifficulty: (difficulty: string) => ExerciseChallenge[];
  getChallengesByStatus: (status: string) => ExerciseChallenge[];
  getExerciseMetrics: () => StudyState["exerciseMetrics"];
}

const StudyContext = createContext<StudyContextValue | null>(null);

interface StudyProviderProps {
  children: ReactNode;
}

export function StudyProvider({ children }: StudyProviderProps) {
  const [state, dispatch] = useReducer(studyReducer, initialState);
  const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const labTimerInterval = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // Lab timer
  useEffect(() => {
    labTimerInterval.current = setInterval(() => {
      dispatch({ type: "TICK_LAB_TIMER", payload: { seconds: 1 } });
    }, 1000);
    return () => {
      if (labTimerInterval.current) clearInterval(labTimerInterval.current);
      labTimerInterval.current = null;
    };
  }, []);

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

  // Notebook actions
  const createFolder = useCallback((title: string, parentId: string | null) => {
    dispatch({ type: "CREATE_FOLDER", payload: { title, parentId } });
  }, []);

  const deleteFolder = useCallback((folderId: string) => {
    dispatch({ type: "DELETE_FOLDER", payload: { folderId } });
  }, []);

  const updateFolder = useCallback((folderId: string, title: string) => {
    dispatch({ type: "UPDATE_FOLDER", payload: { folderId, title } });
  }, []);

  const createNote = useCallback(
    (title: string, content: string, parentFolderId: string | null, tags: string[], relatedModuleId?: string, relatedNodeId?: string) => {
      dispatch({ type: "CREATE_NOTE", payload: { title, content, parentFolderId, tags, relatedModuleId, relatedNodeId } });
    },
    []
  );

  const updateNote = useCallback((noteId: string, title?: string, content?: string, tags?: string[]) => {
    dispatch({ type: "UPDATE_NOTE", payload: { noteId, title, content, tags } });
  }, []);

  const deleteNote = useCallback((noteId: string) => {
    dispatch({ type: "DELETE_NOTE", payload: { noteId } });
  }, []);

  const moveNote = useCallback((noteId: string, parentFolderId: string | null) => {
    dispatch({ type: "MOVE_NOTE", payload: { noteId, parentFolderId } });
  }, []);

  const addTagToNote = useCallback((noteId: string, tag: string) => {
    dispatch({ type: "ADD_TAG_TO_NOTE", payload: { noteId, tag } });
  }, []);

  const removeTagFromNote = useCallback((noteId: string, tag: string) => {
    dispatch({ type: "REMOVE_TAG_FROM_NOTE", payload: { noteId, tag } });
  }, []);

  const getNotesByFolder = useCallback((folderId: string | null) => {
    return state.notebooks.filter((n) => n.parentFolderId === folderId).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }, [state.notebooks]);

  const getFolderById = useCallback((folderId: string) => {
    return state.notebookFolders.find((f) => f.id === folderId);
  }, [state.notebookFolders]);

  const getFoldersByParent = useCallback((parentId: string | null) => {
    return state.notebookFolders.filter((f) => f.parentId === parentId).sort((a, b) => a.order - b.order);
  }, [state.notebookFolders]);

  // Lab actions
  const setActiveProject = useCallback((projectId: string) => {
    dispatch({ type: "SET_ACTIVE_PROJECT", payload: { projectId } });
  }, []);

  const updateLabFile = useCallback((fileId: string, content: string) => {
    dispatch({ type: "UPDATE_LAB_FILE", payload: { fileId, content } });
  }, []);

  const setActiveFile = useCallback((fileId: string | null) => {
    dispatch({ type: "SET_ACTIVE_FILE", payload: { fileId } });
  }, []);

  const addOpenTab = useCallback((tab: OpenTab) => {
    dispatch({ type: "ADD_OPEN_TAB", payload: { tab } });
  }, []);

  const removeOpenTab = useCallback((fileId: string) => {
    dispatch({ type: "REMOVE_OPEN_TAB", payload: { fileId } });
  }, []);

  const setActiveTab = useCallback((fileId: string) => {
    dispatch({ type: "SET_ACTIVE_TAB", payload: { fileId } });
  }, []);

  const terminalInput = useCallback((text: string) => {
    dispatch({ type: "TERMINAL_INPUT", payload: { text } });
  }, []);

  const terminalExecute = useCallback((command: string) => {
    dispatch({ type: "TERMINAL_EXECUTE", payload: { command } });
  }, []);

  const terminalAddLine = useCallback((line: TerminalLine) => {
    dispatch({ type: "TERMINAL_ADD_LINE", payload: { line } });
  }, []);

  const tickLabTimer = useCallback((seconds: number) => {
    dispatch({ type: "TICK_LAB_TIMER", payload: { seconds } });
  }, []);

  const getActiveProject = useCallback(() => {
    return state.labProjects.find((p) => p.id === state.activeProjectId);
  }, [state.labProjects, state.activeProjectId]);

  const getActiveFile = useCallback(() => {
    const project = getActiveProject();
    if (!project) return undefined;
    return project.files.find((f) => f.id === state.activeFileId);
  }, [state.activeFileId, getActiveProject]);

  const getOpenTabs = useCallback(() => {
    return state.openTabs;
  }, [state.openTabs]);

  // Exercise challenge actions
  const startExercise = useCallback((exerciseId: string) => {
    dispatch({ type: "START_EXERCISE", payload: { exerciseId } });
  }, []);

  const completeChallenge = useCallback((exerciseId: string, score: number, testResults: ExerciseTestResult[]) => {
    dispatch({ type: "COMPLETE_CHALLENGE", payload: { exerciseId, score, testResults } });
  }, []);

  const failChallenge = useCallback((exerciseId: string, testResults: ExerciseTestResult[]) => {
    dispatch({ type: "FAIL_CHALLENGE", payload: { exerciseId, testResults } });
  }, []);

  const updateExerciseCode = useCallback((exerciseId: string, code: string) => {
    dispatch({ type: "UPDATE_EXERCISE_CODE", payload: { exerciseId, code } });
  }, []);

  const addExerciseTime = useCallback((exerciseId: string, seconds: number) => {
    dispatch({ type: "ADD_EXERCISE_TIME", payload: { exerciseId, seconds } });
  }, []);

  const getActiveExercise = useCallback(() => {
    return state.exerciseChallenges.find((e) => e.id === state.activeExerciseId);
  }, [state.exerciseChallenges, state.activeExerciseId]);

  const getChallengesByCategory = useCallback((category: ModuleCategory) => {
    return state.exerciseChallenges.filter((e) => e.category === category);
  }, [state.exerciseChallenges]);

  const getChallengesByDifficulty = useCallback((difficulty: string) => {
    return state.exerciseChallenges.filter((e) => e.difficulty === difficulty);
  }, [state.exerciseChallenges]);

  const getChallengesByStatus = useCallback((status: string) => {
    return state.exerciseChallenges.filter((e) => e.status === status);
  }, [state.exerciseChallenges]);

  const getExerciseMetrics = useCallback(() => {
    return state.exerciseMetrics;
  }, [state.exerciseMetrics]);

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
    createFolder,
    deleteFolder,
    updateFolder,
    createNote,
    updateNote,
    deleteNote,
    moveNote,
    addTagToNote,
    removeTagFromNote,
    getNotesByFolder,
    getFolderById,
    getFoldersByParent,
    setActiveProject,
    updateLabFile,
    setActiveFile,
    addOpenTab,
    removeOpenTab,
    setActiveTab,
    terminalInput,
    terminalExecute,
    terminalAddLine,
    tickLabTimer,
    getActiveProject,
    getActiveFile,
    getOpenTabs,
    startExercise,
    completeChallenge,
    failChallenge,
    updateExerciseCode,
    addExerciseTime,
    getActiveExercise,
    getChallengesByCategory,
    getChallengesByDifficulty,
    getChallengesByStatus,
    getExerciseMetrics,
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
