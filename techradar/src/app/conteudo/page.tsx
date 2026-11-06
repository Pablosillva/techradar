import { redirect } from "next/navigation";
import Link from "next/link";
import { ExternalLink, FileText, Layers3 } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  CONTENT_TYPE_META,
  STATUS_META,
  safeHttpUrl,
} from "@/lib/roadmap/presentation";
import type {
  RoadmapItemStatus,
  StudyContentType,
} from "@/lib/roadmap/types";

export default async function ConteudoPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/entrar");
  }

  const roadmaps = await prisma.roadmap.findMany({
    where: { userId: session.user.id, isArchived: false },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: {
      items: {
        orderBy: { order: "asc" },
        include: {
          contents: { orderBy: { order: "asc" } },
        },
      },
    },
  });

  const tracks = roadmaps
    .map((roadmap) => ({
      id: roadmap.id,
      title: roadmap.title,
      items: roadmap.items.filter((item) => item.contents.length > 0),
    }))
    .filter((track) => track.items.length > 0);

  const totalContents = tracks.reduce(
    (total, track) =>
      total +
      track.items.reduce((sum, item) => sum + item.contents.length, 0),
    0
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-start gap-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-violet-400/25 bg-violet-400/10 text-violet-300">
          <FileText className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-300/80">
            Biblioteca de estudos
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
            Conteúdo teórico
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            Todo o material teórico e os links oficiais cadastrados nas suas
            trilhas. Para editar, use a página{" "}
            <Link
              href="/roadmap"
              className="font-medium text-cyan-300 hover:text-cyan-200"
            >
              Roadmap
            </Link>
            .
          </p>
        </div>
      </div>

      {totalContents === 0 ? (
        <Card className="border-dashed border-white/10 bg-transparent p-10 text-center sm:p-16">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] text-cyan-300">
            <FileText className="h-6 w-6" />
          </span>
          <h2 className="mt-4 text-lg font-semibold text-white">
            Nenhum conteúdo cadastrado
          </h2>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-400">
            Adicione conteúdos teóricos ou links oficiais aos itens das suas
            trilhas para visualizá-los aqui.
          </p>
          <Link
            href="/roadmap"
            className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-300"
          >
            Ir para o Roadmap
          </Link>
        </Card>
      ) : (
        <div className="space-y-5">
          {tracks.map((track) => (
            <Card key={track.id} className="overflow-hidden">
              <div className="flex items-center gap-2 border-b border-white/[0.06] px-5 py-3.5">
                <Layers3 className="h-4 w-4 text-cyan-300" />
                <h2 className="text-sm font-semibold text-white">
                  {track.title}
                </h2>
                <Badge variant="outline" className="ml-auto">
                  {track.items.length}{" "}
                  {track.items.length === 1 ? "item" : "itens"}
                </Badge>
              </div>

              <div className="divide-y divide-white/[0.05]">
                {track.items.map((item) => {
                  const itemStatus =
                    STATUS_META[item.status as RoadmapItemStatus] ??
                    STATUS_META.NOT_STARTED;

                  return (
                    <div key={item.id} className="px-5 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-100">
                          {item.title}
                        </h3>
                        <Badge variant={itemStatus.badge}>
                          {itemStatus.label}
                        </Badge>
                      </div>

                      <div className="mt-3 space-y-2">
                        {item.contents.map((content) => {
                          const type =
                            CONTENT_TYPE_META[
                              content.type as StudyContentType
                            ] ?? CONTENT_TYPE_META.NOTE;
                          const contentUrl = safeHttpUrl(content.url);

                          return (
                            <div
                              key={content.id}
                              className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-3"
                            >
                              <div className="flex flex-wrap items-center gap-1.5">
                                <p className="text-xs font-medium text-slate-200">
                                  {content.title}
                                </p>
                                <Badge variant="secondary">{type.label}</Badge>
                              </div>

                              {content.content && (
                                <p className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-400">
                                  {content.content}
                                </p>
                              )}

                              {contentUrl && (
                                <a
                                  href={contentUrl}
                                  target="_blank"
                                  rel="noopener noreferrer nofollow"
                                  className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-cyan-300 transition-colors hover:text-cyan-200"
                                >
                                  Abrir link oficial{" "}
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
