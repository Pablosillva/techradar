import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, ChevronRight, Volume2 } from "lucide-react";
import Link from "next/link";

interface AudiobookPlayerPageProps {
  params: Promise<{ id: string }>;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default async function AudiobookPlayerPage({
  params,
}: AudiobookPlayerPageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect("/entrar");
  }

  const audiobook = await prisma.audiobook.findUnique({
    where: { id },
    include: {
      skills: { include: { skill: true } },
    },
  });

  if (!audiobook) {
    notFound();
  }

  const library = await prisma.libraryItem.findFirst({
    where: { userId: session.user.id, itemType: "audiobook", itemId: id },
  });

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: session.user.id, itemType: "audiobook", itemId: id },
    orderBy: { position: "asc" },
  });

  const skills = audiobook.skills.map((s) => s.skill.slug);

  const isDirectAudio = audiobook.url.match(/\.(mp3|m4a|ogg|wav)(\?|$)/i);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link
        href={"/audiobook/" + id}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-4"
      >
        <ChevronRight size={14} /> Voltar para o audiobook
      </Link>

      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-1/4 flex-shrink-0 space-y-6">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="shrink-0">
                  {audiobook.thumbnailUrl ? (
                    <img
                      src={audiobook.thumbnailUrl}
                      alt={audiobook.title}
                      className="w-24 h-24 rounded-md object-cover border border-gray-300 dark:border-gray-700"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-md bg-gray-200 flex items-center justify-center dark:bg-gray-800">
                      <Volume2 size={32} className="text-gray-500" />
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {audiobook.title}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {audiobook.authors.join(", ")}
                  </p>
                  {audiobook.narrator && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Narrador: {audiobook.narrator}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {audiobook.durationMin && (
                  <Card className="p-2">
                    <CardContent className="pt-1 pb-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Duração
                      </p>
                      <p className="mt-0.5 font-medium text-gray-900 dark:text-white">
                        {formatTime(audiobook.durationMin * 60)}
                      </p>
                    </CardContent>
                  </Card>
                )}
                <Card className="p-2">
                  <CardContent className="pt-1 pb-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Fonte
                    </p>
                    <p className="mt-0.5 font-medium text-gray-900 dark:text-white">
                      {audiobook.source}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {bookmarks.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Marcadores ({bookmarks.length})
                </h2>
                <ul className="mt-2 space-y-2">
                  {bookmarks.map((bm) => (
                    <li key={bm.id} className="text-sm">
                      <div className="text-gray-900 dark:text-white truncate">
                        {bm.note ?? `Posição ${formatTime(bm.position)}`}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {bm.position}s
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </aside>

        <section className="flex-1 min-w-0 space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-900 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Player
            </h2>

            <div className="mt-6">
              {isDirectAudio ? (
                <audio
                  controls
                  className="w-full"
                  src={audiobook.url}
                />
              ) : (
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-100 dark:bg-blue-900/20 dark:border-blue-900/30">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    Este audiobook não expõe um arquivo de áudio direto. Use o
                    botão abaixo para abri-lo na fonte externa.
                  </p>
                  <Button size="sm" asChild className="mt-3 w-auto">
                    <a
                      href={audiobook.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Abrir áudio externo{" "}
                      <BookOpen size={14} className="ml-1" />
                    </a>
                  </Button>
                </div>
              )}
            </div>

            <div className="mt-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Progresso
                </span>
                <span className="text-xs font-medium text-gray-900 dark:text-white">
                  {library?.progress ?? 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-800">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${library?.progress ?? 0}%` }}
                />
              </div>
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
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const next =
                    library?.status === "completed"
                      ? "to_read"
                      : library?.status === "reading"
                      ? "completed"
                      : "reading";
                  void fetch(`/api/library/${library?.id ?? ""}`, {
                    method: "PUT",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({
                      status: next,
                      progress:
                        next === "completed"
                          ? 100
                          : library?.progress ?? 0,
                    }),
                  }).then(() => window.location.reload());
                }}
                disabled={!library}
              >
                {library?.status === "completed"
                  ? "Reiniciar"
                  : library?.status === "reading"
                  ? "Concluir"
                  : "Começar"}
              </Button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Novo marcador
              </h3>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Marcador rápido (posição em segundos). Persistência de áudio
                sem player nativo próprio no MVP.
              </p>
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
