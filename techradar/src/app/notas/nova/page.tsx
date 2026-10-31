import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MarkdownEditor } from "@/components/study/markdown-editor";
import Link from "next/link";

export default async function NovaNotaPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/entrar");
  }

  const tags = await prisma.tag.findMany({
    where: { userId: session.user.id },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/notas" className="text-sm text-gray-400 hover:text-white">
          ← Voltar ao caderno
        </Link>
      </div>

      <Card>
        <CardContent className="p-6">
          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Título
              </label>
              <input
                name="title"
                placeholder="Título da nota"
                className="w-full rounded-md border border-gray-700 bg-gray-950 px-4 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-300">Conteúdo (Markdown)</label>
                <div className="flex items-center gap-1 text-[10px] text-gray-500">
                  <span>Use</span> <code className="text-xs text-blue-400 bg-blue-900/30 px-1.5 py-0.5 rounded">[[nota]]</code> <span>para vincular notas</span>
                </div>
              </div>
              <MarkdownEditor value="" onChange={() => {}} placeholder="Escreva sua nota em Markdown..." />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    className="rounded-md border border-gray-700 bg-gray-950 px-3 py-1.5 text-xs text-gray-300 hover:border-blue-500 hover:text-blue-400 transition-colors"
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                Criar nota
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
