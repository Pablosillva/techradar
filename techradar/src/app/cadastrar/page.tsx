import Link from "next/link";
import { registerAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CadastrarPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Criar conta</CardTitle>
          <CardDescription>
            Cadastre-se para salvar favoritos e acompanhar buscas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={registerAction} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Nome (opcional)
              </label>
              <Input id="name" name="name" type="text" placeholder="Seu nome" autoComplete="name" />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <Input id="email" name="email" type="email" placeholder="seu@email.com" required autoComplete="email" />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Senha
              </label>
              <Input id="password" name="password" type="password" placeholder="Mínimo 6 caracteres" required autoComplete="new-password" />
            </div>
            <Button type="submit" className="w-full">
              Cadastrar
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Já tem conta?{" "}
            <Link href="/entrar" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
              Entrar
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
