import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function ConfiguracoesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/entrar");
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Configurações
      </h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Gerencie suas preferências de usuário e conta.
      </p>
      <div className="mt-8">
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Configurações de Conta
          </h2>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Email: {session.user.email}
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
            Role: {session.user.role}
          </p>
        </div>
      </div>
    </div>
  );
}
