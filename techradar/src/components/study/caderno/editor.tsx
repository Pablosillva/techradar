"use client";

import { useEffect, useCallback, useRef, useState, useMemo } from "react";
import {
  useEditor,
  EditorContent,
  ReactRenderer,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import CodeBlock from "@tiptap/extension-code-block";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Code as CodeIcon,
  Pin,
  Trash2,
  Maximize,
  Copy,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CadernoEditorProps {
  note: {
    id: string;
    title: string;
    content: string;
    tags: string[];
    updatedAt: Date;
  };
  onUpdate: (title: string, content: string, tags: string[]) => void;
  onTagAdd: (tag: string) => void;
  onTagRemove: (tag: string) => void;
}

export function CadernoEditor({ note, onUpdate, onTagAdd, onTagRemove }: CadernoEditorProps) {
  const editorRef = useRef<any>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [showFormatting, setShowFormatting] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [insertingLink, setInsertingLink] = useState(false);

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          codeBlock: false, // usamos nossa própria extensão
        }),
        Image.configure({
          allowBase64: true,
        }),
        CodeBlock.configure({}),
        Link.configure({
          openOnClick: false,
        }),
      ],
      content: note.content,
      editable: true,
      onUpdate: ({ editor }) => {
        const html = editor.getHTML();
        const text = editor.getText();
        const wordCount = text.split(/\s+/).filter(Boolean).length;
        onUpdate(note.title, html, note.tags);
      },
    },
    []
  );

  const toggleBold = useCallback(() => {
    editor?.chain().toggleBold().focus().run();
  }, [editor]);

  const toggleItalic = useCallback(() => {
    editor?.chain().toggleItalic().focus().run();
  }, [editor]);

  const toggleUnderline = useCallback(() => {
    editor?.chain().toggleUnderline().focus().run();
  }, [editor]);

  const toggleStrike = useCallback(() => {
    editor?.chain().toggleStrike().focus().run();
  }, [editor]);

  const setAlign = useCallback((align: "left" | "center" | "right") => {
    const commands = editor?.chain() as any;
    if (commands.setTextAlign) {
      commands.setTextAlign(align).focus().run();
    }
  }, [editor]);

  const toggleBulletList = useCallback(() => {
    editor?.chain().toggleBulletList().focus().run();
  }, [editor]);

  const toggleOrderedList = useCallback(() => {
    editor?.chain().toggleOrderedList().focus().run();
  }, [editor]);

  const addLink = useCallback(() => {
    setInsertingLink(true);
  }, []);

  const confirmLink = useCallback(() => {
    if (!linkUrl) return;
    editor?.chain().extendMarkRange("link", { href: linkUrl }).focus().run();
    setLinkUrl("");
    setInsertingLink(false);
  }, [editor, linkUrl]);

  const insertCodeBlock = useCallback(() => {
    editor?.chain().toggleCodeBlock().focus().run();
  }, [editor]);

  const insertImage = useCallback(() => {
    const url = prompt("URL da imagem:");
    if (url) {
      const commands = editor?.chain() as any;
      if (commands.insertImage) {
        commands.insertImage({ src: url }).focus().run();
      } else if (commands.setImage) {
        commands.setImage({ src: url }).focus().run();
      }
    }
  }, [editor]);

  const addFlashcard = useCallback(() => {
    const selection = editor?.state.selection;
    const text = editor?.state.doc.textBetween(selection.from, selection.to);
    if (text) {
      onTagAdd(`flashcard:${text.substring(0, 50)}`);
    }
  }, [editor, onTagAdd]);

  const extractToExercise = useCallback(() => {
    const selection = editor?.state.selection;
    const text = editor?.state.doc.textBetween(selection.from, selection.to);
    if (text) {
      alert(`Exercício extraído:\n${text}\n\n(Funcionalidade enviada para a tela de Exercícios)`);
    }
  }, [editor]);

  const activeMarks = useMemo(() => {
    if (!editor) return {};
    return {
      bold: editor.isActive("bold"),
      italic: editor.isActive("italic"),
      underline: editor.isActive("underline"),
      strike: editor.isActive("strike"),
    };
  }, [editor]);

  const activeAlign = useMemo(() => {
    if (!editor) return "left";
    if (editor.isActive("textAlign", { textAlign: "center" })) return "center";
    if (editor.isActive("textAlign", { textAlign: "right" })) return "right";
    return "left";
  }, [editor]);

  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="flex-1 min-w-0 flex flex-col bg-[#0f172a]">
      {/* Toolbar */}
      <div className="border-b border-white/[0.06] bg-[#0f172a]/80 backdrop-blur px-4 py-2.5 flex items-center gap-2 z-10">
        <div className="flex items-center gap-1">
          <ToolbarButton
            icon={<Bold className="h-4 w-4" />}
            active={activeMarks.bold}
            onClick={toggleBold}
            title="Negrito (Ctrl+B)"
          />
          <ToolbarButton
            icon={<Italic className="h-4 w-4" />}
            active={activeMarks.italic}
            onClick={toggleItalic}
            title="Itálico (Ctrl+I)"
          />
          <ToolbarButton
            icon={<Underline className="h-4 w-4" />}
            active={activeMarks.underline}
            onClick={toggleUnderline}
            title="Sublinhado (Ctrl+U)"
          />
          <ToolbarButton
            icon={<Strikethrough className="h-4 w-4" />}
            active={activeMarks.strike}
            onClick={toggleStrike}
            title="Riscado"
          />
          <div className="h-4 w-px bg-white/[0.1] mx-1" />
          <ToolbarButton
            icon={<AlignLeft className="h-4 w-4" />}
            active={activeAlign === "left"}
            onClick={() => setAlign("left")}
            title="Alinhar à esquerda"
          />
          <ToolbarButton
            icon={<AlignCenter className="h-4 w-4" />}
            active={activeAlign === "center"}
            onClick={() => setAlign("center")}
            title="Centralizar"
          />
          <ToolbarButton
            icon={<AlignRight className="h-4 w-4" />}
            active={activeAlign === "right"}
            onClick={() => setAlign("right")}
            title="Alinhar à direita"
          />
          <div className="h-4 w-px bg-white/[0.1] mx-1" />
          <ToolbarButton
            icon={<List className="h-4 w-4" />}
            onClick={toggleBulletList}
            title="Lista não ordenada"
          />
          <ToolbarButton
            icon={<ListOrdered className="h-4 w-4" />}
            onClick={toggleOrderedList}
            title="Lista ordenada"
          />
          <div className="h-4 w-px bg-white/[0.1] mx-1" />
          <ToolbarButton
            icon={<LinkIcon className="h-4 w-4" />}
            onClick={addLink}
            title="Inserir link"
          />
          <ToolbarButton
            icon={<ImageIcon className="h-4 w-4" />}
            onClick={insertImage}
            title="Inserir imagem"
          />
          <ToolbarButton
            icon={<CodeIcon className="h-4 w-4" />}
            onClick={insertCodeBlock}
            title="Bloco de código"
          />
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-1">
          {insertingLink ? (
            <div className="flex items-center gap-2">
              <input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirmLink();
                  if (e.key === "Escape") setInsertingLink(false);
                }}
                placeholder="https://..."
                className="bg-white/[0.05] border border-white/[0.1] rounded text-xs px-2 py-1 text-slate-200 focus:outline-none focus:border-cyan-400 w-48"
              />
              <button
                onClick={confirmLink}
                className="px-2 py-1 text-xs text-cyan-400 hover:bg-cyan-400/10 rounded"
              >
                OK
              </button>
              <button
                onClick={() => setInsertingLink(false)}
                className="px-2 py-1 text-xs text-slate-500 hover:text-rose-400 rounded"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <>
              <ToolbarButton
                icon={<Pin className="h-4 w-4" />}
                onClick={addFlashcard}
                title="Fixar / Criar Flashcard (SRS)"
              />
              <ToolbarButton
                icon={<Trash2 className="h-4 w-4" />}
                onClick={extractToExercise}
                title="Extrair seleção para Exercício"
              />
              <button
                onClick={() => setShowFormatting((p) => !p)}
                className="p-1.5 text-slate-400 hover:bg-white/[0.04] hover:text-white rounded transition-colors"
                title="Mais formatação"
              >
                {showFormatting ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
              <ToolbarButton
                icon={<Maximize className="h-4 w-4" />}
                onClick={() => setIsMaximized((p) => !p)}
                title="Tela cheia"
              />
            </>
          )}
        </div>
      </div>

      {/* Opções de formatação expandidas */}
      {showFormatting && (
        <div className="border-b border-white/[0.06] bg-[#0f172a]/60 backdrop-blur px-4 py-2 flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Formato</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Parágrafo</span>
            <button className="px-2 py-1 rounded text-xs text-slate-300 hover:bg-white/[0.05]">Título 1</button>
            <button className="px-2 py-1 rounded text-xs text-slate-300 hover:bg-white/[0.05]">Título 2</button>
            <span className="h-3 w-px bg-white/[0.1]" />
            <span className="text-xs text-slate-400">Bloco de Código</span>
            <select
              defaultValue="javascript"
              className="bg-transparent border-none text-xs text-cyan-300 focus:ring-0"
            >
              <option>javascript</option>
              <option>typescript</option>
              <option>python</option>
              <option>html</option>
              <option>css</option>
              <option>sql</option>
            </select>
          </div>
        </div>
      )}

      {/* Conteúdo do editor */}
      <div className="flex-1 overflow-auto p-6">
        <EditorContent editor={editor} className="prose prose-invert max-w-none" />
      </div>

      {/* Barra de status */}
      <div className="border-t border-white/[0.06] bg-[#0f172a]/60 backdrop-blur px-4 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3 text-slate-500">
          <span>{editor.getText().split(/\s+/).filter(Boolean).length} palavras</span>
          <span>{editor.getHTML().length} caracteres</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1 text-slate-400 hover:text-white rounded"><Copy className="h-3.5 w-3.5" /></button>
          <button
            onClick={() => setIsMaximized((p) => !p)}
            className="p-1 text-slate-400 hover:text-white rounded"
          >
            <Maximize className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface ToolbarButtonProps {
  icon: React.ReactNode;
  active?: boolean;
  onClick: () => void;
  title?: string;
}

function ToolbarButton({ icon, active = false, onClick, title }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "p-1.5 rounded transition-colors",
        active
          ? "bg-cyan-400/10 text-cyan-400 border border-cyan-400/20"
          : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200",
      )}
    >
      {icon}
    </button>
  );
}
