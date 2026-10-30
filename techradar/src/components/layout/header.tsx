import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { UserMenu } from "./user-menu";

export async function Header() {
  const session = await auth();
  const user = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, email: true, role: true },
      })
    : null;

  const isAdmin = user?.role === "ADMIN";

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white"
        >
          <span className="text-blue-600 dark:text-blue-400">Tech</span>Radar
        </Link>

        <nav className="flex items-center gap-4" aria-label="Navegação principal">
          <Link
            href="/busca?tab=vagas"
            className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Vagas
          </Link>
          <Link
            href="/busca?tab=cursos"
            className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Cursos
          </Link>
          <Link
            href="/busca?tab=livros"
            className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Livros
          </Link>
          <Link
            href="/busca?tab=audiobooks"
            className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Audiobooks
          </Link>
          <Link
            href="/flashcards"
            className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Estudos
          </Link>
          <Link
            href="/treino"
            className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Treino
          </Link>

          {session?.user && (
            <Link
              href="/biblioteca"
              className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Biblioteca
            </Link>
          )}

          <div className="h-4 w-px bg-gray-200 dark:bg-gray-700" aria-hidden="true" />

          {isAdmin && (
            <Link
              href="/admin"
              className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Admin
            </Link>
          )}

          {session?.user ? (
            <UserMenu
              user={{
                name: session.user.name ?? undefined,
                email: session.user.email ?? undefined,
                image: session.user.image ?? undefined,
                id: (session.user as { id?: string }).id ?? "",
              }}
            />
          ) : (
            <Button asChild size="sm" variant="outline" href="/entrar">
              Entrar
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
