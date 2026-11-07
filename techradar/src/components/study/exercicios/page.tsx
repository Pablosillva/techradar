"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Play,
  StopCircle,
  Copy,
  Maximize,
  X,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Code,
  FlaskConical,
  Database,
  Settings,
  MoreHorizontal,
  Layout,
  Terminal,
  Gauge,
  BarChart3,
  Clock,
  FileCode,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStudy } from "@/lib/study/context";
import type { ExerciseChallenge, ModuleCategory } from "@/lib/study/types";
import { ExerciseCard } from "./exercise-card";
import { ChallengeModal } from "./challenge-modal";
import { FiltersPanel } from "./filters-panel";

export default function ExerciciosPage() {
  const {
    exerciseChallenges,
    activeExerciseId,
    startExercise,
    completeChallenge,
    failChallenge,
    updateExerciseCode,
    addExerciseTime,
    getChallengesByCategory,
    getChallengesByDifficulty,
    getChallengesByStatus,
    getExerciseMetrics,
    categoryProgress,
    pendingReviewsCount,
  } = useStudy();

  const exerciseMetrics = getExerciseMetrics();

  const [activeTab, setActiveTab] = useState("javascript-challenges");
  const [activeSubTab, setActiveSubTab] = useState("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    difficulty: "todos",
    language: "todos",
    type: "todos",
    tags: [] as string[],
  });
  const [challengeModal, setChallengeModal] = useState<{
    exercise: ExerciseChallenge | null;
    open: boolean;
  }>({ exercise: null, open: false });

  const tabs = [
    { id: "javascript-challenges", label: "JavaScript Challenges", icon: FileCode },
    { id: "python-puzzles", label: "Python Puzzles", icon: Code },
    { id: "sql-scenarios", label: "SQL Scenarios", icon: Database },
    { id: "react-coding", label: "React Coding", icon: Layout },
    { id: "system-design", label: "System Design", icon: Gauge },
  ];

  const subTabs = [
    { id: "active", label: "Active Exercises" },
    { id: "completed", label: "Completed" },
  ];

  const difficultyLabels: Record<string, string> = {
    facil: "Fácil",
    medio: "Médio",
    dificil: "Difícil",
  };

  const difficultyColors: Record<string, string> = {
    facil: "text-emerald-400 border-emerald-400/20 bg-emerald-400/10",
    medio: "text-amber-400 border-amber-400/20 bg-amber-400/10",
    dificil: "text-rose-400 border-rose-400/20 bg-rose-400/10",
  };

  // Filter exercises based on active tab, sub tab, search, and filters
  const filteredExercises = useMemo(() => {
    let exercises = exerciseChallenges.filter((ex) => {
      // Filter by active tab category
      if (activeTab === "javascript-challenges") {
        return ex.language === "javascript";
      }
      if (activeTab === "python-puzzles") {
        return ex.language === "python";
      }
      if (activeTab === "sql-scenarios") {
        return ex.language === "sql";
      }
      if (activeTab === "react-coding") {
        return ex.tags.includes("React");
      }
      if (activeTab === "system-design") {
        return ex.type === "system-design";
      }
      return true;
    });

    // Filter by sub tab status
    if (activeSubTab === "completed") {
      exercises = exercises.filter((ex) => ex.status === "completed");
    } else {
      exercises = exercises.filter((ex) => ex.status !== "completed");
    }

    // Filter by difficulty
    if (filters.difficulty !== "todos") {
      exercises = exercises.filter((ex) => ex.difficulty === filters.difficulty);
    }

    // Filter by language
    if (filters.language !== "todos") {
      exercises = exercises.filter((ex) => ex.language === filters.language);
    }

    // Filter by type
    if (filters.type !== "todos") {
      exercises = exercises.filter((ex) => ex.type === filters.type);
    }

    // Filter by tags
    if (filters.tags.length > 0) {
      exercises = exercises.filter((ex) =>
        filters.tags.some((tag) => ex.tags.includes(tag))
      );
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      exercises = exercises.filter(
        (ex) =>
          ex.title.toLowerCase().includes(q) ||
          ex.description.toLowerCase().includes(q) ||
          ex.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return exercises;
  }, [
    exerciseChallenges,
    activeTab,
    activeSubTab,
    searchQuery,
    filters.difficulty,
    filters.language,
    filters.type,
    filters.tags,
  ]);

  const handleOpenChallenge = (exercise: ExerciseChallenge) => {
    startExercise(exercise.id);
    setChallengeModal({ exercise, open: true });
  };

  const handleCloseChallenge = () => {
    setChallengeModal({ exercise: null, open: false });
  };

  const handleChallengeComplete = (
    exerciseId: string,
    score: number,
    testResults: { passed: boolean; testCaseIndex: number; input: string; expectedOutput: string; actualOutput: string; timeMs: number }[]
  ) => {
    completeChallenge(exerciseId, score, testResults);
    setChallengeModal({ exercise: null, open: false });
  };

  const handleChallengeFail = (
    exerciseId: string,
    testResults: { passed: boolean; testCaseIndex: number; input: string; expectedOutput: string; actualOutput: string; timeMs: number }[]
  ) => {
    failChallenge(exerciseId, testResults);
  };

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-300 overflow-hidden">
      {/* ============ HEADER ============ */}
      <header className="h-16 shrink-0 border-b border-white/[0.06] bg-[#0f172a]/80 backdrop-blur px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-cyan-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Prática & Desafios</h1>
          </Link>
          <p className="text-sm text-slate-400">
            Teste suas habilidades com desafios de código práticos
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Pesquisa Rápida em Notas"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 h-9 pl-9 pr-3 rounded-lg border border-white/[0.06] bg-white/[0.02] text-xs text-slate-200 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400 transition-colors placeholder-slate-500"
          />
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Tabs de categoria */}
        <div className="h-10 shrink-0 border-b border-white/[0.06] bg-[#0f172a]/80 backdrop-blur px-6 flex items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 py-2 text-xs font-medium transition-all border-b-2",
                  isActive
                    ? "text-cyan-400 border-cyan-400 bg-white/[0.03]"
                    : "text-slate-400 border-transparent hover:text-slate-200 hover:bg-white/[0.02]",
                )}
              >
                <tab.icon className="h-3.5 w-3.5 mr-1" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 min-w-0 flex">
          {/* Sub-tabs */}
          <div className="w-64 shrink-0 border-r border-white/[0.06] bg-[#0f172a]/80 backdrop-blur flex flex-col z-10">
            <div className="px-4 py-3 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white">Filtros</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Sub-tabs Active/Completed */}
              <div className="mb-6">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">Status</h4>
                <div className="flex gap-2">
                  {subTabs.map((st) => {
                    const isActive = activeSubTab === st.id;
                    return (
                      <button
                        key={st.id}
                        onClick={() => setActiveSubTab(st.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                          isActive
                            ? "bg-cyan-400/10 text-cyan-400 border-cyan-400/20"
                            : "text-slate-400 border-transparent hover:text-slate-200 hover:bg-white/[0.02]",
                        )}
                      >
                        {st.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <FiltersPanel
                filters={filters}
                setFilters={setFilters}
                exercises={filteredExercises}
              />
            </div>
          </div>

          {/* Conteúdo principal: Grid de exercícios */}
          <div className="flex-1 min-w-0 p-6 md:p-8 overflow-y-auto">
            <div className="max-w-[1400px] mx-auto">
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredExercises.length === 0 ? (
                    <div className="col-span-full rounded-xl border border-dashed border-white/[0.08] bg-transparent p-16 text-center">
                      <AlertCircle className="mx-auto h-12 w-12 text-slate-500 mb-3" />
                      <h3 className="text-sm font-semibold text-white">Nenhum desafio encontrado</h3>
                      <p className="text-sm text-slate-500">
                        Tente ajustar os filtros ou selecionar outra categoria.
                      </p>
                    </div>
                  ) : (
                    filteredExercises.map((exercise) => (
                      <ExerciseCard
                        key={exercise.id}
                        exercise={exercise}
                        isActive={activeExerciseId === exercise.id}
                        onOpen={() => handleOpenChallenge(exercise)}
                        difficultyLabels={difficultyLabels}
                        difficultyColors={difficultyColors}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Painel direito: Estatísticas */}
          <div className="w-80 shrink-0 border-l border-white/[0.06] bg-[#0f172a]/80 backdrop-blur flex flex-col z-10">
            <div className="p-4 border-b border-white/[0.06]">
              <h2 className="text-sm font-semibold text-white mb-2">Your Learning Status</h2>
              <p className="text-xs text-slate-500">Acompanhe seu progresso nos desafios</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Métricas gerais */}
              <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">Categories</h3>
                <div className="space-y-3">
                  {[
                    { label: "Web Development", category: "web-development" as ModuleCategory },
                    { label: "Mobile Dev", category: "mobile-dev" as ModuleCategory },
                    { label: "DevOps", category: "devops" as ModuleCategory },
                    { label: "Cloud Computing", category: "cloud-computing" as ModuleCategory },
                    { label: "Data Science", category: "data-science" as ModuleCategory },
                  ].map((cat) => {
                    const progress = categoryProgress(cat.category);
                    return (
                      <div key={cat.category} className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">{cat.label}</span>
                          <span className="text-slate-200 font-medium">{progress}%</span>
                        </div>
                        <div className="h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-400 to-violet-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">Difficulty Breakdown</h3>
                <div className="h-32 flex items-end gap-2">
                  {[
                    { label: "Easy", value: exerciseMetrics.exercisesByDifficulty.facil ?? 0, color: "#22c55e" },
                    { label: "Medium", value: exerciseMetrics.exercisesByDifficulty.medio ?? 0, color: "#06b6d4" },
                    { label: "Hard", value: exerciseMetrics.exercisesByDifficulty.dificil ?? 0, color: "#a855f7" },
                  ].map((item) => (
                    <div key={item.label} className="flex flex-col items-center gap-1">
                      <div
                        className="w-16 rounded-t bg-gradient-to-t from-transparent to-current"
                        style={{ height: `${Math.min(100, (item.value / 5) * 100)}%`, backgroundColor: item.color }}
                      />
                      <span className="text-[10px] text-slate-400">{item.label}</span>
                      <span className="text-xs font-medium text-white">{item.value}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-2">
                  <span>Easy</span>
                  <span>Medium</span>
                  <span>Hard</span>
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">Time Spent on Exercises</h3>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-slate-400">Total time</span>
                  <span className="text-slate-200 font-medium">
                    {Math.floor(exerciseMetrics.totalTimeSpent / 60)}h {exerciseMetrics.totalTimeSpent % 60}m
                  </span>
                </div>
                <select
                  defaultValue="1h 0m"
                  className="w-full bg-transparent border border-white/[0.06] rounded text-xs text-slate-200 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400"
                >
                  <option>1h 0m</option>
                  <option>2h 30m</option>
                  <option>5h 0m</option>
                </select>
              </div>

              <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">Top Tech for Practice</h3>
                <div className="space-y-2">
                  {[
                    { label: "Node.js", percent: 85 },
                    { label: "React", percent: 72 },
                    { label: "SQL", percent: 45 },
                    { label: "etc.", percent: 30 },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">{item.label}</span>
                      <div className="w-20 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-400 to-violet-500"
                          style={{ width: `${item.percent}%` }}
                        />
                      </div>
                      <span className="text-slate-200 font-medium">{item.percent}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">Revisões Pendentes</h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{pendingReviewsCount}</span>
                  <button className="px-2 py-1 text-[10px] text-cyan-400 hover:bg-cyan-400/10 rounded">
                    Ver todas
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de desafio */}
      {challengeModal.open && challengeModal.exercise && (
        <ChallengeModal
          exercise={challengeModal.exercise}
          onClose={handleCloseChallenge}
          onComplete={handleChallengeComplete}
          onFail={handleChallengeFail}
          onCodeChange={(code) => updateExerciseCode(challengeModal.exercise!.id, code)}
          onTimeAdd={(seconds) => addExerciseTime(challengeModal.exercise!.id, seconds)}
        />
      )}
    </div>
  );
}
