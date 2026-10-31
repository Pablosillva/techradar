"use client";

import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfReaderProps {
  documentId: string;
  fileUrl: string;
  title: string;
}

export function PdfReader({ documentId, fileUrl, title }: PdfReaderProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [highlights, setHighlights] = useState<Array<{ text: string; page: number }>>([]);
  const [selectedText, setSelectedText] = useState("");

  const onDocumentLoadSuccess = (pdf: any) => {
    setNumPages(pdf.numPages);
  };

  const changePage = (offset: number) => {
    const target = pageNumber + offset;
    if (target >= 1 && target <= (numPages ?? 1)) {
      setPageNumber(target);
    }
  };

  const handleSaveHighlight = async (text: string) => {
    if (!text.trim()) return;
    try {
      const res = await fetch("/api/highlights", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          documentId,
          text: text.trim(),
          page: pageNumber,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setHighlights((prev) => [...prev, { text: data.data.text, page: data.data.page }]);
        setSelectedText("");
      }
    } catch (e) {
      console.error("Erro ao salvar destaque:", e);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex h-16 items-center justify-between px-6 border-b border-gray-800 bg-[#0a0a0f]/90 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link href="/documentos" className="text-sm text-gray-400 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
          </Link>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-medium text-white">{title}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => changePage(-1)} disabled={pageNumber === 1}>
            Anterior
          </Button>
          <span className="text-xs text-gray-500">
            Página {pageNumber} de {numPages ?? "-"}
          </span>
          <Button size="sm" onClick={() => changePage(1)} disabled={pageNumber === numPages}>
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

      <div className="flex-1 overflow-auto p-4">
        <div className="flex justify-center">
          <div className="relative">
            {Array.from({ length: numPages ?? 0 }, (_, i) => i + 1).map((pageNum) => (
              <Page
                key={pageNum}
                pageNumber={pageNum}
                width={600}
              />
            ))}
          </div>
        </div>
      </div>

      {highlights.length > 0 && (
        <aside className="h-64 overflow-y-auto border-t border-gray-800 bg-gray-900 p-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Destaques ({highlights.length})
          </h3>
          <ul className="space-y-2">
            {highlights.map((h, i) => (
              <li key={i} className="p-2 rounded-md bg-gray-800/50 border border-gray-800">
                <p className="text-sm text-gray-300 italic">"{h.text}"</p>
                <span className="text-[10px] text-gray-500 block mt-1">Página {h.page}</span>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
}

export default PdfReader;
