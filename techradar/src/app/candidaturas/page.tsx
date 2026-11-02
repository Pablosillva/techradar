import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function CandidaturasPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/entrar");
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Candidaturas
      </h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Acompanhe suas candidaturas a vagas de emprego.
      </p>
      <div className="mt-8">
        <p className="text-gray-500 dark:text-gray-400">
          Use a busca de vagas para encontrar oportunidades.
        </p>
      </div>
    </div>
  );
}
