import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { CodeReviewPanel } from "@/components/study/code-review-panel";

interface TreinoPageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function TreinoPage({ searchParams }: TreinoPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/entrar");
  }

  const { id } = await searchParams;

  const exercises = await prisma.exercise.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  const exercise = id
    ? await prisma.exercise.findFirst({
        where: { id, userId: session.user.id },
      })
    : null;

  const errors =
    exercise && exercise.id
      ? await prisma.codeError.findMany({
          where: { exerciseId: exercise.id },
          orderBy: { createdAt: "desc" },
        })
      : [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Treino de Código</h1>

      {exercise ? (
        <Card className="mt-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {exercise.title}
            </h2>
            <p className="mt-4 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
              {exercise.description}
            </p>
            <div className="mt-6">
              <CodeReviewPanel
                exerciseId={exercise.id}
                language={exercise.language}
                initialCode={exercise.starterCode}
                solutionCode={exercise.solutionCode ?? ""}
              />
            </div>

            {errors.length > 0 ? (
              <div className="mt-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Diário de erros
                </h2>
                <div className="mt-4 space-y-2">
                  {errors.map((err) => (
                    <Card key={err.id}>
                      <CardContent className="py-3">
                        <p className="text-sm text-gray-900 dark:text-white">
                          {err.summary}
                        </p>
                        {err.aiFeedback ? (
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Detalhe: {err.aiFeedback}
                          </p>
                        ) : null}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 space-y-3">
          {exercises.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Nenhum exercício ainda. Crie exercícios via API ou aguarde a fase de criação.
            </p>
          ) : (
            exercises.map((ex) => (
              <Card key={ex.id}>
                <CardContent className="py-4">
                  <a
                    href={`/treino?id=${ex.id}`}
                    className="font-medium text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                  >
                    {ex.title}
                  </a>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
