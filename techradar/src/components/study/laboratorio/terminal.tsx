"use client";

import { useEffect, useRef, useCallback } from "react";
import {
  ChevronRight,
  Copy,
  Maximize,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TerminalState, TerminalLine } from "@/lib/study/types";

const COMMAND_COLORS: Record<string, string> = {
  input: "text-cyan-400",
  output: "text-slate-300",
  error: "text-rose-400",
  success: "text-emerald-400",
};

interface LabTerminalProps {
  terminal: TerminalState;
  onExecute: (command: string) => void;
  onInputChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  isFocused: boolean;
}

export function LabTerminal({ terminal, onExecute, onInputChange, onKeyDown, isFocused }: LabTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll para o final
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminal.lines]);

  // Foco no input
  useEffect(() => {
    if (isFocused && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isFocused]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const command = terminal.currentInput.trim();
    if (command) {
      onExecute(command);
    }
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col bg-[#080d15]">
      {/* Linhas do terminal */}
      <div
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-xs"
      >
        {terminal.lines.map((line) => (
          <div
            key={line.id}
            className={cn(
              "flex items-start gap-2 mb-1 break-words",
              line.type === "input" && "text-cyan-400",
              line.type === "error" && "text-rose-400",
              line.type === "success" && "text-emerald-400",
              line.type === "output" && "text-slate-300",
            )}
          >
            <span className="text-slate-600 select-none">{line.type === "input" ? ">" : " "}</span>
            <div className="flex-1">{line.text}</div>
          </div>
        ))}
        {/* Cursor piscando */}
        <div className="flex items-start gap-2">
          <span className="text-cyan-400 animate-pulse">▍</span>
        </div>
      </div>

      {/* Input do terminal */}
      <form onSubmit={handleSubmit} className="border-t border-white/[0.06] bg-[#0f172a] px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-mono text-xs">{">"}</span>
          <input
            ref={inputRef}
            type="text"
            value={terminal.currentInput}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={onKeyDown}
            className="flex-1 bg-transparent border-none text-slate-200 text-xs font-mono focus:ring-0 placeholder-slate-500"
            placeholder=""
          />
        </div>
      </form>
    </div>
  );
}
