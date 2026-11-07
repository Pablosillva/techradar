"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Play,
  StopCircle,
  Copy,
  Maximize,
  X,
  RefreshCw,
  AlertCircle,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LabFile } from "@/lib/study/types";

interface LabEditorProps {
  file: LabFile | null | undefined;
  onChange: (content: string) => void;
  isActive: boolean;
}

const LANGUAGE_CONFIG: Record<string, { name: string; color: string }> = {
  javascript: { name: "JavaScript", color: "#f7df1e" },
  jsx: { name: "JavaScript React", color: "#61dafb" },
  ts: { name: "TypeScript", color: "#3178c6" },
  tsx: { name: "TypeScript React", color: "#3178c6" },
  css: { name: "CSS", color: "#ff4781" },
  json: { name: "JSON", color: "#29213c" },
  html: { name: "HTML", color: "#e34c26" },
};

// Simples syntax highlighting para JS/JSX/CSS/JSON
function highlightCode(code: string, language: string): React.ReactNode {
  if (language === "css") {
    return (
      <pre className="text-sm font-mono leading-relaxed overflow-x-auto">
        {code.split("\n").map((line, i) => {
          const highlighted = line
            .replace(/\.([\w-]+)/g, '<span className="text-purple-400">.$1</span>')
            .replace(/\{[^}]*\}/g, '<span className="text-emerald-400">$&</span>')
            .replace(/:\s*([^;]+)/g, ': <span className="text-cyan-400">$1</span>');
          return (
            <div key={i} className="flex items-start">
              <span className="w-4 text-slate-500 select-none">{i + 1}</span>
              <div
                className="pl-1"
                dangerouslySetInnerHTML={{ __html: highlighted }}
              />
            </div>
          );
        })}
      </pre>
      );
  }

  if (language === "json") {
    return (
      <pre className="text-sm font-mono leading-relaxed overflow-x-auto">
        {code.split("\n").map((line, i) => {
          const highlighted = line
            .replace(/"([^"]+)":/g, '<span className="text-purple-400">"$1"</span>:')
            .replace(/: "([^"]+)"/g, ': <span className="text-cyan-400">"$1"</span>')
            .replace(/:\s*(\d+)/g, ': <span className="text-emerald-400">$1</span>');
          return (
            <div key={i} className="flex items-start">
              <span className="w-4 text-slate-500 select-none">{i + 1}</span>
              <div
                className="pl-1"
                dangerouslySetInnerHTML={{ __html: highlighted }}
              />
            </div>
          );
        })}
      </pre>
    );
  }

  // JavaScript/JSX/TS/TSX
  return (
    <pre className="text-sm font-mono leading-relaxed overflow-x-auto">
      {code.split("\n").map((line, i) => {
        const highlighted = line
          .replace(/\b(import|export|from|const|let|var|function|return|if|else|async|await|try|catch)\b/g, '<span className="text-purple-400">$1</span>')
          .replace(/\b(React|Component|useState|useEffect|useRef|useCallback|useMemo|forwardRef)\b/g, '<span className="text-blue-400">$1</span>')
          .replace(/\b(true|false|null|undefined)\b/g, '<span className="text-emerald-400">$1</span>')
          .replace(/"([^"]*)"/g, '<span className="text-cyan-400">"$1"</span>')
          .replace(/\/[\s\S]*?\/\/|(\/\/[^\n]*)/g, '<span className="text-slate-500 italic">$1</span>')
          .replace(/<(\/)?([\w-]+)/g, '<span className="text-rose-400"><$1$2</span>');
        return (
          <div key={i} className="flex items-start">
            <span className="w-4 text-slate-500 select-none">{i + 1}</span>
            <div
              className="pl-1"
              dangerouslySetInnerHTML={{ __html: highlighted }}
            />
          </div>
        );
      })}
    </pre>
    );
}

export function LabEditor({ file, onChange, isActive }: LabEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState(file?.content ?? "");
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (file) {
      setContent(file.content);
    }
  }, [file?.id, file?.content]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    onChange(e.target.value);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
  };

  const langInfo = LANGUAGE_CONFIG[file?.language ?? "javascript"];

  return (
    <div className={cn("flex-1 min-w-0 flex flex-col", isMaximized ? "fixed inset-0 z-50 bg-[#080d15]" : "")}>
      {/* Toolbar do editor */}
      <div className="border-b border-white/[0.06] bg-[#0f172a]/80 backdrop-blur px-4 py-2.5 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-white/[0.05] flex items-center justify-center border border-white/[0.05]">
              {file ? (
                <span className="text-xs font-bold">{file.name.split(".").pop()?.toUpperCase()}</span>
              ) : (
                <span className="text-xs text-slate-500">—</span>
              )}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white truncate max-w-[200px]">
                {file?.name ?? "Sem arquivo"}
              </h4>
              <p className="text-[10px] text-slate-500">
                {langInfo?.name ?? "Texto simples"} • {content.split(/\s+/).filter(Boolean).length} palavras
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.05] rounded transition-colors"
            title="Copiar código"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsMaximized((p) => !p)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.05] rounded transition-colors"
            title={isMaximized ? "Sair da tela cheia" : "Tela cheia"}
          >
            <Maximize className="h-4 w-4" />
          </button>
          <button
            className="px-3 py-1.5 bg-cyan-400 text-slate-950 rounded-lg text-sm font-semibold hover:bg-cyan-300 transition-colors shadow-[0_0_15px_rgba(34,211,238,0.4)]"
            onClick={() => {}}
          >
            <Play className="h-3.5 w-3.5 mr-1.5" /> Executar
          </button>
        </div>
      </div>

      {/* Área de edição */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <div
          ref={editorRef}
          className="h-full w-full overflow-auto p-6 bg-[#080d15]"
        >
          {isActive && file ? (
            highlightCode(content, file.language)
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-slate-500">
              <FileText className="h-12 w-12 opacity-30 mb-2" />
              <p className="text-sm">Selecione um arquivo para editar</p>
            </div>
          )}
        </div>
      </div>

      {/* Barra de status do editor */}
      <div className="border-t border-white/[0.06] bg-[#0f172a]/80 backdrop-blur px-4 py-1.5 flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-3 text-slate-400">
          <span>{file?.language ?? "text"}</span>
          <span>UTF-8</span>
          <span>LF</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Linha 1, Col 1</span>
          <button
            className="p-1 text-slate-400 hover:text-white rounded"
            title="Indicação de problemas"
          >
            <AlertCircle className="h-3 w-3 text-amber-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
