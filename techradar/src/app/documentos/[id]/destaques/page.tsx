import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, BookOpen } from "lucide-react";
import Link from "next/link";

interface DestaquesPageProps {
  params: Promise<{ id: string }>;
}

export default async function DestaquesPage({ params }: DestaquesPageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect("/entrar");
  }

  const document = await prisma.document.findFirst({
    where: { id, userId: session.user.id },
    include: {
      highlights: { orderBy: { page: "asc" } },
    },
  });

  if (!document) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href={`/documentos/${id}/ler`}
          className="text-sm text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar ao leitor
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-white">
        Destaques — {document.title}
      </h1>

      {document.highlights.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-800 bg-gray-900/50 p-8 text-center">
          <FileText className="w-8 h-8 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Nenhum destaque ainda.</p>
          <p className="text-xs text-gray-500 mt-2">
            Abra o documento no leitor e selecione texto para destacar.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {document.highlights.map((h) => (
            <Card key={h.id} className="hover:bg-gray-800/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm text-gray-300 italic line-clamp-3">
                      "{h.text}"
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                      <span>Página {h.page}</span>
                      <span>•</span>
                      <span>{new Date(h.createdAt).toLocaleDateString("pt-BR")}</span>
                      {h.noteId && (
                        <>
                          <span>•</span>
                          <span className="text-green-400">● vinculado a nota</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!h.noteId && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          fetch(`/api/highlights/${h.id}/to-note`, {
                            method: "POST",
                            headers: { "content-type": "application/json" },
                            body: JSON.stringify({
                              title: `Nota: ${h.text.slice(0, 40)}...`,
                              markdown: `> ${h.text}\n\nPágina ${h.page}`,
                            }),
                          }).then(() => window.location.reload());
                        }}
                      >
                        Criar nota
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        fetch(`/api/highlights/${h.id}/to-flashcard`, {
                          method: "POST",
                          headers: { "content-type": "application/json" },
                          body: JSON.stringify({
                            front: `Trecho (pág. ${h.page}): "${h.text.slice(0, 60)}..."`,
                            back: h.text,
                          }),
                        }).then(() => window.location.reload());
                      }}
                    >
                      Flashcard
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
