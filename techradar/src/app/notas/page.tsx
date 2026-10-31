import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Tag } from "lucide-react";
import Link from "next/link";

interface NotasPageProps {
  searchParams: Promise<{ tag?: string }>;
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export default async function NotasPage({ searchParams }: NotasPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/entrar");
  }

  const { tag } = await searchParams;

  const [notes, tags] = await Promise.all([
    prisma.studyNote.findMany({
      where: {
        userId: session.user.id,
        ...(tag ? { tags: { some: { tag: { slug: tag } } } } : {}),
      },
      include: { tags: { include: { tag: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.tag.findMany({
      where: { userId: session.user.id },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      {/* Cabeçalho + busca */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Caderno de Notas</h1>
          <p className="mt-1 text-sm text-gray-400">
            Anote, organize com tags e vincule notas com [[nota]]
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/notas/nova">
              <Plus className="w-4 h-4 mr-2" /> Nova nota
            </Link>
          </Button>
        </div>
      </div>

      {/* Filtro de tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className={cn(tag ? "bg-blue-600 text-white border-blue-600" : "border-gray-700")}
            asChild
          >
            <Link href="/notas">Todas</Link>
          </Button>
          {tags.map((t) => (
            <Button
              key={t.id}
              variant="outline"
              size="sm"
              className={cn(tag === t.slug ? "bg-blue-600 text-white border-blue-600" : "border-gray-700")}
              asChild
            >
              <Link href={`/notas?tag=${t.slug}`}>
                <Tag className="w-3 h-3 mr-1.5" /> {t.name}
              </Link>
            </Button>
          ))}
        </div>
      )}

      {/* Lista de notas */}
      <div className="space-y-3">
        {notes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-800 bg-gray-900/50 p-8 text-center">
            <p className="text-gray-400">Nenhuma nota encontrada.</p>
            <Button asChild>
              <Link href="/notas/nova">Criar sua primeira nota</Link>
            </Button>
          </div>
        ) : (
          notes.map((note) => (
            <Card key={note.id} className="hover:bg-gray-800/50 transition-colors group">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={`/notas/${note.id}`}
                    className="flex-1 text-sm font-medium text-white hover:text-blue-400"
                  >
                    {note.title}
                  </Link>
                  <div className="flex items-center gap-1">
                    {note.tags.map((nt) => (
                      <Badge key={nt.tagId} variant="outline" className="text-xs">
                        {nt.tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-400 line-clamp-2">
                  {note.markdown.slice(0, 200)}{note.markdown.length > 200 ? "…" : ""}
                </p>
                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <span>{new Date(note.updatedAt).toLocaleDateString("pt-BR")}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
