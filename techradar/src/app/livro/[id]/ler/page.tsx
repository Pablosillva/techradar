import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, ChevronRight } from "lucide-react";
import Link from "next/link";

interface BookReaderPageProps {
  params: Promise<{ id: string }>;
}

export default async function BookReaderPage({ params }: BookReaderPageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect("/entrar");
  }

  const book = await prisma.book.findUnique({
    where: { id },
    include: {
      chapters: { orderBy: { order: "asc" } },
      skills: { include: { skill: true } },
    },
  });

  if (!book) {
    notFound();
  }

  const library = await prisma.libraryItem.findFirst({
    where: { userId: session.user.id, itemType: "book", itemId: id },
  });

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: session.user.id, itemType: "book", itemId: id },
    orderBy: { position: "asc" },
    include: { chapter: true },
  });

  const skills = book.skills.map((s) => s.skill.slug);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link
        href={"/livro/" + id}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-4"
      >
        <ChevronRight size={14} /> Voltar para o livro
      </Link>

      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-1/4 flex-shrink-0 space-y-6">
          <Card>
            <CardContent className="p-5">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                Capítulos
              </h2>
              {book.chapters.length === 0 ? (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Sem capítulos cadastrados.
                </p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {book.chapters.map((ch) => (
                    <li key={ch.id}>
                      <Link
                        href={"/livro/" + id + "/ler?cap=" + ch.id}
                        className="block text-sm text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
                      >
                        {ch.order}. {ch.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {bookmarks.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Marcadores ({bookmarks.length})
                </h2>
                <ul className="mt-2 space-y-3">
                  {bookmarks.map((bm) => (
                    <li key={bm.id} className="text-sm">
                      <div className="text-gray-900 dark:text-white truncate">
                        {bm.note ?? `Posição ${bm.position}`}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {bm.chapter ? `Cap. ${bm.chapter.order}` : "Página"}:{" "}
                        {bm.position}
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </aside>

        <section className="flex-1 min-w-0 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {book.title}
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {book.authors.join(", ")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{book.language.toUpperCase()}</Badge>
              {library ? (
                <Badge
                  variant={
                    library.status === "completed"
                      ? "success"
                      : library.status === "reading"
                      ? "default"
                      : "outline"
                  }
                >
                  {library.status === "completed"
                    ? "Concluído"
                    : library.status === "reading"
                    ? "Lendo"
                    : "Para ler"}
                </Badge>
              ) : (
                <Button size="sm" onClick={() => window.location.reload()}>
                  Adicionar à biblioteca
                </Button>
              )}
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Progresso
              </span>
              <span className="text-xs font-medium text-gray-900 dark:text-white">
                {library?.progress ?? 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-800">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${library?.progress ?? 0}%` }}
              />
            </div>

            <div className="mt-8 whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
              {book.chapters.length === 0 ? (
                <>
                  <p>
                    Conteúdo do livro não disponível para leitura direta (sem
                    hospedagem de áudio/vídeo no MVP).
                  </p>
                  <p>Use o botão abaixo para abrir a fonte externa.</p>
                </>
              ) : (
                <>
                  <p>
                    Selecione um capítulo na barra lateral para iniciar a
                    leitura. Use os marcadores para salvar posições importantes.
                  </p>
                </>
              )}
            </div>

            <div className="mt-6 flex items-center gap-3">
              <Button
                size="sm"
                onClick={() => {
                  const nextProgress = Math.min(
                    100,
                    (library?.progress ?? 0) + 5
                  );
                  void fetch(`/api/library/${library?.id ?? ""}`, {
                    method: "PUT",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ progress: nextProgress }),
                  }).then(() => window.location.reload());
                }}
                disabled={!library}
              >
                +5% progresso
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href={book.url} target="_blank" rel="noopener noreferrer">
                  Abrir no Book <BookOpen size={14} className="ml-1" />
                </a>
              </Button>
            </div>
          </div>

          {skills.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Skills cobertas
                </h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <Badge key={skill} variant="default">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
