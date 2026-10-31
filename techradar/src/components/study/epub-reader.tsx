"use client";

import { useEffect, useRef, useState } from "react";
import Book from "epubjs";
import { Button } from "@/components/ui/button";
import { BookOpen, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface EpubReaderProps {
  documentId: string;
  fileUrl: string;
  title: string;
}

export function EpubReader({ documentId, fileUrl, title }: EpubReaderProps) {
  const bookRef = useRef<any>(null);
  const renditionRef = useRef<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [highlights, setHighlights] = useState<Array<{ text: string; cfi: string }>>([]);
  const [selectedText, setSelectedText] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const book: any = Book(fileUrl);
    bookRef.current = book;

    book.ready().then(() => {
      const rendition: any = book.renderTo(containerRef.current!, {
        width: "100%",
        height: "100%",
      });
      renditionRef.current = rendition;
      rendition.display();

      const loc = rendition.location();
      const start = loc?.start?.progression ?? 0;
      const end = loc?.end?.progression ?? 1;
      setTotalPages(Math.ceil(end * 100) || 1);
      setCurrentPage(Math.ceil(start * 100) || 1);

      rendition.on("relocated", (location: any) => {
        const p = location.start?.progression ?? 0;
        setCurrentPage(Math.ceil(p * 100));
      });

      setHighlights([]);
    });

    return () => {
      renditionRef.current?.destroy();
      bookRef.current?.destroy();
    };
  }, [fileUrl]);

  const handleSaveHighlight = async (text: string) => {
    if (!text.trim()) return;
    try {
      const res = await fetch("/api/highlights", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          documentId,
          text: text.trim(),
          page: currentPage,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setHighlights((prev) => [...prev, { text: data.data.text, cfi: "" }]);
        setSelectedText("");
      }
    } catch (e) {
      console.error("Erro ao salvar destaque:", e);
    }
  };

  if (!containerRef.current) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-400">Carregando livro...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex h-16 items-center justify-between px-6 border-b border-gray-800 bg-[#0a0a0f]/90 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link href="/documentos" className="text-sm text-gray-400 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
          </Link>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-400" />
            <span className="text-sm font-medium text-white">{title}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => renditionRef.current?.prev()} disabled={currentPage <= 1}>
            Anterior
          </Button>
          <span className="text-xs text-gray-500">
            {currentPage} / {totalPages}
          </span>
          <Button size="sm" onClick={() => renditionRef.current?.next()} disabled={currentPage >= totalPages}>
            Próxima
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleSaveHighlight(selectedText)}
            disabled={!selectedText.trim()}
          >
            Destacar trecho
          </Button>
        </div>
      </header>

      <div
        ref={containerRef}
        className="flex-1 bg-white p-8 overflow-auto"
        style={{ width: "100%", height: "calc(100vh - 200px)" }}
      />

      {highlights.length > 0 && (
        <aside className="h-64 overflow-y-auto border-t border-gray-800 bg-gray-900 p-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Destaques ({highlights.length})
          </h3>
          <ul className="space-y-2">
            {highlights.map((h, i) => (
              <li key={i} className="p-2 rounded-md bg-gray-800/50 border border-gray-800">
                <p className="text-sm text-gray-300 italic">"{h.text}"</p>
                <span className="text-[10px] text-gray-500 block mt-1">Página {currentPage}</span>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
}
