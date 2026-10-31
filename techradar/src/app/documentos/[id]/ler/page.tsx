import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PdfReader } from "@/components/study/pdf-reader";
import { EpubReader } from "@/components/study/epub-reader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, BookOpen, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ReaderPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReaderPage({ params }: ReaderPageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect("/entrar");
  }

  const document = await prisma.document.findFirst({
    where: { id, userId: session.user.id },
    include: {
      highlights: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  if (!document) {
    notFound();
  }

  const fileUrl = `/api/documents/${id}/file`;

  const createNoteFromHighlight = async (highlightId: string, text: string) => {
    const title = `Nota: ${text.slice(0, 50)}${text.length > 50 ? "..." : ""}`;
    const res = await fetch(`/api/highlights/${highlightId}/to-note`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, markdown: `> ${text}` }),
    });
    return res.ok;
  };

  const createFlashcardFromHighlight = async (highlightId: string, text: string) => {
    const res = await fetch(`/api/highlights/${highlightId}/to-flashcard`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        front: `O que diz o trecho: "${text.slice(0, 100)}..."`,
        back: text,
      }),
    });
    return res.ok;
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex h-16 items-center justify-between px-6 border-b border-gray-800 bg-[#0a0a0f]/90 backdrop-blur">
        <Link
          href="/documentos"
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Biblioteca
        </Link>
        <div className="flex items-center gap-3">
          {document.fileType === "pdf" ? (
            <FileText className="w-5 h-5 text-blue-400" />
          ) : (
            <BookOpen className="w-5 h-5 text-purple-400" />
          )}
          <h1 className="text-sm font-medium text-white truncate max-w-[400px]">
            {document.title}
          </h1>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        {document.fileType === "epub" ? (
          <EpubReader documentId={document.id} fileUrl={fileUrl} title={document.title} />
        ) : (
          <PdfReader documentId={document.id} fileUrl={fileUrl} title={document.title} />
        )}
      </div>

      {/* Destaques recentes */}
      {document.highlights.length > 0 && (
        <div className="border-t border-gray-800 bg-[#0a0a0f] p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Destaques recentes ({document.highlights.length})
            </h2>
            <Link
              href={`/documentos/${id}/destaques`}
              className="text-xs text-blue-400 hover:text-blue-300 underline"
            >
              Gerenciar todos
            </Link>
          </div>
          <div className="space-y-2">
            {document.highlights.map((h) => (
              <div key={h.id} className="p-2 rounded-md bg-gray-800/50 border border-gray-800/50">
                <p className="text-sm text-gray-300 italic line-clamp-2">
                  {h.text}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] text-gray-500">Página {h.page}</span>
                  {h.noteId ? (
                    <span className="text-[10px] text-green-400">● vinculado a nota</span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        createNoteFromHighlight(h.id, h.text).then((ok) => {
                          if (ok) window.location.reload();
                        });
                      }}
                    >
                      Nota
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      createFlashcardFromHighlight(h.id, h.text).then((ok) => {
                        if (ok) window.location.reload();
                      });
                    }}
                  >
                    Flashcard
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
