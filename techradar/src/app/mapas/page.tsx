import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { NewMindMapForm } from "@/components/study/new-mind-map-form";

export default async function MapasPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/entrar");
  }

  const mindMaps = await prisma.mindMap.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Mapas Mentais
      </h1>

      <Card className="mt-6">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Novo mapa mental
          </h2>
          <NewMindMapForm />
        </CardContent>
      </Card>

      <div className="mt-6 space-y-3">
        {mindMaps.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Nenhum mapa mental ainda.
          </p>
        ) : (
          mindMaps.map((map) => (
            <Card key={map.id}>
              <CardContent className="py-4">
                <a
                  href={`/mapas/${map.id}`}
                  className="font-medium text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                >
                  {map.title}
                </a>
                {map.topic ? (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Tópico: {map.topic}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
