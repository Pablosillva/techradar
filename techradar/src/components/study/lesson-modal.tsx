"use client";

import { useEffect, useState } from "react";
import { X, Play, Pause, ChevronLeft, Maximize, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStudy } from "@/lib/study/context";
import type { Module, Lesson } from "@/lib/study/types";

export default function LessonModal({
  module,
  lesson,
  onClose,
  onComplete,
}: {
  module: Module;
  lesson: Lesson;
  onClose: () => void;
  onComplete: () => void;
}) {
  const { completeLesson, uncompleteLesson, startTimer, stopTimer } = useStudy();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [timerInterval, setTimerInterval] = useState<ReturnType<typeof setInterval> | null>(null);
  const [completed, setCompleted] = useState(lesson.isCompleted);

  useEffect(() => {
    setCompleted(lesson.isCompleted);
    if (lesson.videoUrl) {
      startTimer(module.id);
    }
  }, []);

  useEffect(() => {
    if (!timerInterval) return;
    const id = setInterval(() => {
      setCurrentTime((t) => t + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [timerInterval]);

  const togglePlay = () => {
    setIsPlaying((p) => {
      if (!p) {
        setTimerInterval(setInterval(() => setCurrentTime((t) => t + 1), 1000));
      } else {
        if (timerInterval) clearInterval(timerInterval);
        setTimerInterval(null);
      }
      return !p;
    });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0f172a] rounded-2xl border border-white/[0.08] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-white/[0.05]">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-white/[0.05] flex items-center justify-center border border-white/[0.05]">
              <Play className="h-4 w-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">{module.title}</h3>
              <p className="text-xs text-slate-500">{lesson.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded text-slate-400 hover:text-white hover:bg-white/[0.05]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative w-full h-[320px] bg-black flex items-center justify-center overflow-hidden">
          {lesson.videoUrl ? (
            <>
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={togglePlay}
                  className="w-16 h-16 rounded-full bg-black/60 flex items-center justify-center backdrop-blur hover:bg-black/80 transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="h-7 w-7 text-white ml-1" />
                  ) : (
                    <Play className="h-7 w-7 text-white" />
                  )}
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-transparent to-transparent">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{formatTime(currentTime)}</span>
                  <span className="text-xs text-slate-400">--:--</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value="0"
                  className="w-full h-1 bg-white/[0.1] rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>
            </>
          ) : (
            <div className="text-center text-slate-500">
              <p>Sem vídeo disponível para esta aula.</p>
              <p className="text-xs mt-2">{lesson.textContent || "Conteúdo em texto não disponível."}</p>
            </div>
          )}
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Ação</span>
            <button
              onClick={() => {
                if (completed) {
                  uncompleteLesson(module.id, lesson.id);
                  setCompleted(false);
                } else {
                  completeLesson(module.id, lesson.id);
                  setCompleted(true);
                }
                onComplete();
              }}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-semibold transition-all border",
                completed
                  ? "bg-emerald-400 text-slate-950 hover:bg-emerald-300"
                  : "border-white/[0.06] text-slate-400 hover:border-white/[0.1] hover:text-white",
              )}
            >
              {completed ? "Marcar como não concluída" : "Concluir aula"}
            </button>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Tags</h4>
            <div className="flex flex-wrap gap-2">
              {lesson.tags.map((tag) => (
                <span key={tag} className="px-2 py-1 rounded border border-white/[0.06] bg-white/[0.02] text-[10px] text-cyan-300">
                  #{tag}
                </span>
              ))}
            </div>

            {lesson.textContent && (
              <div className="pt-4 border-t border-white/[0.05]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Conteúdo</h4>
                <p className="text-sm text-slate-300 leading-relaxed">{lesson.textContent}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
