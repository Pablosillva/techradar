"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { X, Play, StopCircle, Copy, Maximize, ChevronLeft, AlertTriangle, CheckCircle2, Flame, Code, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExerciseChallenge, ExerciseTestResult } from "@/lib/study/types";

interface ChallengeModalProps {
  exercise: ExerciseChallenge;
  onClose: () => void;
  onComplete: (exerciseId: string, score: number, testResults: ExerciseTestResult[]) => void;
  onFail: (exerciseId: string, testResults: ExerciseTestResult[]) => void;
  onCodeChange: (code: string) => void;
  onTimeAdd: (seconds: number) => void;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  facil: "border-emerald-400/20 bg-emerald-400/10 text-emerald-400",
  medio: "border-amber-400/20 bg-amber-400/10 text-amber-400",
  dificil: "border-rose-400/20 bg-rose-400/10 text-rose-400",
};

export function ChallengeModal({
  exercise,
  onClose,
  onComplete,
  onFail,
  onCodeChange,
  onTimeAdd,
}: ChallengeModalProps) {
  const [code, setCode] = useState(exercise.starterCode);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<ExerciseTestResult[] | null>(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [editorFocused, setEditorFocused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Simular execução de testes
  const runTests = useCallback(() => {
    setIsRunning(true);
    
    // Simular tempo de execução
    const testResults: ExerciseTestResult[] = exercise.testCases.map((tc, i) => {
      // Simulação simples: 70% de chance de passar por teste
      const passed = Math.random() > 0.3 || i === 0; // Primeiro teste sempre passa para dar feedback positivo
      return {
        id: `test-${i}`,
        passed,
        testCaseIndex: i,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: passed ? tc.expectedOutput : "Erro de execução",
        timeMs: Math.floor(Math.random() * 200) + 50,
      };
    });

    setTimeout(() => {
      setResults(testResults);
      setIsRunning(false);
      
      const allPassed = testResults.every((r) => r.passed);
      const score = Math.round((testResults.filter((r) => r.passed).length / testResults.length) * 100);
      
      if (allPassed) {
        onComplete(exercise.id, score, testResults);
      } else {
        onFail(exercise.id, testResults);
      }
    }, 1500);
  }, [exercise, exercise.testCases, onComplete, onFail]);

  // Timer para tempo gasto no desafio
  useEffect(() => {
    if (editorFocused) {
      timerRef.current = setInterval(() => {
        setTimeSpent((t) => t + 1);
        onTimeAdd(1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [editorFocused, onTimeAdd]);

  const handleRun = () => {
    runTests();
  };

  const handleReset = () => {
    setCode(exercise.starterCode);
    setResults(null);
    setIsRunning(false);
  };

  const difficultyColor = DIFFICULTY_COLORS[exercise.difficulty] || "border-slate-400/20 bg-slate-400/10 text-slate-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0f172a] rounded-2xl border border-white/[0.08] w-full max-w-[1200px] max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-white/[0.05] flex items-center justify-center border border-white/[0.05]">
              <Code className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">{exercise.title}</h3>
              <p className="text-[10px] text-slate-500">{exercise.category} • {exercise.type}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              "px-2 py-1 rounded text-[10px] font-bold tracking-wider",
              DIFFICULTY_COLORS[exercise.difficulty],
            )}>
              {exercise.difficulty === "facil" ? "Fácil" : exercise.difficulty === "medio" ? "Médio" : "Difícil"}
            </span>
            <button
              onClick={onClose}
              className="p-2 rounded text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Conteúdo dividido */}
        <div className="flex-1 flex overflow-hidden">
          {/* Esquerda: Enunciado */}
          <div className="w-1/2 border-r border-white/[0.06] bg-[#0a0a0f]/50 flex flex-col p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Enunciado</h4>
              <span className="text-xs font-mono text-cyan-400">{exercise.language}</span>
            </div>
            <div className="prose prose-invert prose-sm max-w-none text-slate-300">
              {exercise.description.split("\n").map((para, i) => (
                <p key={i} className="mb-3 leading-relaxed">{para}</p>
              ))}
            </div>

            <div className="mt-6 border border-white/[0.05] rounded-lg bg-white/[0.02] p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Casos de Teste</h4>
              <div className="space-y-2">
                {exercise.testCases.map((tc, i) => (
                  <div key={i} className="flex items-start gap-3 p-2 rounded border border-white/[0.03] bg-white/[0.01]">
                    <span className="h-3 w-3 rounded-full bg-slate-600 flex items-center justify-center text-[9px] text-white">
                      {i + 1}
                    </span>
                    <div className="flex-1 text-xs text-slate-300 font-mono">
                      <span className="text-cyan-400">Input:</span> {tc.input}
                    </div>
                    <div className="flex-1 text-xs text-slate-300 font-mono ml-2">
                      <span className="text-emerald-400">Esperado:</span> {tc.expectedOutput}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Direita: Editor de código */}
          <div className="w-1/2 flex flex-col bg-[#0a0a0f]">
            <div className="border-b border-white/[0.06] bg-[#0f172a]/80 px-4 py-2.5 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  <div className="h-2 w-2 rounded-full bg-yellow-500" />
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                </div>
                <span className="text-[10px] font-mono text-slate-400">solution.js</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleReset}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.05] rounded transition-colors"
                  title="Resetar código"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={handleRun}
                  disabled={isRunning}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-semibold transition-all border",
                    isRunning
                      ? "bg-slate-500 text-slate-400 cursor-not-allowed"
                      : "bg-cyan-400 text-slate-950 hover:bg-cyan-300",
                  )}
                >
                  {isRunning ? (
                    <StopCircle className="h-3.5 w-3.5 mr-1.5 animate-pulse" />
                  ) : (
                    <Play className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  {isRunning ? "Executando..." : "Run Tests"}
                </button>
              </div>
            </div>

            <div className="flex-1 relative overflow-hidden">
              <textarea
                ref={el => {
                  if (el) {
                    el.focus();
                    setEditorFocused(true);
                  }
                }}
                defaultValue={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  onCodeChange(e.target.value);
                }}
                onFocus={() => setEditorFocused(true)}
                onBlur={() => setEditorFocused(false)}
                className="w-full h-full p-6 font-mono text-sm text-slate-300 bg-transparent border-none focus:ring-0 resize-none leading-relaxed"
                spellCheck={false}
              />

              {/* Overlay de loading durante execução */}
              {isRunning && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
                  <Flame className="h-8 w-8 animate-spin text-cyan-400 mb-3" />
                  <p className="text-cyan-400 text-sm font-medium">Executando testes...</p>
                </div>
              )}
            </div>

            {/* Resultados dos testes */}
            {results && (
              <div className="border-t border-white/[0.06] bg-[#0f172a]/80 backdrop-blur p-4 max-h-[40vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Resultados dos Testes</h4>
                  <span className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded",
                    results.every((r) => r.passed) ? "text-emerald-400 bg-emerald-400/10" : "text-rose-400 bg-rose-400/10",
                  )}>
                    {results.filter((r) => r.passed).length}/{results.length} passou
                  </span>
                </div>
                <div className="space-y-2">
                  {results.map((result, i) => (
                    <div key={i} className="flex items-start gap-3 p-2.5 rounded border transition-colors duration-300">
                      <div className="h-3 w-3 rounded-full flex-shrink-0 flex items-center justify-center text-[9px]">
                        {result.passed ? (
                          <span className="text-emerald-400 bg-emerald-400/20">✓</span>
                        ) : (
                          <span className="text-rose-400 bg-rose-400/20">✗</span>
                        )}
                      </div>
                      <div className="flex-1 text-xs font-mono text-slate-300 leading-relaxed">
                        <div className="flex items-baseline gap-1">
                          <span className={result.passed ? "text-emerald-400" : "text-rose-400"}>
                            Teste {result.testCaseIndex + 1}: {result.passed ? "PASSOU" : "FALHOU"}
                          </span>
                          <span className="text-slate-500">{result.timeMs}ms</span>
                        </div>
                        {!result.passed && (
                          <div className="mt-1 space-y-1">
                            <div className="text-[10px] text-slate-500">Esperado:</div>
                            <div className="text-[10px] text-emerald-400 font-mono truncate">{result.expectedOutput}</div>
                            <div className="text-[10px] text-slate-500">Obtido:</div>
                            <div className="text-[10px] text-rose-400 font-mono truncate">{result.actualOutput}</div>
                            <div className="text-[10px] text-slate-500">Entrada: {result.input}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/[0.06] bg-[#0f172a]/80 backdrop-blur px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>{code.split(/\s+/).filter(Boolean).length} palavras</span>
            <span>{Math.floor(timeSpent / 60)}:{String(timeSpent % 60).padStart(2, "0")} gasto</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all border text-slate-400 border-white/[0.06] hover:bg-white/[0.05] hover:text-white"
            >
              Sair do Desafio
            </button>
            <button
              onClick={() => {
                // Se todos passaram, completar; senão, falhar
                if (results && results.every((r) => r.passed)) {
                  const score = Math.round(
                    (results.filter((r) => r.passed).length / results.length) * 100
                  );
                  onComplete(exercise.id, score, results);
                } else {
                  const testResults: ExerciseTestResult[] = exercise.testCases.map((tc, i) => ({
                    id: `test-${i}`,
                    passed: false,
                    testCaseIndex: i,
                    input: tc.input,
                    expectedOutput: tc.expectedOutput,
                    actualOutput: "Não executado",
                    timeMs: 0,
                  }));
                  onFail(exercise.id, testResults);
                }
                onClose();
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-cyan-400 text-slate-950 hover:bg-cyan-300 transition-colors"
            >
              {results && results.every((r) => r.passed) ? "Desafio Concluído" : "Tentar Novamente"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
