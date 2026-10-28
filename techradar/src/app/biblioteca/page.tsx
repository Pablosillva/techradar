import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

interface LibraryItem {
  id: string;
  itemType: string;
  itemId: string;
  status: string;
  progress: number;
  rating?: number | null;
  notes?: string | null;
  updatedAt: Date;
}

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "completed"
      ? "success"
      : status === "reading"
      ? "default"
      : "outline";
  const label =
    status === "completed"
      ? "Concluído"
      : status === "reading"
      ? "Lendo"
      : "Para ler";
  return <Badge variant={variant}>{label}</Badge>;
}

export default async function BibliotecaPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/entrar");
  }

  const items = await prisma.libraryItem.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Biblioteca
      </h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Seus livros e audiobooks em estudo.
      </p>

      {items.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-900">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Biblioteca vazia
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Adicione livros ou audiobooks das páginas de busca para começar a
            acompanhar seu progresso.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((item: LibraryItem) => {
            const href =
              item.itemType === "book"
                ? `/livro/${item.itemId}`
                : `/audiobook/${item.itemId}`;
            return (
              <Card key={item.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={href}
                      className="flex-1 text-sm font-medium text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                    >
                      {item.itemType} · {item.itemId.slice(-6)}
                    </Link>
                    <StatusBadge status={item.status} />
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <span>Progresso</span>
                        <span className="ml-auto font-medium text-gray-900 dark:text-white">
                          {item.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-800">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          const next =
                            item.status === "completed"
                              ? "to_read"
                              : item.status === "reading"
                              ? "completed"
                              : "reading";
                          void fetch(`/api/library/${item.id}`, {
                            method: "PUT",
                            headers: { "content-type": "application/json" },
                            body: JSON.stringify({
                              status: next,
                              progress: next === "completed" ? 100 : item.progress,
                            }),
                          }).then(() => window.location.reload());
                        }}
                      >
                        {item.status === "completed"
                          ? "Reiniciar"
                          : item.status === "reading"
                          ? "Concluir"
                          : "Começar"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newProgress = Math.min(100, item.progress + 10);
                          void fetch(`/api/library/${item.id}`, {
                            method: "PUT",
                            headers: { "content-type": "application/json" },
                            body: JSON.stringify({ progress: newProgress }),
                          }).then(() => window.location.reload());
                        }}
                      >
                        +10%
                      </Button>
                      <a
                        href={href}
                        className="text-xs text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 underline underline-offset-2"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Abrir conteúdo
                        <ExternalLink size={12} className="ml-1" />
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
