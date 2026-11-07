"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExerciseChallenge } from "@/lib/study/types";

type FilterKey = "difficulty" | "language" | "type" | "tags";

interface FiltersPanelProps {
  filters: {
    difficulty: string;
    language: string;
    type: string;
    tags: string[];
  };
  setFilters: (filters: {
    difficulty: string;
    language: string;
    type: string;
    tags: string[];
  }) => void;
  exercises: ExerciseChallenge[];
}

const DIFFICULTY_OPTIONS = [
  { value: "todos", label: "Todas" },
  { value: "facil", label: "Fácil" },
  { value: "medio", label: "Médio" },
  { value: "dificil", label: "Difícil" },
];

const LANGUAGE_OPTIONS = [
  { value: "todos", label: "Todas" },
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "sql", label: "SQL" },
  { value: "java", label: "Java" },
];

const TYPE_OPTIONS = [
  { value: "todos", label: "Todos" },
  { value: "algorithm", label: "Algorithm" },
  { value: "coding", label: "Coding" },
  { value: "database", label: "Database" },
  { value: "system-design", label: "System Design" },
];

const TAG_OPTIONS = ["React", "Node.js", "Sorting", "API", "Hooks", "Database"];

export function FiltersPanel({
  filters,
  setFilters,
  exercises,
}: FiltersPanelProps) {
  const [expandedFilters, setExpandedFilters] = useState<Record<FilterKey, boolean>>({
    difficulty: false,
    language: false,
    type: false,
    tags: false,
  });

  const toggleFilter = (key: FilterKey) => {
    setExpandedFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const countByCategory = (category: string) => {
    return exercises.filter((e) => e.category === category).length;
  };

  const countByDifficulty = (difficulty: string) => {
    return exercises.filter((e) => e.difficulty === difficulty).length;
  };

  const countByLanguage = (language: string) => {
    return exercises.filter((e) => e.language === language).length;
  };

  const countByType = (type: string) => {
    return exercises.filter((e) => e.type === type).length;
  };

  const countByTag = (tag: string) => {
    return exercises.filter((e) => e.tags.includes(tag)).length;
  };

  return (
    <div className="space-y-6">
      <FilterAccordion
        title="Difficulty"
        expanded={expandedFilters.difficulty}
        onToggle={() => toggleFilter("difficulty")}
      >
        {DIFFICULTY_OPTIONS.map((opt) => {
          const isSelected = filters.difficulty === opt.value;
          const count = opt.value === "todos" ? exercises.length : countByDifficulty(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => setFilters({ ...filters, difficulty: opt.value })}
              className={cn(
                "w-full flex items-center justify-between px-3 py-1.5 rounded border text-left text-xs transition-colors",
                isSelected
                  ? "bg-cyan-400/10 text-cyan-400 border-cyan-400/20"
                  : "text-slate-400 hover:bg-white/[0.03] hover:text-slate-200 border-transparent",
              )}
            >
              <span>{opt.label}</span>
              <span className="text-slate-600">{count}</span>
            </button>
          );
        })}
      </FilterAccordion>

      <FilterAccordion
        title="Language"
        expanded={expandedFilters.language}
        onToggle={() => toggleFilter("language")}
      >
        {LANGUAGE_OPTIONS.map((opt) => {
          const isSelected = filters.language === opt.value;
          const count = opt.value === "todos" ? exercises.length : countByLanguage(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => setFilters({ ...filters, language: opt.value })}
              className={cn(
                "w-full flex items-center justify-between px-3 py-1.5 rounded border text-left text-xs transition-colors",
                isSelected
                  ? "bg-cyan-400/10 text-cyan-400 border-cyan-400/20"
                  : "text-slate-400 hover:bg-white/[0.03] hover:text-slate-200 border-transparent",
              )}
            >
              <span>{opt.label}</span>
              <span className="text-slate-600">{count}</span>
            </button>
          );
        })}
      </FilterAccordion>

      <FilterAccordion
        title="Type"
        expanded={expandedFilters.type}
        onToggle={() => toggleFilter("type")}
      >
        {TYPE_OPTIONS.map((opt) => {
          const isSelected = filters.type === opt.value;
          const count = opt.value === "todos" ? exercises.length : countByType(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => setFilters({ ...filters, type: opt.value })}
              className={cn(
                "w-full flex items-center justify-between px-3 py-1.5 rounded border text-left text-xs transition-colors",
                isSelected
                  ? "bg-cyan-400/10 text-cyan-400 border-cyan-400/20"
                  : "text-slate-400 hover:bg-white/[0.03] hover:text-slate-200 border-transparent",
              )}
            >
              <span>{opt.label}</span>
              <span className="text-slate-600">{count}</span>
            </button>
          );
        })}
      </FilterAccordion>

      <FilterAccordion
        title="Tags"
        expanded={expandedFilters.tags}
        onToggle={() => toggleFilter("tags")}
      >
        <div className="space-y-1.5">
          {TAG_OPTIONS.map((tag) => {
            const isSelected = filters.tags.includes(tag);
            const count = countByTag(tag);
            return (
              <button
                key={tag}
                onClick={() => {
                  const tags = filters.tags.includes(tag)
                    ? filters.tags.filter((t) => t !== tag)
                    : [...filters.tags, tag];
                  setFilters({ ...filters, tags });
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-1.5 rounded border text-left text-xs transition-colors",
                  isSelected
                    ? "bg-cyan-400/10 text-cyan-400 border-cyan-400/20"
                    : "text-slate-400 hover:bg-white/[0.03] hover:text-slate-200 border-transparent",
                )}
              >
                <div className="flex items-center gap-2">
                  <span>#{tag}</span>
                </div>
                <span className="text-slate-600">{count}</span>
              </button>
            );
          })}
        </div>
      </FilterAccordion>
    </div>
  );
}

interface FilterAccordionProps {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function FilterAccordion({ title, expanded, onToggle, children }: FilterAccordionProps) {
  return (
    <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-white/[0.03]"
      >
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        <ChevronRight
          className={cn("h-3 w-3 text-slate-500 transition-transform", expanded && "rotate-90")}
        />
      </button>
      {expanded && (
        <div className="border-t border-white/[0.03] px-4 pb-3">
          {children}
        </div>
      )}
    </div>
  );
}
