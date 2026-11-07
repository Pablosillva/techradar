"use client";

import { useReducer, useCallback, useEffect, useRef, type Reducer } from "react";
import type {
  StudyState,
  RoadmapNode,
  Module,
  Lesson,
  Exercise,
  ReviewFlashcard,
  ModuleCategory,
  RoadmapStatus,
  ActiveTimer,
  NotebookFolder,
  NotebookNote,
} from "@/lib/study/types";

/* ============================================================
   DADOS MOCKADOS INICIAIS
   ============================================================ */

const initialRoadmapNodes: RoadmapNode[] = [
  {
    id: "fundamentos-web",
    title: "Fundamentos de Web",
    status: "completo",
    order: 1,
    progress: 100,
  },
  {
    id: "react-estado",
    title: "React & State Management",
    status: "em-andamento",
    order: 2,
    unlockedBy: ["fundamentos-web"],
    progress: 45,
  },
  {
    id: "node-databases",
    title: "Node.js & Databases",
    status: "bloqueado",
    order: 3,
    unlockedBy: ["react-estado"],
    progress: 0,
  },
  {
    id: "devops-cloud",
    title: "DevOps & Cloud",
    status: "bloqueado",
    order: 4,
    unlockedBy: ["node-databases"],
    progress: 0,
  },
];

const initialModules: Module[] = [
  {
    id: "mod-react",
    roadmapNodeId: "react-estado",
    title: "React module",
    category: "web-development",
    progress: 40,
    lessons: [
      {
        id: "less-react-1",
        moduleId: "mod-react",
        title: "Lesson 1: Introdução ao React",
        tags: ["React", "Fundamentos"],
        isCompleted: true,
        order: 1,
      },
      {
        id: "less-react-2",
        moduleId: "mod-react",
        title: "Lesson 2: Hooks",
        videoUrl: "https://www.youtube.com/watch?v=example",
        tags: ["React", "Hooks"],
        isCompleted: false,
        order: 2,
      },
      {
        id: "less-react-3",
        moduleId: "mod-react",
        title: "Lesson 3: Context API",
        tags: ["React", "Context"],
        isCompleted: false,
        order: 3,
      },
    ],
  },
  {
    id: "mod-cloud",
    roadmapNodeId: "devops-cloud",
    title: "Cloud Computing - module",
    category: "cloud-computing",
    progress: 0,
    lessons: [
      {
        id: "less-cloud-1",
        moduleId: "mod-cloud",
        title: "Lesson 1: O que é Cloud",
        tags: ["Cloud", "Fundamentos"],
        isCompleted: false,
        order: 1,
      },
    ],
  },
  {
    id: "mod-aws",
    roadmapNodeId: "devops-cloud",
    title: "AWS Computing module",
    category: "cloud-computing",
    progress: 0,
    lessons: [
      {
        id: "less-aws-1",
        moduleId: "mod-aws",
        title: "Lesson 1: EC2 e S3",
        tags: ["AWS", "Compute"],
        isCompleted: false,
        order: 1,
      },
    ],
  },
  {
    id: "mod-mobile",
    roadmapNodeId: "react-estado",
    title: "React Native module",
    category: "mobile-dev",
    progress: 0,
    lessons: [
      {
        id: "less-mobile-1",
        moduleId: "mod-mobile",
        title: "Lesson 1: Expo e navegadores",
        tags: ["React Native", "Mobile"],
        isCompleted: false,
        order: 1,
      },
    ],
  },
];

const initialNotebookFolders: NotebookFolder[] = [
  { id: "folder-root", title: "Notebook", parentId: null, order: 0 },
  { id: "folder-web", title: "Web Fundamentals", parentId: "folder-root", order: 1 },
  { id: "folder-react", title: "React & State", parentId: "folder-web", order: 2 },
  { id: "folder-node", title: "Node.js", parentId: "folder-root", order: 3 },
];

