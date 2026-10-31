import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileText, BookOpen } from "lucide-react";

export default async function UploadPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/entrar");
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Upload de documento</h1>
        <p className="mt-1 text-sm text-gray-400">
          Envie um PDF ou EPUB para sua biblioteca pessoal
        </p>
      </div>

      <Card>
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <Upload className="w-12 h-12 text-blue-400" />
            <p className="text-sm font-medium text-white">Clique ou arraste um arquivo aqui</p>
            <p className="text-xs text-gray-500">
              Formatos suportados: PDF, EPUB • Máx. 50 MB
            </p>
          </div>

          <div className="mt-6">
            <input
              type="file"
              accept=".pdf,.epub"
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
            />
          </div>

          <div className="mt-6">
            <Button variant="outline" asChild>
              <a href="/documentos">Voltar aos documentos</a>
            </Button>
          </div>

          <div className="mt-4 p-4 rounded-lg border border-dashed border-gray-700 bg-gray-900/30 text-xs text-gray-400">
            <p className="mb-2">
              <strong>Nota:</strong> O armazenamento de arquivos requer configuração de
              bucket (Supabase Storage ou Cloudflare R2). Por enquanto, você pode
              registrar documentos por URL na API.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
