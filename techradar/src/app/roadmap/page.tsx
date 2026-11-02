import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";

export default async function RoadmapPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/entrar");
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Roadmap de Estudos
      </h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Planeje sua jornada de aprendizado com foco nas habilidades mais demandadas.
      </p>

      <div className="mt-8 space-y-6">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Módulo 1: Fundamentos de Programação
            </h2>
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <span className="text-gray-400 dark:text-gray-500">▹</span>
                <span className="text-gray-700 dark:text-gray-300">Lógica de programação</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-400 dark:text-blue-400">✓</span>
                <span className="text-gray-700 dark:text-gray-300">HTML/CSS</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gray-400 dark:text-gray-500">▹</span>
                <span className="text-gray-700 dark:text-gray-300">JavaScript</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Módulo 2: Frontend
            </h2>
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <span className="text-blue-400 dark:text-blue-400">✓</span>
                <span className="text-gray-700 dark:text-gray-300">React</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gray-400 dark:text-gray-500">▹</span>
                <span className="text-gray-700 dark:text-gray-300">TypeScript</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gray-400 dark:text-gray-500">▹</span>
                <span className="text-gray-700 dark:text-gray-300">Next.js</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Módulo 3: Backend
            </h2>
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <span className="text-gray-400 dark:text-gray-500">▹</span>
                <span className="text-gray-700 dark:text-gray-300">Node.js</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gray-400 dark:text-gray-500">▹</span>
                <span className="text-gray-700 dark:text-gray-300">PostgreSQL</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gray-400 dark:text-gray-500">▹</span>
                <span className="text-gray-700 dark:text-gray-300">APIs REST</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
