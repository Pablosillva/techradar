import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { timeAgo } from "@/lib/utils";

export default async function PerfilPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/entrar");
  }

  const searchLogs = await prisma.searchLog.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const favoriteCount = await prisma.favorite.count({
    where: { userId: session.user.id },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Meu Perfil
      </h1>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-gray-500 dark:text-gray-400">Favoritos</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
              {favoriteCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-gray-500 dark:text-gray-400">Buscas realizadas</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
              {searchLogs.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-gray-500 dark:text-gray-400">ID</p>
            <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white truncate">
              {session.user?.id?.slice(0, 8) ?? "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Histórico de buscas */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Histórico de buscas
        </h2>

        {searchLogs.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Você ainda não realizou nenhuma busca.
          </p>
        ) : (
          <div className="mt-4 space-y-2">
            {searchLogs.map((log) => (
              <Card key={log.id}>
                <CardContent className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {log.query}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="secondary">{log.tab}</Badge>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {log.resultCount} resultado{log.resultCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {timeAgo(log.createdAt)}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
