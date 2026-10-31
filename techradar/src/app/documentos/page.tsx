import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, BookOpen, Upload, Plus } from "lucide-react";
import Link from "next/link";

export default async function DocumentosPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/entrar");
  }

  const documents = await prisma.document.findMany({
    where: { userId: session.user.id },
    include: {
      _count: { select: { highlights: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Documentos</h1>
          <p className="text-sm text-gray-400">
            Livros e materiais em PDF/EPUB na sua biblioteca
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/documentos/upload">
              <Upload className="w-4 h-4 mr-2" /> Upload de arquivo
            </Link>
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {documents.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-800 bg-gray-900/50 p-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-4 text-gray-500">
              <Upload className="w-6 h-6" />
              <span>Nenhum documento ainda</span>
            </div>
            <p className="text-gray-400 text-sm">
              Faça upload de PDFs ou EPUBs para começar a destacar trechos
            </p>
            <Button asChild>
              <Link href="/documentos/upload">Enviar primeiro documento</Link>
            </Button>
          </div>
        ) : (
          documents.map((doc) => (
            <Card key={doc.id} className="hover:bg-gray-800/50 transition-colors group">
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center">
                      {doc.fileType === "pdf" ? (
                        <FileText className="w-6 h-6 text-blue-400" />
                      ) : (
                        <BookOpen className="w-6 h-6 text-purple-400" />
                      )}
                    </div>
                    <div>
                      <Link
                        href={`/documentos/${doc.id}/ler`}
                        className="text-sm font-medium text-white hover:text-blue-400"
                      >
                        {doc.title}
                      </Link>
                      <Badge variant="outline" className="text-[10px]">
                        {doc.fileType.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{doc._count.highlights} destaque(s)</span>
                    <span>{Math.round((doc.fileSize ?? 0) / 1024)} KB</span>
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <Button size="sm" asChild>
                    <Link href={`/documentos/${doc.id}/ler`}>Abrir leitor</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
