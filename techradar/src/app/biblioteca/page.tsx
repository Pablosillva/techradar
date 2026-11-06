import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Headphones, BookOpen, ArrowUpRight } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  to_read: "Para ler",
  reading: "Lendo",
  completed: "Concluído",
};

export default async function BibliotecaPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/entrar");
  }

  const items = await prisma.libraryItem.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Biblioteca
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Seus livros, PDFs e audiobooks em estudo.
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-white/[0.08] bg-transparent p-10 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] text-cyan-300">
            <BookOpen className="h-6 w-6" />
          </span>
          <h2 className="mt-4 text-lg font-semibold text-white">
            Biblioteca vazia
          </h2>
          <p className="mt-1.5 text-sm text-slate-400">
            Adicione livros, PDFs e audiobooks para começar a acompanhar seu
            progresso.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {items.map((item) => {
            const isAudio = item.itemType === "audiobook";
            const canOpen = Boolean(item.fileUrl);

            return (
              <div
                key={item.id}
                className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.03]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-400/10 text-violet-300">
                      {isAudio ? (
                        <Headphones className="h-4 w-4" />
                      ) : (
                        <BookOpen className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3
                        className="truncate text-sm font-semibold text-slate-200"
                        title={item.title ?? undefined}
                      >
                        {item.title ?? "Sem título"}
                      </h3>
                      <p className="text-xs capitalize text-slate-500">
                        {item.itemType}
                        {item.author ? ` · ${item.author}` : ""}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      item.status === "completed"
                        ? "success"
                        : item.status === "reading"
                          ? "default"
                          : "secondary"
                    }
                    className="text-[10px]"
                  >
                    {STATUS_LABEL[item.status] ?? item.status}
                  </Badge>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Progresso</span>
                    <span className="font-semibold text-slate-200">
                      {item.progress}%
                    </span>
                  </div>
                  <div
                    className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={item.progress}
                    aria-label={`Progresso de ${item.title ?? "item"}`}
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500"
                      style={{ width: `${Math.min(100, Math.max(0, item.progress))}%` }}
                    />
                  </div>
                </div>

                {canOpen && (
                  <div className="mt-3 flex justify-end">
                    <Link
                      href={`/library/${item.id}`}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-300 transition-colors hover:text-cyan-200"
                    >
                      {isAudio ? "Ouvir" : "Abrir"}
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
