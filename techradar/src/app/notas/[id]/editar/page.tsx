import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MarkdownEditor } from "@/components/study/markdown-editor";
import Link from "next/link";
import { z } from "zod";

interface EditarNotaPageProps {
  params: Promise<{ id: string }>;
}

const updateSchema = z.object({
  title: z.string().min(1).max(200),
  markdown: z.string(),
  tagIds: z.array(z.string()).optional(),
});

export default async function EditarNotaPage({ params }: EditarNotaPageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect("/entrar");
  }

  const note = await prisma.studyNote.findFirst({
    where: { id, userId: session.user.id },
    include: { tags: { include: { tag: true } } },
  });

  if (!note) {
    redirect("/notas");
  }

  const tags = await prisma.tag.findMany({
    where: { userId: session.user.id },
    orderBy: { name: "asc" },
  });

  const selectedTagIds = new Set(note.tags.map((nt) => nt.tagId));

  async function save(formData: FormData) {
    const title = formData.get("title") as string;
    const markdown = formData.get("markdown") as string;
    const tagIds = formData.getAll("tagIds") as string[];

    const parsed = updateSchema.safeParse({ title, markdown, tagIds });
    if (!parsed.success) return;

    await prisma.studyNote.update({
      where: { id },
      data: {
        title,
        markdown,
        tags: {
          deleteMany: {},
          create: tagIds.map((tagId) => ({ tagId })),
        },
      },
    });

    redirect(`/notas/${id}`);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link href={`/notas/${id}`} className="text-sm text-gray-400 hover:text-white">
          ← Voltar para a nota
        </Link>
      </div>

      <Card>
        <CardContent className="p-6">
          <form action={save} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Título
              </label>
              <input
                name="title"
                defaultValue={note.title}
                className="w-full rounded-md border border-gray-700 bg-gray-950 px-4 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Conteúdo (Markdown)
              </label>
              <textarea
                name="markdown"
                defaultValue={note.markdown}
                className="w-full h-96 p-4 font-mono text-sm text-gray-300 bg-gray-950 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <label key={tag.id} className="cursor-pointer">
                    <input
                      type="checkbox"
                      name="tagIds"
                      value={tag.id}
                      defaultChecked={selectedTagIds.has(tag.id)}
                      className="sr-only peer"
                    />
                    <div className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
                      selectedTagIds.has(tag.id)
                        ? "border-blue-500 bg-blue-900/30 text-blue-400 border"
                        : "border-gray-700 bg-gray-950 text-gray-300 hover:border-blue-500 hover:text-blue-400"
                    }`}>
                      {tag.name}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                Salvar alterações
              </Button>
              <Button type="button" variant="outline" asChild onClick={() => {}}>
                <Link href={`/notas/${id}`}>Cancelar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
