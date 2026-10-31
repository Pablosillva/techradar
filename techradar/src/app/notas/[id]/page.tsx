import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link as LinkIcon } from "lucide-react";
import Link from "next/link";

interface NotaPageProps {
  params: Promise<{ id: string }>;
}

export default async function NotaPage({ params }: NotaPageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect("/entrar");
  }

  const note = await prisma.studyNote.findFirst({
    where: { id, userId: session.user.id },
    include: { tags: { include: { tag: true } } },
  });

  if (!note) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{note.title}</h1>
          <p className="mt-1 text-sm text-gray-400">
            Atualizada em {new Date(note.updatedAt).toLocaleDateString("pt-BR")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/notas">
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Voltar
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href={`/notas/${id}/editar`}>
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/flashcards?sourceNote=${id}`}>
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Gerar flashcards
            </Link>
          </Button>
        </div>
      </div>

      {/* Tags */}
      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {note.tags.map((nt) => (
            <Badge key={nt.tagId} variant="outline">
              {nt.tag.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Conteúdo */}
      <Card>
        <CardContent className="p-6">
          <div className="prose prose-invert prose-lg max-w-none">
            {note.markdown ? (
              <div dangerouslySetInnerHTML={{ __html: note.markdown }} />
            ) : (
              <p className="text-gray-500 italic">Sem conteúdo.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ações rápidas */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-blue-500/20 flex items-center justify-center text-blue-400">
                <LinkIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Nota vinculada</p>
                <p className="text-xs text-gray-400">Use [[nota]] no conteúdo para criar links entre notas</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-purple-500/20 flex items-center justify-center text-purple-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Gerar flashcards</p>
                <p className="text-xs text-gray-400">Transforme esta nota em cartões de revisão com IA</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-red-500/20 flex items-center justify-center text-red-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Excluir nota</p>
                <p className="text-xs text-gray-400">Remover esta nota do caderno</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
