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
  MessageSquare,
  Code,
  Link as LinkIcon,
  Image,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Pin,
  Trash2,
  Edit,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStudy } from "@/lib/study/context";
import type { NotebookFolder, NotebookNote } from "@/lib/study/types";
import { CadernoEditor } from "./editor";

export default function CadernoPage() {
  const {
    notebooks,
    notebookFolders,
    createFolder,
    deleteFolder,
    updateFolder,
    createNote,
    updateNote,
    deleteNote,
    moveNote,
    addTagToNote,
    removeTagFromNote,
    getNotesByFolder,
    getFolderById,
    getFoldersByParent,
    startTimer,
    stopTimer,
  } = useStudy();

  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(
    notebooks.length > 0 ? notebooks[0].id : null
  );
  const [newFolderTitle, setNewFolderTitle] = useState("");
  const [creatingFolder, setCreatingFolder] = useState<{ parentId: string | null } | null>(null);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderTitle, setEditingFolderTitle] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(["folder-root", "folder-web"])
  );
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [creatingNote, setCreatingNote] = useState<{ parentFolderId: string | null } | null>(null);

  const selectedNote = useMemo(
    () => notebooks.find((n) => n.id === selectedNoteId) ?? null,
    [notebooks, selectedNoteId]
  );

  const rootFolders = getFoldersByParent(null);

  const handleToggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  const handleCreateFolder = useCallback(
    (parentId: string | null) => {
      setCreatingFolder({ parentId });
      setNewFolderTitle("");
    },
    []
  );

  const handleSaveFolder = () => {
    if (!newFolderTitle.trim()) return;
    createFolder(newFolderTitle.trim(), creatingFolder?.parentId ?? null);
    setCreatingFolder(null);
    setNewFolderTitle("");
  };

  const handleDeleteFolder = (folderId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta pasta? As notas serão movidas para a raiz.")) return;
    deleteFolder(folderId);
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      next.delete(folderId);
      return next;
    });
  };

  const handleEditFolder = (folderId: string, currentTitle: string) => {
    setEditingFolderId(folderId);
    setEditingFolderTitle(currentTitle);
  };

  const handleSaveEditFolder = () => {
    if (!editingFolderTitle.trim()) {
      setEditingFolderId(null);
      return;
    }
    updateFolder(editingFolderId!, editingFolderTitle.trim());
    setEditingFolderId(null);
  };

  const handleCreateNote = (parentFolderId: string | null) => {
    setCreatingNote({ parentFolderId });
    setNewNoteTitle("");
  };

  const handleSaveNote = () => {
    if (!newNoteTitle.trim()) return;
    createNote(
      newNoteTitle.trim(),
      "<p>Comece a escrever sua anotação aqui...</p>",
      creatingNote?.parentFolderId ?? null,
      []
    );
    setCreatingNote(null);
    setNewNoteTitle("");
  };

  const handleDeleteNote = (noteId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta nota?")) return;
    deleteNote(noteId);
    if (selectedNoteId === noteId) setSelectedNoteId(null);
  };

  const handleSelectNote = (noteId: string) => {
    setSelectedNoteId(noteId);
    startTimer("caderno");
  };

  const handleUpdateNote = (title: string, content: string, tags: string[]) => {
    if (selectedNote) {
      updateNote(selectedNote.id, title, content, tags);
    }
  };

  const handleDeleteSelectedNote = () => {
    if (selectedNote) {
      handleDeleteNote(selectedNote.id);
    }
  };

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-300 overflow-hidden">
      {/* ============ HEADER ============ */}
      <header className="h-16 shrink-0 border-b border-white/[0.06] bg-[#0f172a]/80 backdrop-blur px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-cyan-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Caderno</h1>
          </Link>
          <p className="text-sm text-slate-400">
            DevPath Hub - Your Personal Learning Hub: Organize all your studies and notes
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded-lg text-slate-400 hover:bg-white/[0.04] hover:text-white transition-colors"
            title="Configurações"
          >
            <Settings className="h-5 w-5" />
          </button>
          <button
            className="p-2 rounded-lg text-slate-400 hover:bg-white/[0.04] hover:text-white transition-colors"
            title="Opções"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleCreateNote(null)}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-400 text-slate-950 rounded-lg text-sm font-semibold hover:bg-cyan-300 transition-colors shadow-[0_0_15px_rgba(34,211,238,0.4)]"
          >
            <Plus className="h-4 w-4" /> Nova Nota
          </button>
        </div>
      </header>

      {/* ============ CONTEÚDO PRINCIPAL ============ */}
      <main className="flex-1 flex overflow-hidden">
        {/* ============ PAINEL ESQUERDO: ÁRVORE DE ARQUIVOS ============ */}
        <aside className="w-80 shrink-0 border-r border-white/[0.06] bg-[#0f172a]/80 backdrop-blur flex flex-col z-10">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Folder className="h-4 w-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">Notebook</h3>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleCreateFolder(null)}
                className="p-1.5 rounded text-slate-400 hover:bg-white/[0.04] hover:text-white transition-colors"
                title="Nova pasta"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
              <button
                className="p-1.5 rounded text-slate-400 hover:bg-white/[0.04] hover:text-white transition-colors"
                title="Opções"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {rootFolders.map((folder) => (
              <NotebookFolderItem
                key={folder.id}
                folder={folder}
                isExpanded={expandedFolders.has(folder.id)}
                onToggle={handleToggleFolder}
                onCreateNote={(parentFolderId) => handleCreateNote(parentFolderId)}
                onCreateFolder={handleCreateFolder}
                onDelete={handleDeleteFolder}
                onEdit={handleEditFolder}
                notes={getNotesByFolder(folder.id)}
                onSelectNote={handleSelectNote}
                onDeleteNote={handleDeleteNote}
                selectedNoteId={selectedNoteId}
                creatingNoteParent={creatingNote?.parentFolderId ?? null}
                isCreatingNote={creatingNote?.parentFolderId === folder.id ? creatingNote : null}
                onSaveNote={handleSaveNote}
                onCancelCreatingNote={() => {
                  setCreatingNote(null);
                  setNewNoteTitle("");
                }}
                newNoteTitle={newNoteTitle}
                setNewNoteTitle={setNewNoteTitle}
              />
            ))}

            {creatingFolder?.parentId === null && (
              <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.02] rounded-lg border border-white/[0.05]">
                <input
                  value={newFolderTitle}
                  onChange={(e) => setNewFolderTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveFolder();
                    if (e.key === "Escape") setCreatingFolder(null);
                  }}
                  placeholder="Nome da pasta..."
                  className="flex-1 bg-transparent text-sm text-slate-200 border-none focus:ring-0 placeholder-slate-500"
                />
                <button
                  onClick={handleSaveFolder}
                  className="p-1.5 text-cyan-400 hover:bg-cyan-400/10 rounded"
                  disabled={!newFolderTitle.trim()}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setCreatingFolder(null)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 rounded"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* ============ PAINEL CENTRAL: EDITOR ============ */}
        <div className="flex-1 min-w-0 flex flex-col border-l border-white/[0.06] border-r border-white/[0.06]">
          {/* Header da nota */}
          <div className="h-16 shrink-0 border-b border-white/[0.06] bg-[#0f172a]/80 backdrop-blur px-6 flex items-center justify-between">
            {selectedNote ? (
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-white/[0.05] flex items-center justify-center border border-white/[0.05]">
                  <FileText className="h-5 w-5 text-cyan-400" />
                </div>
                <div className="flex flex-col">
                  <h3
                    className="text-base font-semibold text-white truncate max-w-[300px]"
                    onDoubleClick={() => {}}
                  >
                    {selectedNote.title}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Atualizado {new Date(selectedNote.updatedAt).toLocaleDateString("pt-BR")}
                    </span>
                    {selectedNote.tags.length > 0 && (
                      <span className="h-6 px-2 rounded-full bg-white/[0.05] border border-white/[0.1] text-[10px] text-cyan-300">
                        #{selectedNote.tags[0]}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  className="p-2 rounded text-slate-400 hover:bg-white/[0.04] hover:text-white transition-colors"
                  title="Opções da nota"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <FileText className="h-10 w-10 opacity-50" />
                <p className="mt-2 text-sm">Selecione uma nota para começar</p>
              </div>
            )}
            <div className="flex items-center gap-2">
              {selectedNote && (
                <>
                  <button
                    onClick={handleDeleteSelectedNote}
                    className="p-2 rounded text-rose-400 hover:bg-rose-400/10 hover:text-rose-300 transition-colors"
                    title="Excluir nota"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button
                    className="p-2 rounded text-slate-400 hover:bg-white/[0.04] hover:text-white transition-colors"
                    title="Editar"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Área do editor */}
          <div className="flex-1 overflow-hidden">
            {selectedNote ? (
              <CadernoEditor
                note={selectedNote}
                onUpdate={handleUpdateNote}
                onTagAdd={(tag) => addTagToNote(selectedNote.id, tag)}
                onTagRemove={(tag) => removeTagFromNote(selectedNote.id, tag)}
              />
            ) : null}
          </div>
        </div>

        {/* ============ PAINEL DIREITO: PESQUISA E TAGS ============ */}
        <aside className="w-80 shrink-0 border-l border-white/[0.06] bg-[#0f172a]/80 backdrop-blur flex flex-col z-10">
          <div className="p-4 border-b border-white/[0.06]">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Pesquisa Rápida em Notas"
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-white/[0.06] bg-white/[0.02] text-xs text-slate-200 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400 transition-colors placeholder-slate-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Filtros e Tags */}
            <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Filtros e Tags</h3>
              <div className="space-y-2">
                {["Web Fundamentals", "React & State", "Códigos Salvos", "Node.js"].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {}}
                    className="flex items-center justify-between w-full px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.03] text-left text-xs text-slate-300 hover:bg-white/[0.05] hover:border-white/[0.1] hover:text-white transition-colors"
                  >
                    <span>{tag}</span>
                    <ChevronRight className="h-3 w-3 text-slate-500" />
                  </button>
                ))}
              </div>
            </div>

            {/* Recentes */}
            <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Recentes</h3>
              <div className="space-y-2">
                {notebooks
                  .slice()
                  .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
                  .slice(0, 5)
                  .map((note) => (
                    <div
                      key={note.id}
                      onClick={() => handleSelectNote(note.id)}
                      className={cn(
                        "flex items-center gap-3 p-2.5 rounded-lg border transition-colors cursor-pointer hover:bg-white/[0.03] hover:border-white/[0.1]",
                        selectedNoteId === note.id
                          ? "bg-cyan-400/10 border-cyan-400/20"
                          : "border-transparent",
                      )}
                    >
                      <div className="h-7 w-7 rounded bg-white/[0.05] flex items-center justify-center flex-shrink-0">
                        <FileText className="h-3.5 w-3.5 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">{note.title}</p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {note.tags.join(", ") || "Sem tags"}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

function NotebookFolderItem({
  folder,
  isExpanded,
  onToggle,
  onCreateNote,
  onCreateFolder,
  onDelete,
  onEdit,
  notes,
  onSelectNote,
  onDeleteNote,
  selectedNoteId,
  creatingNoteParent,
  isCreatingNote,
  onSaveNote,
  onCancelCreatingNote,
  newNoteTitle,
  setNewNoteTitle,
}: {
  folder: NotebookFolder;
  isExpanded: boolean;
  onToggle: (folderId: string) => void;
  onCreateNote: (parentFolderId: string | null) => void;
  onCreateFolder: (parentId: string | null) => void;
  onDelete: (folderId: string) => void;
  onEdit: (folderId: string, currentTitle: string) => void;
  notes: NotebookNote[];
  onSelectNote: (noteId: string) => void;
  onDeleteNote: (noteId: string) => void;
  selectedNoteId: string | null;
  creatingNoteParent: string | null;
  isCreatingNote: { parentFolderId: string | null } | null;
  onSaveNote: () => void;
  onCancelCreatingNote: () => void;
  newNoteTitle: string;
  setNewNoteTitle: (title: string) => void;
}) {
  const childFolders: NotebookFolder[] = []; // Simplificado - em produção buscaria do context
  const hasChildren = folder.id === "folder-root" || folder.id === "folder-web";

  return (
    <div className="mb-2">
      <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-white/[0.03]">
        {hasChildren ? (
          <button
            onClick={() => onToggle(folder.id)}
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
          {folder.id === "folder-root" ? (
            <div className="flex items-center gap-1">
              <FolderOpen className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-xs font-medium text-slate-200">{folder.title}</span>
            </div>
          ) : (
            <>
              <Folder className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs font-medium text-slate-200 truncate">{folder.title}</span>
            </>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(folder.id, folder.title);
            }}
            className="p-1 text-slate-500 hover:text-white opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal className="h-3 w-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(folder.id);
            }}
            className="p-1 text-rose-500/60 hover:text-rose-400 opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCreateFolder(folder.id);
          }}
          className="p-1 text-slate-500 hover:text-cyan-400"
          title="Nova pasta"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      {isExpanded && (
        <div className="ml-6 border-l border-white/[0.05] py-2">
          {/* Subpastas (simplificado) */}
          {childFolders.map((child) => (
            <div key={child.id} className="ml-2">
              <div className="flex items-center gap-2 px-1 py-1 rounded-lg cursor-pointer hover:bg-white/[0.02]">
                <Folder className="h-3 w-3 text-slate-400" />
                <span className="text-xs text-slate-300 truncate">{child.title}</span>
              </div>
            </div>
          ))}

          {/* Notas da pasta */}
          {notes.map((note) => (
            <div
              key={note.id}
              onClick={() => onSelectNote(note.id)}
              className={cn(
                "flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-colors",
                selectedNoteId === note.id
                  ? "bg-cyan-400/10 border-r-2 border-cyan-400"
                  : "hover:bg-white/[0.02]",
              )}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <FileText className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-200 truncate">{note.title}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteNote(note.id);
                }}
                className="p-1 text-rose-500/60 hover:text-rose-400 opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}

          {isCreatingNote?.parentFolderId === folder.id && (
            <div className="flex items-center gap-2 px-2 py-1 bg-white/[0.02] rounded-lg border border-white/[0.05]">
              <input
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSaveNote();
                  if (e.key === "Escape") {
                    onCancelCreatingNote();
                    setNewNoteTitle("");
                  }
                }}
                placeholder="Título da nota..."
                className="flex-1 bg-transparent text-sm text-slate-200 border-none focus:ring-0 placeholder-slate-500"
              />
              <button
                onClick={onSaveNote}
                className="p-1 text-cyan-400 hover:bg-cyan-400/10 rounded"
                disabled={!newNoteTitle.trim()}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => {
                  onCancelCreatingNote();
                  setNewNoteTitle("");
                }}
                className="p-1 text-slate-500 hover:text-rose-400 rounded"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <button
            onClick={() => onCreateNote(folder.id)}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 hover:bg-white/[0.03] hover:text-slate-200 rounded-lg transition-colors"
          >
            <Plus className="h-3 w-3" /> Nova nota
          </button>
        </div>
      )}
    </div>
  );
}
