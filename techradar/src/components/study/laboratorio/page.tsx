"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  BookOpen,
  Plus,
  MoreHorizontal,
  Settings,
  Search,
  FileText,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Terminal,
  Play,
  StopCircle,
  RefreshCw,
  Copy,
  Maximize,
  X,
  Layout,
  GitBranch,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  Activity,
  Code,
  Cloud,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStudy } from "@/lib/study/context";
import type { LabFile, LabProject, OpenTab } from "@/lib/study/types";
import { LabExplorer } from "./explorer";
import { LabEditor } from "./editor";
import { LabTerminal } from "./terminal";
import { LabRightPanel } from "./right-panel";

export default function LaboratorioPage() {
  const {
    labProjects,
    activeProjectId,
    setActiveProject,
    openTabs,
    activeFileId,
    setActiveFile,
    addOpenTab,
    removeOpenTab,
    setActiveTab,
    updateLabFile,
    getActiveProject,
    getActiveFile,
    getOpenTabs,
    terminal,
    terminalInput,
    terminalExecute,
    getExerciseMetrics,
    categoryProgress,
    pendingReviewsCount,
    startTimer,
    stopTimer,
  } = useStudy();

  const [activeTabView, setActiveTabView] = useState("meus-projetos");
  const [terminalInputValue, setTerminalInputValue] = useState("");
  const [isTerminalFocused, setIsTerminalFocused] = useState(false);

  const activeProject = getActiveProject();
  const activeFile = getActiveFile();
  const tabs = getOpenTabs();

  const handleTabClick = (view: string) => {
    setActiveTabView(view);
  };

  const handleFileClick = (file: LabFile) => {
    // Se já está aberta, apenas ativar
    const existingTab = tabs.find((t) => t.fileId === file.id);
    if (existingTab) {
      setActiveFile(file.id);
      setActiveTab(file.id);
    } else {
      addOpenTab({
        fileId: file.id,
        fileName: file.name,
        language: file.language,
        isActive: true,
      });
      setActiveFile(file.id);
    }
  };

  const handleCloseTab = (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeOpenTab(fileId);
    if (activeFileId === fileId) {
      const remaining = tabs.filter((t) => t.fileId !== fileId);
      if (remaining.length > 0) {
        setActiveFile(remaining[0].fileId);
        setActiveTab(remaining[0].fileId);
      } else {
        setActiveFile(null);
      }
    }
  };

  const handleEditorChange = useCallback(
    (content: string) => {
      if (activeFile) {
        updateLabFile(activeFile.id, content);
      }
    },
    [activeFile, updateLabFile]
  );

  const handleTerminalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      terminalExecute(terminalInputValue);
      setTerminalInputValue("");
    }
  };

  const handleTerminalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTerminalInputValue(e.target.value);
    terminalInput(e.target.value);
  };

  const handleRunCode = () => {
    if (activeFile) {
      terminalExecute("npm start");
    }
  };

  const handleStopCode = () => {
    terminalExecute("stop");
  };

  const totalLabProgress = useMemo(() => {
    if (labProjects.length === 0) return 0;
    return Math.round(
      labProjects.reduce((acc, p) => acc + p.progress, 0) / labProjects.length
    );
  }, [labProjects]);

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-300 overflow-hidden">
      {/* ============ HEADER ============ */}
      <header className="h-16 shrink-0 border-b border-white/[0.06] bg-[#0f172a]/80 backdrop-blur px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Code className="h-5 w-5 text-cyan-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Ambiente de Laboratório
            </h1>
          </Link>
          <p className="text-sm text-slate-400">
            Desenvolva, teste e implante seus projetos em um ambiente isolado
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Pesquisa Rápida em Notas"
            className="w-64 h-9 pl-9 pr-3 rounded-lg border border-white/[0.06] bg-white/[0.02] text-xs text-slate-200 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400 transition-colors placeholder-slate-500"
          />
        </div>
      </header>

      {/* ============ CONTEÚDO PRINCIPAL ============ */}
      <main className="flex-1 flex overflow-hidden">
        {/* Abas de navegação superior */}
        <div className="h-10 shrink-0 border-b border-white/[0.06] bg-[#0f172a]/80 backdrop-blur px-6 flex items-center gap-1 overflow-x-auto">
          {[
            { id: "meus-projetos", label: "Meus Projetos" },
            { id: "tutoriais", label: "Tutoriais Guiados" },
            { id: "sandbox", label: "Ambientes Sandbox" },
            { id: "comunidade", label: "Projetos da Comunidade" },
            { id: "code-review", label: "Code Review" },
          ].map((item) => {
            const active = activeTabView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={cn(
                  "px-4 py-2 text-xs font-medium transition-all border-b-2",
                  active
                    ? "text-cyan-400 border-cyan-400 bg-white/[0.03]"
                    : "text-slate-400 border-transparent hover:text-slate-200 hover:bg-white/[0.02]",
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 min-w-0 flex">
          {/* ============ PAINEL ESQUERDO: EXPLORER ============ */}
          <LabExplorer
            project={activeProject}
            onFileClick={handleFileClick}
            onCreateFile={() => {}}
          />

          {/* ============ PAINEL CENTRAL: EDITOR + TERMINAL ============ */}
          <div className="flex-1 min-w-0 flex flex-col border-l border-white/[0.06] border-r border-white/[0.06]">
            {/* Abas do editor */}
            <div className="h-9 shrink-0 border-b border-white/[0.06] bg-[#0f172a]/60 flex items-center px-4 overflow-x-auto">
              {tabs.map((tab) => (
                <div
                  key={tab.fileId}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-t-lg border-b-2 transition-colors cursor-pointer",
                    tab.isActive
                      ? "bg-white/[0.05] border-cyan-400/50 text-white border-b-cyan-400"
                      : "text-slate-400 hover:bg-white/[0.02] hover:text-white border-transparent",
                  )}
                  onClick={() => {
                    setActiveFile(tab.fileId);
                    setActiveTab(tab.fileId);
                  }}
                >
                  <FileText className="h-3 w-3" />
                  <span className="text-xs truncate max-w-[120px]">{tab.fileName}</span>
                  <button
                    onClick={(e) => handleCloseTab(tab.fileId, e)}
                    className="ml-1 h-5 w-5 rounded hover:bg-white/[0.1] hover:text-white text-slate-500"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
              <div className="flex-1" />
            </div>

            {/* Área do editor */}
            <div className="flex-1 min-w-0 flex flex-col">
              <LabEditor
                file={activeFile}
                onChange={handleEditorChange}
                isActive={!!activeFile}
              />
            </div>

            {/* Terminal integrado */}
            <div className="h-[35%] min-h-[200px] border-t border-white/[0.06] bg-[#080d15] flex flex-col">
              <div className="h-8 shrink-0 border-b border-white/[0.06] bg-[#0f172a]/80 flex items-center justify-between px-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                    <div className="h-2 w-2 rounded-full bg-yellow-500" />
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                  </div>
                  <span className="text-xs text-slate-400 font-mono">zsh</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="p-1 text-slate-400 hover:text-white hover:bg-white/[0.05] rounded"
                    title="Dividir terminal"
                  >
                    <Layout className="h-3 w-3" />
                  </button>
                  <button
                    className="p-1 text-slate-400 hover:text-white hover:bg-white/[0.05] rounded"
                    title="Novo terminal"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                  <button
                    className="p-1 text-slate-400 hover:text-white hover:bg-white/[0.05] rounded"
                    title="Lixeira"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <LabTerminal
                terminal={terminal}
                onExecute={terminalExecute}
                onInputChange={terminalInput}
                onKeyDown={handleTerminalKeyDown}
                isFocused={isTerminalFocused}
              />
            </div>
          </div>

          {/* ============ PAINEL DIREITO: PROJETOS E ATIVIDADES ============ */}
          <LabRightPanel
            projects={labProjects}
            activeProjectId={activeProjectId}
            setActiveProject={setActiveProject}
            totalProgress={totalLabProgress}
            metrics={getExerciseMetrics()}
            categoryProgress={categoryProgress}
            pendingReviewsCount={pendingReviewsCount}
          />
        </div>
      </main>
    </div>
  );
}