const initialNotebooks: NotebookNote[] = [
  {
    id: "note-1",
    title: "React Hooks Deep Dive",
    content: `<h1>React Hooks Deep Dive</h1><p>Structured hook-driven Ives dive into thinking about hooks via react hooks. Files are rightline-hookuse development more maintainable.</p><pre><code>export default hooks = hooks {\n  const hooks = () => {\n    return Log(setState.React(data, instapt));\n  };\n}</code></pre>`,
    parentFolderId: "folder-react",
    tags: ["React", "Hooks"],
    relatedModuleId: "mod-react",
    wordCount: 45,
    updatedAt: new Date(Date.now() - 3600000),
    createdAt: new Date(Date.now() - 86400000 * 3),
  },
];

const initialTimeSpent: Record<string, number> = {
  "web-development": 1200,
  "mobile-dev": 0,
  devops: 0,
  "cloud-computing": 0,
  "data-science": 0,
};

const initialState: StudyState = {
  roadmapNodes: initialRoadmapNodes,
  modules: initialModules,
  lessonsCompleted: ["less-react-1"],
  exercisesDone: {},
  reviewsPending: [],
  timeSpent: initialTimeSpent,
  activeTimer: null,
  lastSync: new Date(),
  notebooks: initialNotebooks,
  notebookFolders: initialNotebookFolders,
};

/* ============================================================
   ACTIONS
   ============================================================ */

type StudyAction =
  | { type: "COMPLETE_LESSON"; payload: { moduleId: string; lessonId: string } }
  | { type: "UNCOMPLETE_LESSON"; payload: { moduleId: string; lessonId: string } }
  | { type: "START_TIMER"; payload: { moduleId: string } }
  | { type: "STOP_TIMER" }
  | { type: "TICK_TIMER"; payload: { seconds: number } }
  | { type: "COMPLETE_EXERCISE"; payload: { exerciseId: string; score: number } }
  | { type: "UNCOMPLETE_EXERCISE"; payload: { exerciseId: string } }
  | { type: "MARK_REVIEW_DONE"; payload: { reviewId: string } }
  | { type: "GENERATE_REVIEWS" }
  | { type: "SET_NODE_STATUS"; payload: { nodeId: string; status: RoadmapStatus } }
  // Notebook actions
  | { type: "CREATE_FOLDER"; payload: { title: string; parentId: string | null } }
  | { type: "DELETE_FOLDER"; payload: { folderId: string } }
  | { type: "UPDATE_FOLDER"; payload: { folderId: string; title: string } }
  | { type: "CREATE_NOTE"; payload: { title: string; content: string; parentFolderId: string | null; tags: string[]; relatedModuleId?: string; relatedNodeId?: string } }
  | { type: "UPDATE_NOTE"; payload: { noteId: string; title?: string; content?: string; tags?: string[] } }
  | { type: "DELETE_NOTE"; payload: { noteId: string } }
  | { type: "MOVE_NOTE"; payload: { noteId: string; parentFolderId: string | null } }
  | { type: "ADD_TAG_TO_NOTE"; payload: { noteId: string; tag: string } }
  | { type: "REMOVE_TAG_FROM_NOTE"; payload: { noteId: string; tag: string } };

/* ============================================================
   HELPERS PUROS
   ============================================================ */

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

/* ============================================================
   REDUCER
   ============================================================ */

