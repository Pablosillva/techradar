"use client";

import { useState } from "react";
import {
  FileText,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  FileCode,
  FileType,
  Layout,
  Plus,
  Trash2,
  GitBranch,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LabFile, LabProject } from "@/lib/study/types";

interface LabExplorerProps {
  project: LabProject | undefined;
  onFileClick: (file: LabFile) => void;
  onCreateFile: () => void;
}

export function LabExplorer({ project, onFileClick, onCreateFile }: LabExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(["src", "src/components"])
  );

  const handleToggleFolder = (folderPath: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderPath)) next.delete(folderPath);
      else next.add(folderPath);
      return next;
    });
  };

  const getFileIcon = (language: LabFile["language"]) => {
    switch (language) {
      case "javascript":
      case "jsx":
        return <FileCode className="h-4 w-4 text-yellow-400" />;
      case "ts":
      case "tsx":
        return <FileCode className="h-4 w-4 text-blue-400" />;
      case "css":
        return <FileType className="h-4 w-4 text-blue-500" />;
      case "json":
        return <FileText className="h-4 w-4 text-orange-400" />;
      case "html":
        return <FileText className="h-4 w-4 text-orange-300" />;
      default:
        return <FileText className="h-4 w-4 text-slate-400" />;
    }
  };

  const renderFolder = (path: string, label: string, children: React.ReactNode[]) => {
    const isExpanded = expandedFolders.has(path);
    const hasChildren = children.length > 0;
    return (
      <div key={path} className="mb-1">
        <div
          onClick={() => handleToggleFolder(path)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-white/[0.03] transition-colors"
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleFolder(path);
              }}
              className="p-1 text-slate-400 hover:text-white"
            >
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
          ) : (
            <div className="h-3.5 w-3.5" />
          )}
          <div className="flex-1 flex items-center gap-2">
            <Folder className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs font-medium text-slate-200 truncate">{label}</span>
          </div>
        </div>
        {isExpanded && hasChildren && (
          <div className="ml-4 border-l border-white/[0.05] py-1">{children}</div>
        )}
      </div>
    );
  };

  if (!project) {
    return (
      <div className="flex flex-col h-full p-4">
        <div className="flex items-center justify-between px-2 py-2 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Layout className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Explorer</h3>
          </div>
          <button
            onClick={onCreateFile}
            className="p-1 text-slate-400 hover:text-white hover:bg-white/[0.05] rounded"
            title="Novo arquivo"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center py-10">
          <div className="text-center">
            <FileText className="h-12 w-12 opacity-20 mb-2" />
            <p className="text-sm text-slate-500">Nenhum projeto selecionado</p>
          </div>
        </div>
      </div>
    );
  }

  // Construir árvore de arquivos simples a partir dos arquivos do projeto
  const rootFiles = project.files.filter((f) => !f.path.includes("/"));
  const srcFiles = project.files.filter((f) => f.path.startsWith("src/") && !f.path.includes("src/"));
  const srcComponentsFiles = project.files.filter((f) => f.path.startsWith("src/components/"));

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-2 py-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Layout className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">EXPLORER</h3>
        </div>
        <button
          onClick={onCreateFile}
          className="p-1 text-slate-400 hover:text-white hover:bg-white/[0.05] rounded"
          title="Novo arquivo"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {/* E-Commerce Full-Stack root */}
        <div className="mb-2">
          <div
            onClick={() => handleToggleFolder("root")}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-white/[0.03] transition-colors"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleFolder("root");
              }}
              className="p-1 text-slate-400 hover:text-white"
            >
              {expandedFolders.has("root") ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
            <div className="flex-1 flex items-center gap-2">
              <div className="h-3.5 w-3.5 rounded bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center">
                <GitBranch className="h-2 w-2 text-slate-950" />
              </div>
              <span className="text-xs font-medium text-slate-200">{project.title}</span>
            </div>
          </div>
          {expandedFolders.has("root") && (
            <div className="ml-4 border-l border-white/[0.05] py-1">
              {/* src folder */}
              <div className="mb-1">
                <div
                  onClick={() => handleToggleFolder("src")}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-white/[0.03] transition-colors"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFolder("src");
                    }}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    {expandedFolders.has("src") ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <div className="flex-1 flex items-center gap-2">
                    <Folder className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs font-medium text-slate-200">src</span>
                  </div>
                </div>
                {expandedFolders.has("src") && (
                  <div className="ml-4 border-l border-white/[0.05] py-1">
                    {rootFiles.map((file) => (
                      <div
                        key={file.id}
                        onClick={() => onFileClick(file)}
                        className={cn(
                          "flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-colors",
                          file.isActive
                            ? "bg-cyan-400/10 border-r-2 border-cyan-400"
                            : "hover:bg-white/[0.02]",
                        )}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {getFileIcon(file.language)}
                          <span className="text-xs font-medium text-slate-200 truncate">{file.name}</span>
                        </div>
                      </div>
                    ))}
                    {srcComponentsFiles.length > 0 && (
                      <div className="mb-1">
                        <div
                          onClick={() => handleToggleFolder("src/components")}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-white/[0.03] transition-colors"
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFolder("src/components");
                            }}
                            className="p-1 text-slate-400 hover:text-white"
                          >
                            {expandedFolders.has("src/components") ? (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <div className="flex-1 flex items-center gap-2">
                            <Folder className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-xs font-medium text-slate-200">components</span>
                          </div>
                        </div>
                        {expandedFolders.has("src/components") && (
                          <div className="ml-4 border-l border-white/[0.05] py-1">
                            {srcComponentsFiles.map((file) => (
                              <div
                                key={file.id}
                                onClick={() => onFileClick(file)}
                                className={cn(
                                  "flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-colors",
                                  file.isActive
                                    ? "bg-cyan-400/10 border-r-2 border-cyan-400"
                                    : "hover:bg-white/[0.02]",
                                )}
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  {getFileIcon(file.language)}
                                  <span className="text-xs font-medium text-slate-200 truncate">{file.name}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {project.files.filter((f) => f.path === "package.json").map((file) => (
                      <div
                        key={file.id}
                        onClick={() => onFileClick(file)}
                        className={cn(
                          "flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-colors",
                          file.isActive
                            ? "bg-cyan-400/10 border-r-2 border-cyan-400"
                            : "hover:bg-white/[0.02]",
                        )}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {getFileIcon(file.language)}
                          <span className="text-xs font-medium text-slate-200 truncate">{file.name}</span>
                        </div>
                      </div>
                    ))}
                    {project.files.filter((f) => f.path === "README.md").map((file) => (
                      <div
                        key={file.id}
                        onClick={() => onFileClick(file)}
                        className={cn(
                          "flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-colors",
                          file.isActive
                            ? "bg-cyan-400/10 border-r-2 border-cyan-400"
                            : "hover:bg-white/[0.02]",
                        )}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {getFileIcon(file.language)}
                          <span className="text-xs font-medium text-slate-200 truncate">{file.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* OUTLINE / TIMELINE / PROBLEMS footer */}
        <div className="border-t border-white/[0.06] bg-[#080d15]/50 p-2">
          <div className="flex gap-4 text-[10px] uppercase tracking-wider text-slate-500 mb-2">
            <span className="text-cyan-400">OUTLINE</span>
            <span className="text-slate-500">TIMELINE</span>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">main</span>
              <GitBranch className="h-3 w-3 text-cyan-400" />
            </div>
            <div className="flex items-center gap-1 text-[10px]">
              <AlertCircle className="h-3 w-3 text-amber-400" />
              <span className="text-amber-400">1 aviso</span>
            </div>
            <div className="flex items-center gap-1 text-[10px]">
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              <span className="text-emerald-400">0 erros</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
