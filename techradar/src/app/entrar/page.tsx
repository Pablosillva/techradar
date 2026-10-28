import Link from "next/link";
import { githubSignInAction, loginAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Github } from "@/components/ui/github-icon";

export default function EntrarPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Entrar no TechRadar</CardTitle>
          <CardDescription>
            Salve favoritos e acompanhe seu histórico de buscas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Login com email/senha */}
          <form action={loginAction} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Senha
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full">
              Entrar
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                ou
              </span>
            </div>
          </div>

          <form action={githubSignInAction}>
            <Button type="submit" variant="outline" className="w-full">
              <Github size={18} className="mr-2" />
              Continuar com GitHub
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Não tem conta?{" "}
            <Link href="/cadastrar" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
              Cadastre-se
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