const studyReducer: Reducer<StudyState, StudyAction> = (state, action): StudyState => {
  switch (action.type) {
    case "COMPLETE_LESSON": {
      const { moduleId, lessonId } = action.payload;
      const moduleIndex = state.modules.findIndex((m) => m.id === moduleId);
      if (moduleIndex === -1) return state;

      const module = { ...state.modules[moduleIndex] };
      const lessonIndex = module.lessons.findIndex((l) => l.id === lessonId);
      if (lessonIndex === -1) return state;
      if (module.lessons[lessonIndex].isCompleted) return state;

      module.lessons[lessonIndex] = { ...module.lessons[lessonIndex], isCompleted: true };
      module.progress = moduleProgress(module);

      const newModules = state.modules.map((m, i) => (i === moduleIndex ? module : m));
      const newCompleted = [...new Set([...state.lessonsCompleted, lessonId])];

      const newNodes = state.roadmapNodes.map((node) => {
        const nodeModules = newModules.filter((m) => m.roadmapNodeId === node.id);
        if (nodeModules.length === 0) return node;
        const progress = nodeProgress({ ...state, modules: newModules, lessonsCompleted: newCompleted }, node.id);
        let status: RoadmapStatus = node.status;
        if (progress >= 100) status = "completo";
        else if (progress > 0) status = "em-andamento";
        else status = "não-iniciado";
        return { ...node, progress, status };
      });

      return { ...state, modules: newModules, lessonsCompleted: newCompleted, roadmapNodes: newNodes, lastSync: new Date() };
    }

    case "UNCOMPLETE_LESSON": {
      const { moduleId, lessonId } = action.payload;
      const moduleIndex = state.modules.findIndex((m) => m.id === moduleId);
      if (moduleIndex === -1) return state;

      const module = { ...state.modules[moduleIndex] };
      const lessonIndex = module.lessons.findIndex((l) => l.id === lessonId);
      if (lessonIndex === -1) return state;
      if (!module.lessons[lessonIndex].isCompleted) return state;

      module.lessons[lessonIndex] = { ...module.lessons[lessonIndex], isCompleted: false };
      module.progress = moduleProgress(module);

      const newModules = state.modules.map((m, i) => (i === moduleIndex ? module : m));
      const newCompleted = state.lessonsCompleted.filter((id) => id !== lessonId);

      const newNodes = state.roadmapNodes.map((node) => {
        const nodeModules = newModules.filter((m) => m.roadmapNodeId === node.id);
        if (nodeModules.length === 0) return node;
        const progress = nodeProgress({ ...state, modules: newModules, lessonsCompleted: newCompleted }, node.id);
        let status: RoadmapStatus = node.status;
        if (progress >= 100) status = "completo";
        else if (progress > 0) status = "em-andamento";
        else status = "não-iniciado";
        return { ...node, progress, status };
      });

      return { ...state, modules: newModules, lessonsCompleted: newCompleted, roadmapNodes: newNodes, lastSync: new Date() };
    }

    case "START_TIMER": {
      if (state.activeTimer) return state;
      return { ...state, activeTimer: { moduleId: action.payload.moduleId, startedAt: new Date() } };
    }

    case "STOP_TIMER": {
      if (!state.activeTimer) return state;
      const now = new Date();
      const elapsedSeconds = Math.round((now.getTime() - state.activeTimer.startedAt.getTime()) / 1000);
      const newTimeSpent = {
        ...state.timeSpent,
        [state.activeTimer.moduleId]: (state.timeSpent[state.activeTimer.moduleId] ?? 0) + elapsedSeconds,
      };
      return { ...state, timeSpent: newTimeSpent, activeTimer: null, lastSync: now };
    }

    case "TICK_TIMER": {
      return state;
    }

    case "COMPLETE_EXERCISE": {
      const { exerciseId, score } = action.payload;
      const newExercisesDone = { ...state.exercisesDone, [exerciseId]: { score, completedAt: new Date() } };
      return { ...state, exercisesDone: newExercisesDone, lastSync: new Date() };
    }

    case "UNCOMPLETE_EXERCISE": {
      const { exerciseId } = action.payload;
      const { [exerciseId]: _removed, ...rest } = state.exercisesDone;
      return { ...state, exercisesDone: rest, lastSync: new Date() };
    }

    case "MARK_REVIEW_DONE": {
      const { reviewId } = action.payload;
      return { ...state, reviewsPending: state.reviewsPending.filter((r) => r.id !== reviewId), lastSync: new Date() };
    }

    case "GENERATE_REVIEWS": {
      const reviewedLessonIds = new Set(state.reviewsPending.filter((r) => r.source === "lesson").map((r) => r.sourceId));
      const allLessons = state.modules.flatMap((m) => m.lessons);
      const newReviews: ReviewFlashcard[] = [];
      for (const lessonId of state.lessonsCompleted) {
        if (reviewedLessonIds.has(lessonId)) continue;
        const lesson = allLessons.find((l) => l.id === lessonId);
        if (!lesson) continue;
        newReviews.push({
          id: `review-lesson-${lessonId}`,
          source: "lesson",
          sourceId: lessonId,
          question: `Revisão: ${lesson.title}`,
          answer: lesson.textContent ?? "Revise os principais conceitos da aula.",
          dueDate: new Date(Date.now() + 86400000),
          interval: 1,
          repetitions: 1,
          easeFactor: 2.5,
        });
      }
      return { ...state, reviewsPending: [...newReviews, ...state.reviewsPending], lastSync: new Date() };
    }

    case "SET_NODE_STATUS": {
      const { nodeId, status } = action.payload;
      return { ...state, roadmapNodes: state.roadmapNodes.map((n) => (n.id === nodeId ? { ...n, status } : n)), lastSync: new Date() };
    }

    // ===== NOTEBOOK ACTIONS =====
    case "CREATE_FOLDER": {
      const { title, parentId } = action.payload;
      const newFolder: NotebookFolder = {
        id: `folder-${Date.now()}`,
        title,
        parentId,
        order: state.notebookFolders.filter((f) => f.parentId === parentId).length,
      };
      return { ...state, notebookFolders: [...state.notebookFolders, newFolder], lastSync: new Date() };
    }

    case "DELETE_FOLDER": {
      const { folderId } = action.payload;
      if (folderId === "folder-root") return state;
      // Move notes from this folder to root
      const notesMoved = state.notebooks.map((n) =>
        n.parentFolderId === folderId ? { ...n, parentFolderId: null, updatedAt: new Date() } : n
      );
      return {
        ...state,
        notebookFolders: state.notebookFolders.filter((f) => f.id !== folderId),
        notebooks: notesMoved,
        lastSync: new Date(),
      };
    }

    case "UPDATE_FOLDER": {
      const { folderId, title } = action.payload;
      return {
        ...state,
        notebookFolders: state.notebookFolders.map((f) =>
          f.id === folderId ? { ...f, title } : f
        ),
        lastSync: new Date(),
      };
    }

    case "CREATE_NOTE": {
      const { title, content, parentFolderId, tags, relatedModuleId, relatedNodeId } = action.payload;
      const wordCount = content ? content.split(/\s+/).filter(Boolean).length : 0;
      const now = new Date();
      const newNote: NotebookNote = {
        id: `note-${Date.now()}`,
        title,
        content,
        parentFolderId,
        tags,
        relatedModuleId,
        relatedNodeId,
        wordCount,
        updatedAt: now,
        createdAt: now,
      };
      return { ...state, notebooks: [...state.notebooks, newNote], lastSync: now };
    }

    case "UPDATE_NOTE": {
      const { noteId, title, content, tags } = action.payload;
      const now = new Date();
      return {
        ...state,
        notebooks: state.notebooks.map((n) => {
          if (n.id !== noteId) return n;
          const updated: NotebookNote = { ...n, updatedAt: now };
          if (title !== undefined) updated.title = title;
          if (content !== undefined) {
            updated.content = content;
            updated.wordCount = content.split(/\s+/).filter(Boolean).length;
          }
          if (tags !== undefined) updated.tags = tags;
          return updated;
        }),
        lastSync: now,
      };
    }

    case "DELETE_NOTE": {
      const { noteId } = action.payload;
      return {
        ...state,
        notebooks: state.notebooks.filter((n) => n.id !== noteId),
        lastSync: new Date(),
      };
    }

    case "MOVE_NOTE": {
      const { noteId, parentFolderId } = action.payload;
      return {
        ...state,
        notebooks: state.notebooks.map((n) =>
          n.id === noteId ? { ...n, parentFolderId, updatedAt: new Date() } : n
        ),
        lastSync: new Date(),
      };
    }

    case "ADD_TAG_TO_NOTE": {
      const { noteId, tag } = action.payload;
      return {
        ...state,
        notebooks: state.notebooks.map((n) => {
          if (n.id !== noteId) return n;
          if (n.tags.includes(tag)) return n;
          return { ...n, tags: [...n.tags, tag], updatedAt: new Date() };
        }),
        lastSync: new Date(),
      };
    }

    case "REMOVE_TAG_FROM_NOTE": {
      const { noteId, tag } = action.payload;
      return {
        ...state,
        notebooks: state.notebooks.map((n) => {
          if (n.id !== noteId) return n;
          return { ...n, tags: n.tags.filter((t) => t !== tag), updatedAt: new Date() };
        }),
        lastSync: new Date(),
      };
    }

    default:
      return state;
  }
};

export { studyReducer, initialState };
export type { StudyState, StudyAction };
