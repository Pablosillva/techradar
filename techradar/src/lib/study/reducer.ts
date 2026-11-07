"use client";

import { useReducer, useCallback, useEffect, useRef, type Reducer } from "react";
import type {
  StudyState,
  RoadmapNode,
  Module,
  Lesson,
  Exercise,
  ModuleCategory,
  RoadmapStatus,
  ActiveTimer,
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
  ReviewCard,
  ReviewSessionResult,
  ReviewMetrics,
  PortfolioProject,
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

/* ============================================================
   DADOS MOCKADOS DO LABORATÓRIO
   ============================================================ */

const initialLabFiles: LabFile[] = [
  {
    id: "file-1",
    name: "ProductList.js",
    path: "src/components/ProductList.js",
    content: `import React, { useState, useEffect } from "react";
import Products from "../api/products";

export default function ProductList({ Component }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const data = await Products.fetchAll();
      setProducts(data);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
`,
    language: "jsx",
    isOpen: true,
    isActive: true,
  },
  {
    id: "file-2",
    name: "productController.js",
    path: "src/controllers/productController.js",
    content: `const Product = require("../models/Product");

const productController = {
  async getAll(req, res) {
    try {
      const products = await Product.find();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async create(req, res) {
    try {
      const product = new Product(req.body);
      await product.save();
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
};

module.exports = productController;
`,
    language: "javascript",
    isOpen: true,
    isActive: false,
  },
  {
    id: "file-3",
    name: "style.css",
    path: "src/styles/style.css",
    content: `.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  padding: 1rem;
}

.product-card {
  background: #ffffff;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.product-card h3 {
  color: #06b6d4;
  margin-bottom: 0.5rem;
}

.product-card p {
  color: #64748b;
  font-size: 0.9rem;
}`,
    language: "css",
    isOpen: true,
    isActive: false,
  },
];

const initialLabProjects: LabProject[] = [
  {
    id: "lab-1",
    title: "Atividade Guiada: Deploy no AWS",
    description: "Configure e faça deploy de uma aplicação full-stack na AWS utilizando EC2, S3 e RDS.",
    category: "devops",
    status: "in-progress",
    progress: 45,
    files: initialLabFiles.filter((f) => f.path.includes("ProductList") || f.path.includes("productController")),
    relatedNodeId: "devops-cloud",
  },
  {
    id: "lab-2",
    title: "Projeto Final: Portfólio",
    description: "Crie um portfólio pessoal utilizando React, Node.js e banco de dados PostgreSQL.",
    category: "web-development",
    status: "not-started",
    progress: 0,
    files: [],
    relatedNodeId: "react-estado",
  },
  {
    id: "lab-3",
    title: "Sandbox: Python Data Analysis",
    description: "Analise conjuntos de dados utilizando Python, Pandas e visualizações com Matplotlib.",
    category: "data-science",
    status: "in-progress",
    progress: 30,
    files: [],
    relatedNodeId: undefined,
  },
];

const initialPortfolioProjects: PortfolioProject[] = [
  {
    id: "proj-portfolio",
    title: "Portfólio 2.0",
    description: "Full screen um positive website full screen contradarem.",
    techs: ["React", "Node.js"],
    progress: 80,
    status: "in-progress",
    isHighlighted: true,
    needsReview: false,
    commits: 1,
    testsPassed: 3,
    cover: "portfolio",
    category: "web-development",
    relatedLabProjectId: "lab-2",
    createdAt: new Date(Date.now() - 86400000 * 14),
    updatedAt: new Date(Date.now() - 86400000 * 2),
  },
  {
    id: "proj-aws",
    title: "Atividade AWS",
    description: "Projetos para uma atividade AWS online.",
    techs: ["AWS", "EC2", "S3"],
    progress: 100,
    status: "completed",
    isHighlighted: false,
    needsReview: false,
    commits: 1,
    testsPassed: 0,
    cover: "aws",
    category: "cloud-computing",
    relatedLabProjectId: "lab-1",
    createdAt: new Date(Date.now() - 86400000 * 10),
    updatedAt: new Date(Date.now() - 86400000 * 5),
  },
  {
    id: "proj-ecommerce",
    title: "E-commerce API",
    description: "JavaScript, Express, PostgreSQL",
    techs: ["React", "Node.js", "PostgreSQL"],
    progress: 50,
    status: "in-progress",
    isHighlighted: false,
    needsReview: true,
    commits: 4,
    testsPassed: 2,
    cover: "ecommerce",
    category: "web-development",
    createdAt: new Date(Date.now() - 86400000 * 7),
    updatedAt: new Date(Date.now() - 86400000 * 1),
  },
  {
    id: "proj-python",
    title: "Sandbox Python",
    description: "Python Data Analysis",
    techs: ["Python", "Pandas", "Matplotlib"],
    progress: 20,
    status: "in-progress",
    isHighlighted: false,
    needsReview: false,
    commits: 1,
    testsPassed: 0,
    cover: "python",
    category: "data-science",
    relatedLabProjectId: "lab-3",
    createdAt: new Date(Date.now() - 86400000 * 3),
    updatedAt: new Date(Date.now() - 86400000 * 1),
  },
  {
    id: "proj-idea-api",
    title: "API de Pagamentos",
    description: "Ideia: gateway de pagamentos com webhook.",
    techs: ["Node.js", "PostgreSQL"],
    progress: 0,
    status: "idea",
    isHighlighted: false,
    needsReview: false,
    commits: 0,
    testsPassed: 0,
    cover: "api",
    category: "web-development",
    createdAt: new Date(Date.now() - 86400000 * 2),
    updatedAt: new Date(Date.now() - 86400000 * 2),
  },
];

const initialTerminalLines: TerminalLine[] = [
  {
    id: "term-1",
    type: "output",
    text: "> e-commerce E-Commerce-Full-Stack 1v3.981",
    timestamp: new Date(Date.now() - 60000),
  },
  {
    id: "term-2",
    type: "input",
    text: "> npm start",
    timestamp: new Date(Date.now() - 45000),
  },
  {
    id: "term-3",
    type: "output",
    text: "Local: http://localhost:3000",
    timestamp: new Date(Date.now() - 44000),
  },
  {
    id: "term-4",
    type: "output",
    text: "Compiling...",
    timestamp: new Date(Date.now() - 43000),
  },
];

const initialTerminalState: TerminalState = {
  lines: initialTerminalLines,
  currentInput: "",
  historyIndex: -1,
  commandHistory: [],
};

const initialOpenTabs: OpenTab[] = [
  { fileId: "file-1", fileName: "ProductList.js", language: "jsx", isActive: true },
  { fileId: "file-2", fileName: "productController.js", language: "javascript", isActive: false },
  { fileId: "file-3", fileName: "style.css", language: "css", isActive: false },
];

/* ============================================================
   DADOS MOCKADOS DE EXERCÍCIOS/DESAFIOS
   ============================================================ */

const initialExerciseChallenges: ExerciseChallenge[] = [
  {
    id: "ex-1",
    title: "Array Mastery",
    description: "Implement a custom sort function with O(n log n) complexity.",
    category: "web-development",
    difficulty: "facil",
    language: "javascript",
    type: "algorithm",
    tags: ["React", "Sorting"],
    status: "in-progress",
    progress: 30,
    relatedModuleId: "mod-react",
    relatedNodeId: "react-estado",
    timeSpent: 300,
    bestScore: 75,
    attempts: 2,
    starterCode: `function customSort(arr) {\n  // Escreva sua solução aqui\n  return arr;\n}\n\nexport default customSort;`,
    testCases: [
      { input: "[3,1,2]", expectedOutput: "[1,2,3]" },
      { input: "[5,3,8,1,2]", expectedOutput: "[1,2,3,5,8]" },
    ],
  },
  {
    id: "ex-2",
    title: "Counter Component with Hooks",
    description: "Build a stateful counter component using useState hook.",
    category: "web-development",
    difficulty: "medio",
    language: "javascript",
    type: "coding",
    tags: ["React", "Hooks"],
    status: "not-started",
    progress: 0,
    relatedModuleId: "mod-react",
    relatedNodeId: "react-estado",
    timeSpent: 0,
    bestScore: undefined,
    attempts: 0,
    starterCode: `import React, { useState } from "react";\n\nexport default function Counter() {\n  // Implemente o contador aqui\n  return null;\n}`,
    testCases: [
      { input: "initial value 0", expectedOutput: "0" },
      { input: "increment once", expectedOutput: "1" },
    ],
  },
  {
    id: "ex-3",
    title: "Advanced Querying",
    description: "Analyze e-commerce data to find top-selling product categories.",
    category: "devops",
    difficulty: "facil",
    language: "sql",
    type: "database",
    tags: ["SQL", "Sorting"],
    status: "not-started",
    progress: 0,
    relatedModuleId: "mod-aws",
    relatedNodeId: "devops-cloud",
    timeSpent: 0,
    bestScore: undefined,
    attempts: 0,
    starterCode: `SELECT category, COUNT(*) as total\nFROM products\nGROUP BY category\nORDER BY total DESC;`,
    testCases: [
      { input: "sample data", expectedOutput: "category totals" },
    ],
  },
  {
    id: "ex-4",
    title: "Data Processing Pipeline",
    description: "Create a pipeline to clean and process raw customer data.",
    category: "devops",
    difficulty: "dificil",
    language: "javascript",
    type: "system-design",
    tags: ["Node.js", "API", "Sorting"],
    status: "not-started",
    progress: 0,
    relatedModuleId: "mod-aws",
    relatedNodeId: "devops-cloud",
    timeSpent: 0,
    bestScore: undefined,
    attempts: 0,
    starterCode: `function processPipeline(data) {\n  // Implemente o pipeline de processamento\n  return data;\n}\n\nexport default processPipeline;`,
    testCases: [
      { input: "raw data", expectedOutput: "cleaned data" },
    ],
  },
  {
    id: "ex-5",
    title: "SQL Joins Challenge",
    description: "Write queries joining multiple tables with conditions.",
    category: "devops",
    difficulty: "medio",
    language: "sql",
    type: "database",
    tags: ["Database", "API"],
    status: "not-started",
    progress: 0,
    relatedModuleId: "mod-aws",
    relatedNodeId: "devops-cloud",
    timeSpent: 0,
    bestScore: undefined,
    attempts: 0,
    starterCode: `SELECT o.id, c.name, p.title\nFROM orders o\nJOIN customers c ON o.customer_id = c.id\nJOIN products p ON o.product_id = p.id;`,
    testCases: [
      { input: "joined tables", expectedOutput: "order details" },
    ],
  },
];

/* ============================================================
   DADOS MOCKADOS DE REVISÕES/SRS
   ============================================================ */

const initialReviewCards: ReviewCard[] = [
  {
    id: "review-1",
    title: "Revisar Fundamentos Web",
    moduleId: "mod-react",
    question: "O que é o React e qual é o seu propósito principal?",
    answer: "React é uma biblioteca JavaScript para construir interfaces de usuário, focada em componentes reutilizáveis e renderização eficiente.",
    difficulty: "facil",
    status: "para-ler",
    nextReviewDate: new Date(Date.now() + 86400000), // amanhã
    interval: 1,
    repetitions: 0,
    easeFactor: 2.5,
    lastReviewedAt: null,
    timesReviewed: 0,
    source: "lesson",
    sourceId: "less-react-1",
  },
  {
    id: "review-2",
    title: "Revisar Hooks do React",
    moduleId: "mod-react",
    question: "Qual a diferença entre useState e useEffect?",
    answer: "useState gerencia estado local do componente, useEffect gerencia efeitos colaterais (buscar dados, inscrições, manipulação manual do DOM).",
    difficulty: "medio",
    status: "para-ler",
    nextReviewDate: new Date(Date.now() - 43200000), // 12 horas atrás (vencido)
    interval: 1,
    repetitions: 1,
    easeFactor: 2.3,
    lastReviewedAt: new Date(Date.now() - 172800000),
    timesReviewed: 1,
    source: "lesson",
    sourceId: "less-react-2",
  },
  {
    id: "review-3",
    title: "Revisar Context API",
    moduleId: "mod-react",
    question: "Quando usar Context API em vez de props?",
    answer: "Use Context API quando precisar passar dados para muitos níveis de componentes (prop drilling) ou estado global simples.",
    difficulty: "dificil",
    status: "para-ler",
    nextReviewDate: new Date(Date.now() - 172800000), // 2 dias atrás (vencido)
    interval: 2,
    repetitions: 2,
    easeFactor: 2.1,
    lastReviewedAt: new Date(Date.now() - 345600000),
    timesReviewed: 2,
    source: "lesson",
    sourceId: "less-react-3",
  },
  {
    id: "review-4",
    title: "Revisar AWS EC2 e S3",
    moduleId: "mod-aws",
    question: "Qual a diferença entre EC2 e S3?",
    answer: "EC2 é servidores virtuais (compute), S3 é armazenamento de objetos (storage).",
    difficulty: "medio",
    status: "arquivado",
    nextReviewDate: new Date(Date.now() + 604800000), // 7 dias
    interval: 7,
    repetitions: 5,
    easeFactor: 3.0,
    lastReviewedAt: new Date(Date.now() - 604800000),
    timesReviewed: 5,
    source: "lesson",
    sourceId: "less-aws-1",
  },
  {
    id: "review-5",
    title: "Revisar Erro: Arrow Functions",
    moduleId: "mod-react",
    question: "Por que usar arrow functions em callbacks de React?",
    answer: "Arrow functions preservam o contexto 'this' do escopo léxico, evitando problemas com métodos de classe.",
    difficulty: "dificil",
    status: "para-ler",
    nextReviewDate: new Date(Date.now() - 86400000), // ontem (vencido)
    interval: 1,
    repetitions: 1,
    easeFactor: 1.8,
    lastReviewedAt: new Date(Date.now() - 172800000),
    timesReviewed: 1,
    source: "exercise",
    sourceId: "ex-2",
  },
];

const initialReviewSessions: ReviewSessionResult[] = [];

const initialReviewMetrics: ReviewMetrics = {
  totalReviews: initialReviewCards.length,
  pendingReviews: initialReviewCards.filter((r) => r.status === "para-ler").length,
  completedReviews: initialReviewCards.filter((r) => r.status === "concluido").length,
  accuracyRate: 75,
  averageResponseTime: 45,
  reviewsByModule: {
    "web-development": 3,
    "cloud-computing": 1,
    "mobile-dev": 0,
    "devops": 1,
    "data-science": 0,
  },
  reviewsByDifficulty: {
    facil: 1,
    medio: 2,
    dificil: 2,
  },
};



const initialState: StudyState = {
  roadmapNodes: initialRoadmapNodes,
  modules: initialModules,
  lessonsCompleted: ["less-react-1"],
  exercisesDone: {},
  timeSpent: initialTimeSpent,
  activeTimer: null,
  lastSync: new Date(),
  notebooks: initialNotebooks,
  notebookFolders: initialNotebookFolders,
  labProjects: initialLabProjects,
  activeProjectId: "lab-1",
  openTabs: initialOpenTabs,
  activeFileId: "file-1",
  terminal: initialTerminalState,
  labTimeSpent: 0,
  exerciseChallenges: initialExerciseChallenges,
  activeExerciseId: null,
  exerciseTestResults: {},
  exerciseTimeSpent: {},
  exerciseMetrics: {
    totalExercises: initialExerciseChallenges.length,
    completedExercises: 0,
    exercisesByDifficulty: { facil: 0, medio: 0, dificil: 0 },
    exercisesByCategory: {},
    totalTimeSpent: 0,
    averageScore: 0,
  },
  reviewCards: initialReviewCards,
  reviewSessions: initialReviewSessions,
  reviewMetrics: initialReviewMetrics,
  reviewTimeSpent: 0,
  projects: initialPortfolioProjects,
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
  | { type: "CREATE_FOLDER"; payload: { title: string; parentId: string | null } }
  | { type: "DELETE_FOLDER"; payload: { folderId: string } }
  | { type: "UPDATE_FOLDER"; payload: { folderId: string; title: string } }
  | { type: "CREATE_NOTE"; payload: { title: string; content: string; parentFolderId: string | null; tags: string[]; relatedModuleId?: string; relatedNodeId?: string } }
  | { type: "UPDATE_NOTE"; payload: { noteId: string; title?: string; content?: string; tags?: string[] } }
  | { type: "DELETE_NOTE"; payload: { noteId: string } }
  | { type: "MOVE_NOTE"; payload: { noteId: string; parentFolderId: string | null } }
  | { type: "ADD_TAG_TO_NOTE"; payload: { noteId: string; tag: string } }
  | { type: "REMOVE_TAG_FROM_NOTE"; payload: { noteId: string; tag: string } }
  | { type: "SET_ACTIVE_PROJECT"; payload: { projectId: string } }
  | { type: "UPDATE_LAB_FILE"; payload: { fileId: string; content: string } }
  | { type: "SET_ACTIVE_FILE"; payload: { fileId: string | null } }
  | { type: "ADD_OPEN_TAB"; payload: { tab: OpenTab } }
  | { type: "REMOVE_OPEN_TAB"; payload: { fileId: string } }
  | { type: "SET_ACTIVE_TAB"; payload: { fileId: string } }
  | { type: "TERMINAL_INPUT"; payload: { text: string } }
  | { type: "TERMINAL_EXECUTE"; payload: { command: string } }
  | { type: "TERMINAL_ADD_LINE"; payload: { line: TerminalLine } }
  | { type: "TICK_LAB_TIMER"; payload: { seconds: number } }
  | { type: "START_EXERCISE"; payload: { exerciseId: string } }
  | { type: "COMPLETE_CHALLENGE"; payload: { exerciseId: string; score: number; testResults: ExerciseTestResult[] } }
  | { type: "FAIL_CHALLENGE"; payload: { exerciseId: string; testResults: ExerciseTestResult[] } }
  | { type: "UPDATE_EXERCISE_CODE"; payload: { exerciseId: string; code: string } }
  | { type: "ADD_EXERCISE_TIME"; payload: { exerciseId: string; seconds: number } }
  // Review / SRS actions
  | { type: "START_REVIEW"; payload: { reviewId: string } }
  | { type: "COMPLETE_REVIEW"; payload: { reviewId: string; isCorrect: boolean; difficulty: "facil" | "medio" | "dificil"; timeSpentSeconds: number } }
  | { type: "GENERATE_REVIEW_FROM_LESSON"; payload: { lessonId: string; moduleId: string; title: string; question: string; answer: string } }
  | { type: "GENERATE_REVIEW_FROM_EXERCISE"; payload: { exerciseId: string; moduleId: string; title: string; question: string; answer: string } }
  | { type: "ARCHIVE_REVIEW"; payload: { reviewId: string } }
  | { type: "UPDATE_REVIEW_TIME"; payload: { reviewId: string; seconds: number } }
  // Projects / Portfolio
  | { type: "ADD_PROJECT"; payload: { project: PortfolioProject } }
  | { type: "UPDATE_PROJECT_PROGRESS"; payload: { projectId: string; progress: number } }
  | { type: "TOGGLE_HIGHLIGHT"; payload: { projectId: string } }
  | { type: "TOGGLE_REVIEW"; payload: { projectId: string } }
  | { type: "UPDATE_PROJECT"; payload: { projectId: string; changes: Partial<Pick<PortfolioProject, "title" | "description" | "techs" | "status" | "cover">> } }
  | { type: "UPDATE_LAB_PROJECT_PROGRESS"; payload: { projectId: string; progress: number } };

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

  const totalExercises = state.exerciseChallenges.length;
  const completedExercises = state.exerciseChallenges.filter((e) => e.status === "completed").length;
  const exercisesByDifficulty: Record<string, number> = { facil: 0, medio: 0, dificil: 0 };
  const exercisesByCategory: Record<string, number> = {};
  let totalExerciseTime = 0;
  let challengeScores: number[] = [];

  for (const ex of state.exerciseChallenges) {
    exercisesByDifficulty[ex.difficulty] = (exercisesByDifficulty[ex.difficulty] ?? 0) + 1;
    exercisesByCategory[ex.category] = (exercisesByCategory[ex.category] ?? 0) + 1;
    totalExerciseTime += ex.timeSpent;
    if (ex.bestScore !== undefined) challengeScores.push(ex.bestScore);
  }

  const averageScore =
    challengeScores.length === 0 ? 0 : Math.round(challengeScores.reduce((a, b) => a + b, 0) / challengeScores.length);

  const exerciseMetrics: ExerciseMetrics = {
    totalExercises,
    completedExercises,
    exercisesByDifficulty,
    exercisesByCategory,
    totalTimeSpent: totalExerciseTime,
    averageScore,
  };

  // Review metrics
  const totalReviews = state.reviewCards.length;
  const pendingReviews = state.reviewCards.filter((r) => r.status === "para-ler").length;
  const completedReviews = state.reviewCards.filter((r) => r.status === "concluido").length;
  const allSessionScores = state.reviewSessions.map((s) => (s.isCorrect ? 1 : 0));
  const accuracyRate =
    allSessionScores.length === 0
      ? 0
      : Math.round(
          (allSessionScores.reduce((a: number, b: number) => a + b, 0) /
            allSessionScores.length) *
            100
        );
  const allResponseTimes = state.reviewSessions.map((s) => s.timeSpentSeconds);
  const averageResponseTime =
    allResponseTimes.length === 0
      ? 0
      : Math.round(
          (allResponseTimes.reduce((a: number, b: number) => a + b, 0) /
            allResponseTimes.length) *
            100
        );

  const reviewsByModule: Record<string, number> = {};
  const reviewsByDifficulty: Record<string, number> = { facil: 0, medio: 0, dificil: 0 };
  for (const rc of state.reviewCards) {
    reviewsByModule[rc.moduleId] = (reviewsByModule[rc.moduleId] ?? 0) + 1;
    reviewsByDifficulty[rc.difficulty] = (reviewsByDifficulty[rc.difficulty] ?? 0) + 1;
  }

  const reviewMetrics: ReviewMetrics = {
    totalReviews,
    pendingReviews,
    completedReviews,
    accuracyRate,
    averageResponseTime,
    reviewsByModule,
    reviewsByDifficulty,
  };

  return {
    totalStudyMinutes,
    exerciseAccuracy,
    lessonsCompleted: completedLessons,
    totalLessons,
    timeSpentByCategory,
    exerciseMetrics,
    reviewMetrics,
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
      return { ...state, reviewCards: state.reviewCards.map((r) => (r.id === reviewId ? { ...r, status: "concluido" } : r)), lastSync: new Date() };
    }

    case "GENERATE_REVIEWS": {
      const reviewedLessonIds = new Set(state.reviewCards.filter((r) => r.source === "lesson").map((r) => r.sourceId));
      const allLessons = state.modules.flatMap((m) => m.lessons);
      const newReviews: ReviewCard[] = [];
      for (const lessonId of state.lessonsCompleted) {
        if (reviewedLessonIds.has(lessonId)) continue;
        const lesson = allLessons.find((l) => l.id === lessonId);
        if (!lesson) continue;
        newReviews.push({
          id: `review-lesson-${lessonId}`,
          title: lesson.title,
          moduleId: lesson.moduleId,
          question: `Revisão: ${lesson.title}`,
          answer: lesson.textContent ?? "Revise os principais conceitos da aula.",
          difficulty: "medio",
          status: "para-ler",
          nextReviewDate: new Date(Date.now() + 86400000),
          interval: 1,
          repetitions: 0,
          easeFactor: 2.5,
          lastReviewedAt: null,
          timesReviewed: 0,
          source: "lesson",
          sourceId: lessonId,
        });
      }
      return { ...state, reviewCards: [...newReviews, ...state.reviewCards], lastSync: new Date() };
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

    // ===== LAB ACTIONS =====
    case "SET_ACTIVE_PROJECT": {
      const { projectId } = action.payload;
      const project = state.labProjects.find((p) => p.id === projectId);
      if (!project) return state;
      return {
        ...state,
        activeProjectId: projectId,
        activeFileId: project.files[0]?.id ?? null,
        openTabs: project.files.map((f) => ({
          fileId: f.id,
          fileName: f.name,
          language: f.language,
          isActive: f.id === (project.files[0]?.id ?? ""),
        })),
        lastSync: new Date(),
      };
    }

    case "UPDATE_LAB_FILE": {
      const { fileId, content } = action.payload;
      return {
        ...state,
        labProjects: state.labProjects.map((p) => ({
          ...p,
          files: p.files.map((f) =>
            f.id === fileId ? { ...f, content, updatedAt: new Date() } : f
          ),
        })),
        lastSync: new Date(),
      };
    }

    case "SET_ACTIVE_FILE": {
      const { fileId } = action.payload;
      return {
        ...state,
        activeFileId: fileId,
        openTabs: state.openTabs.map((t) => ({ ...t, isActive: t.fileId === fileId })),
        lastSync: new Date(),
      };
    }

    case "ADD_OPEN_TAB": {
      const { tab } = action.payload;
      if (state.openTabs.some((t) => t.fileId === tab.fileId)) return state;
      return {
        ...state,
        openTabs: state.openTabs.map((t) => ({ ...t, isActive: false })).concat({
          ...tab,
          isActive: true,
        }),
        activeFileId: tab.fileId,
        lastSync: new Date(),
      };
    }

    case "REMOVE_OPEN_TAB": {
      const { fileId } = action.payload;
      const tabs = state.openTabs.filter((t) => t.fileId !== fileId);
      const activeTab = tabs.find((t) => t.isActive);
      return {
        ...state,
        openTabs: tabs,
        activeFileId: activeTab?.fileId ?? null,
        lastSync: new Date(),
      };
    }

    case "SET_ACTIVE_TAB": {
      const { fileId } = action.payload;
      return {
        ...state,
        openTabs: state.openTabs.map((t) => ({ ...t, isActive: t.fileId === fileId })),
        activeFileId: fileId,
        lastSync: new Date(),
      };
    }

    case "TERMINAL_INPUT": {
      const { text } = action.payload;
      return {
        ...state,
        terminal: { ...state.terminal, currentInput: text },
      };
    }

    case "TERMINAL_EXECUTE": {
      const { command } = action.payload;
      const now = new Date();
      const inputLine: TerminalLine = {
        id: `term-${Date.now()}`,
        type: "input",
        text: `> ${command}`,
        timestamp: now,
      };

      let outputLines: TerminalLine[] = [inputLine];

      const cmd = command.trim().toLowerCase();
      if (cmd === "npm start") {
        outputLines.push(
          {
            id: `term-${Date.now() + 1}`,
            type: "output",
            text: "Local: http://localhost:3000",
            timestamp: new Date(now.getTime() + 100),
          },
          {
            id: `term-${Date.now() + 2}`,
            type: "output",
            text: "Compiling...",
            timestamp: new Date(now.getTime() + 200),
          },
          {
            id: `term-${Date.now() + 3}`,
            type: "success",
            text: "Compiled successfully! You can now view e-commerce in the browser.",
            timestamp: new Date(now.getTime() + 500),
          }
        );
      } else if (cmd === "ls") {
        outputLines.push(
          {
            id: `term-${Date.now() + 1}`,
            type: "output",
            text: "src/  package.json  README.md  node_modules/",
            timestamp: new Date(now.getTime() + 100),
          }
        );
      } else if (cmd === "clear") {
        outputLines = [];
      } else if (cmd === "e-commerce") {
        outputLines.push(
          {
            id: `term-${Date.now() + 1}`,
            type: "output",
            text: "E-Commerce-Full-Stack 1v3.981",
            timestamp: new Date(now.getTime() + 100),
          }
        );
      } else {
        outputLines.push(
          {
            id: `term-${Date.now() + 1}`,
            type: "error",
            text: `Comando não reconhecido: ${command}`,
            timestamp: new Date(now.getTime() + 100),
          }
        );
      }

      return {
        ...state,
        terminal: {
          ...state.terminal,
          lines: [...state.terminal.lines, ...outputLines],
          currentInput: "",
          commandHistory: [...state.terminal.commandHistory, command],
          historyIndex: -1,
        },
        labTimeSpent: state.labTimeSpent + 5,
        lastSync: now,
      };
    }

    case "TERMINAL_ADD_LINE": {
      const { line } = action.payload;
      return {
        ...state,
        terminal: { ...state.terminal, lines: [...state.terminal.lines, line] },
      };
    }

    case "TICK_LAB_TIMER": {
      return {
        ...state,
        labTimeSpent: state.labTimeSpent + (action.payload.seconds ?? 0),
        lastSync: new Date(),
      };
    }

    // ===== EXERCISE CHALLENGE ACTIONS =====
    case "START_EXERCISE": {
      const { exerciseId } = action.payload;
      return {
        ...state,
        activeExerciseId: exerciseId,
        exerciseChallenges: state.exerciseChallenges.map((ex) =>
          ex.id === exerciseId
            ? { ...ex, status: "in-progress" as const, progress: ex.progress > 0 ? ex.progress : 5 }
            : ex
        ),
        lastSync: new Date(),
      };
    }

    case "COMPLETE_CHALLENGE": {
      const { exerciseId, score, testResults } = action.payload;
      const now = new Date();

      const challenge = state.exerciseChallenges.find((ex) => ex.id === exerciseId);
      const relatedNodeId = challenge?.relatedNodeId;

      let newNodes = state.roadmapNodes;
      if (relatedNodeId) {
        newNodes = state.roadmapNodes.map((node) => {
          if (node.id !== relatedNodeId) return node;
          const currentProgress = node.progress;
          const newProgress = Math.min(100, currentProgress + 20);
          let nodeStatus: RoadmapStatus = node.status;
          if (newProgress >= 100) nodeStatus = "completo";
          else if (newProgress > 0) nodeStatus = "em-andamento";
          return { ...node, progress: newProgress, status: nodeStatus };
        });
      }

      const updatedChallenges = state.exerciseChallenges.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const existingTime = state.exerciseTimeSpent[exerciseId] ?? 0;

        return {
          ...ex,
          status: "completed" as ExerciseChallenge["status"],
          progress: 100,
          bestScore: ex.bestScore === undefined || score > ex.bestScore ? score : ex.bestScore,
          attempts: ex.attempts + 1,
          timeSpent: ex.timeSpent + existingTime,
        };
      });

      const newExercisesDone = { ...state.exercisesDone, [exerciseId]: { score, completedAt: now } };

      let newReviews = state.reviewCards;
      if (challenge && score < 100) {
        const alreadyExists = state.reviewCards.some(
          (r) => r.source === "exercise" && r.sourceId === exerciseId
        );
        if (!alreadyExists) {
          newReviews = [
            ...state.reviewCards,
            {
              id: `review-ex-${exerciseId}`,
              title: challenge.title,
              moduleId: challenge.relatedModuleId!,
              source: "exercise",
              sourceId: exerciseId,
              question: `Revisão: ${challenge.title}`,
              answer: `Revise os conceitos do desafio: ${challenge.description}. Foque nos pontos que errou nos testes.`,
              nextReviewDate: new Date(Date.now() + 86400000),
              interval: 1,
              repetitions: 1,
              easeFactor: 2.0,
              difficulty: challenge.difficulty,
              status: "para-ler",
              lastReviewedAt: null,
              timesReviewed: 0,
            },
          ];
        }
      }

      const totalExercises = updatedChallenges.length;
      const completedExercises = updatedChallenges.filter((e) => e.status === "completed").length;
      const exercisesByDifficulty: Record<string, number> = { facil: 0, medio: 0, dificil: 0 };
      const exercisesByCategory: Record<string, number> = {};
      let totalExerciseTime = 0;
      let challengeScores: number[] = [];

      for (const ex of updatedChallenges) {
        exercisesByDifficulty[ex.difficulty] = (exercisesByDifficulty[ex.difficulty] ?? 0) + 1;
        exercisesByCategory[ex.category] = (exercisesByCategory[ex.category] ?? 0) + 1;
        totalExerciseTime += ex.timeSpent;
        if (ex.bestScore !== undefined) challengeScores.push(ex.bestScore);
      }

      const averageScore =
        challengeScores.length === 0 ? 0 : Math.round(challengeScores.reduce((a, b) => a + b, 0) / challengeScores.length);

      const exerciseMetrics: ExerciseMetrics = {
        totalExercises,
        completedExercises,
        exercisesByDifficulty,
        exercisesByCategory,
        totalTimeSpent: totalExerciseTime,
        averageScore,
      };

      return {
        ...state,
        exerciseChallenges: updatedChallenges,
        exercisesDone: newExercisesDone,
        exerciseTestResults: {
          ...state.exerciseTestResults,
          [exerciseId]: testResults,
        },
        roadmapNodes: newNodes,
        reviewCards: newReviews,
        exerciseMetrics,
        lastSync: now,
      };
    }

    case "FAIL_CHALLENGE": {
      const { exerciseId, testResults } = action.payload;
      return {
        ...state,
        exerciseChallenges: state.exerciseChallenges.map((ex) =>
          ex.id === exerciseId
            ? { ...ex, attempts: ex.attempts + 1, status: "in-progress" as const }
            : ex
        ),
        exerciseTestResults: {
          ...state.exerciseTestResults,
          [exerciseId]: testResults,
        },
        lastSync: new Date(),
      };
    }

    case "UPDATE_EXERCISE_CODE": {
      const { exerciseId, code } = action.payload;
      return {
        ...state,
        exerciseChallenges: state.exerciseChallenges.map((ex) =>
          ex.id === exerciseId ? { ...ex, starterCode: code } : ex
        ),
        lastSync: new Date(),
      };
    }

    case "ADD_EXERCISE_TIME": {
      const { exerciseId, seconds } = action.payload;
      return {
        ...state,
        exerciseTimeSpent: {
          ...state.exerciseTimeSpent,
          [exerciseId]: (state.exerciseTimeSpent[exerciseId] ?? 0) + seconds,
        },
        lastSync: new Date(),
      };
    }

    // ===== REVIEW / SRS ACTIONS =====
    case "START_REVIEW": {
      const { reviewId } = action.payload;
      return {
        ...state,
        reviewCards: state.reviewCards.map((r) =>
          r.id === reviewId ? { ...r, lastReviewedAt: new Date(), timesReviewed: r.timesReviewed + 1 } : r
        ),
        lastSync: new Date(),
      };
    }

    case "COMPLETE_REVIEW": {
      const { reviewId, isCorrect, difficulty, timeSpentSeconds } = action.payload;
      const now = new Date();

      const updatedCards = state.reviewCards.map((r) => {
        if (r.id !== reviewId) return r;

        // SM-2 algoritmo simplificado
        let { interval, repetitions, easeFactor } = r;

        if (isCorrect) {
          if (repetitions === 0) interval = 1;
          else if (repetitions === 1) interval = 6;
          else interval = Math.round(interval * easeFactor);
          repetitions += 1;
          easeFactor = easeFactor + 0.1;
        } else {
          interval = 1;
          repetitions = 0;
          easeFactor = Math.max(1.3, easeFactor - 0.2);
        }

        const nextReviewDate = new Date(Date.now() + interval * 86400000);
        const status: ReviewCard["status"] = "concluido";

        return {
          ...r,
          status,
          interval,
          repetitions,
          easeFactor,
          lastReviewedAt: now,
          nextReviewDate,
          difficulty: difficulty as ReviewCard["difficulty"],
        };
      });

      const newSessions = [
        ...state.reviewSessions,
        {
          reviewId,
          isCorrect,
          difficulty: difficulty as ReviewCard["difficulty"],
          timeSpentSeconds,
          reviewedAt: now,
        },
      ];

      return {
        ...state,
        reviewCards: updatedCards,
        reviewSessions: newSessions,
        reviewTimeSpent: state.reviewTimeSpent + timeSpentSeconds,
        lastSync: now,
      };
    }

    case "GENERATE_REVIEW_FROM_LESSON": {
      const { lessonId, moduleId, title, question, answer } = action.payload;
      const alreadyExists = state.reviewCards.some(
        (r) => r.source === "lesson" && r.sourceId === lessonId
      );
      if (alreadyExists) return state;

      const newCard: ReviewCard = {
        id: `review-lesson-${lessonId}-${Date.now()}`,
        title,
        moduleId,
        question,
        answer,
        difficulty: "medio",
        status: "para-ler",
        nextReviewDate: new Date(Date.now() + 86400000),
        interval: 1,
        repetitions: 0,
        easeFactor: 2.5,
        lastReviewedAt: null,
        timesReviewed: 0,
        source: "lesson",
        sourceId: lessonId,
      };

      return {
        ...state,
        reviewCards: [...state.reviewCards, newCard],
        lastSync: new Date(),
      };
    }

    case "GENERATE_REVIEW_FROM_EXERCISE": {
      const { exerciseId, moduleId, title, question, answer } = action.payload;
      const alreadyExists = state.reviewCards.some(
        (r) => r.source === "exercise" && r.sourceId === exerciseId
      );
      if (alreadyExists) return state;

      const newCard: ReviewCard = {
        id: `review-ex-${exerciseId}-${Date.now()}`,
        title,
        moduleId,
        question,
        answer,
        difficulty: "dificil",
        status: "para-ler",
        nextReviewDate: new Date(Date.now() + 86400000),
        interval: 1,
        repetitions: 0,
        easeFactor: 2.0,
        lastReviewedAt: null,
        timesReviewed: 0,
        source: "exercise",
        sourceId: exerciseId,
      };

      return {
        ...state,
        reviewCards: [...state.reviewCards, newCard],
        lastSync: new Date(),
      };
    }

    case "ARCHIVE_REVIEW": {
      const { reviewId } = action.payload;
      return {
        ...state,
        reviewCards: state.reviewCards.map((r) =>
          r.id === reviewId ? { ...r, status: "arquivado" } : r
        ),
        lastSync: new Date(),
      };
    }

    case "UPDATE_REVIEW_TIME": {
      const { reviewId, seconds } = action.payload;
      return {
        ...state,
        reviewTimeSpent: state.reviewTimeSpent + seconds,
        lastSync: new Date(),
      };
    }

    // ===== PORTFOLIO PROJECTS ACTIONS =====
    case "ADD_PROJECT": {
      const { project } = action.payload;
      return {
        ...state,
        projects: [project, ...state.projects],
        lastSync: new Date(),
      };
    }

    case "UPDATE_PROJECT_PROGRESS": {
      const { projectId, progress } = action.payload;
      const clamped = Math.min(100, Math.max(0, progress));
      return {
        ...state,
        projects: state.projects.map((p) => {
          if (p.id !== projectId) return p;
          const status = clamped >= 100 ? "completed" : p.status === "idea" && clamped === 0 ? "idea" : "in-progress";
          return {
            ...p,
            progress: clamped,
            status,
            commits: p.commits + (clamped > p.progress ? 1 : 0),
            updatedAt: new Date(),
          };
        }),
        lastSync: new Date(),
      };
    }

    case "TOGGLE_HIGHLIGHT": {
      const { projectId } = action.payload;
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === projectId ? { ...p, isHighlighted: !p.isHighlighted, updatedAt: new Date() } : p
        ),
        lastSync: new Date(),
      };
    }

    case "TOGGLE_REVIEW": {
      const { projectId } = action.payload;
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === projectId ? { ...p, needsReview: !p.needsReview, updatedAt: new Date() } : p
        ),
        lastSync: new Date(),
      };
    }

    case "UPDATE_PROJECT": {
      const { projectId, changes } = action.payload;
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === projectId ? { ...p, ...changes, progress: changes.status === "completed" ? 100 : p.progress, updatedAt: new Date() } : p
        ),
        lastSync: new Date(),
      };
    }

    case "UPDATE_LAB_PROJECT_PROGRESS": {
      const { projectId, progress } = action.payload;
      const clamped = Math.min(100, Math.max(0, progress));
      const status = clamped >= 100 ? "completed" : clamped > 0 ? "in-progress" : "not-started";
      // Regra A: sincroniza Laboratório -> Portfólio
      const linked = state.projects.filter((p) => p.relatedLabProjectId === projectId);
      return {
        ...state,
        labProjects: state.labProjects.map((p) =>
          p.id === projectId ? { ...p, progress: clamped, status } : p
        ),
        projects: state.projects.map((p) => {
          if (p.relatedLabProjectId !== projectId) return p;
          const next: { progress: number; status: "in-progress" | "completed" | "idea" } =
            clamped >= 100 ? { progress: 100, status: "completed" } : { progress: clamped, status: "in-progress" };
          return { ...p, ...next, updatedAt: new Date() };
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
