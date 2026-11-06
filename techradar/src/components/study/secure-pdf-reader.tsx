"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, ArrowLeft, Save, AlertTriangle, RotateCcw } from "lucide-react";
import Link from "next/link";
import { apiJson } from "@/lib/api-client";

interface SecurePdfReaderProps {
  fileUrl: string;
  libraryId: string;
  title: string;
  currentPage: number | null;
  totalPages: number | null;
}

/**
 * Leitor de PDF seguro.
 *
 * O PDF é carregado em um <iframe sandbox="allow-same-origin"> apontando para a
 * rota protegida /api/library-files/[key]. Como o iframe é mesma-origem, o
 * cookie de sessão é enviado (SameSite=Lax permite requisições GET mesmo-site).
 * Como não usamos `allow-scripts`, scripts embarcados no PDF não executam e o
 * leitor nativo do navegador renderiza o arquivo sem depender de CDN externo.
 *
 * Limitação documentada: por estar dentro de um sandbox sem scripts, a página
 * atual não é detectada automaticamente. O usuário informa o número da página e
 * salva o progresso manualmente via PUT /api/library/[id].
 */
export function SecurePdfReader({
  fileUrl,
  libraryId,
  title,
  currentPage: initialPage,
  totalPages,
}: SecurePdfReaderProps) {
  const [page, setPage] = useState(initialPage ?? 1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const savePage = useCallback(async () => {
    if (!page) return;
    setSaving(true);
    setError(null);
    try {
      // apiJson injeta o header X-CSRF-Token (double-submit cookie) automaticamente.
      await apiJson(`/api/library/${libraryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPage: page }),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao salvar página");
    } finally {
      setSaving(false);
    }
  }, [libraryId, page]);

  const handlePageKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        void savePage();
      }
    },
    [savePage],
  );

  return (
    <div className="flex flex-col h-full">
      <header className="flex h-16 items-center justify-between px-6 border-b border-white/[0.06] bg-[#0a0a0f]/90 backdrop-blur">
        <Link
          href="/biblioteca"
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Biblioteca
        </Link>
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-blue-400" />
          <h1 className="text-sm font-medium text-white truncate max-w-[400px]">
            {title}
          </h1>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4">
        <div className="flex flex-col items-center gap-4">
          {fileUrl ? (
            <>
              <div className="relative w-full max-w-[900px]">
                <iframe
                  src={fileUrl}
                  sandbox="allow-same-origin"
                  referrerPolicy="no-referrer"
                  className="w-full h-[700px] border border-white/[0.06] rounded-xl bg-white/[0.02] shadow-lg"
                  title={`PDF: ${title}`}
                  allowFullScreen
                />
              </div>

              {error && (
                <div className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-xs text-rose-300">
                  <AlertTriangle className="mr-2 h-4 w-4" aria-hidden="true" />
                  {error}
                </div>
              )}

              <div className="flex items-center gap-3">
                <p className="text-xs text-slate-500">
                  Página atual{" "}
                  <span className="ml-1 font-medium text-slate-200">{page}</span>{" "}
                  {totalPages && (
                    <span className="ml-1 text-slate-500">de {totalPages}</span>
                  )}
                </p>
                <Input
                  type="number"
                  min={1}
                  value={String(page)}
                  onChange={(e) =>
                    setPage(Math.max(1, Number(e.target.value) || 1))
                  }
                  onBlur={savePage}
                  onKeyDown={handlePageKeyDown}
                  className="w-24 text-xs"
                  aria-label="Número da página"
                />
                <Button
                  onClick={savePage}
                  disabled={saving}
                  className="text-xs"
                >
                  {saving ? (
                    <RotateCcw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  Salvar página
                </Button>
              </div>

              <p className="text-[10px] text-slate-500 max-w-[900px]">
                O PDF é exibido em iframe sandbox (sem execução de scripts). Como o
                leitor nativo do navegador fica dentro do sandbox, a página não é
                detectada automaticamente — informe o número da página e salve o
                progresso manualmente.
              </p>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <FileText className="mb-3 h-12 w-12 text-slate-500" />
              <p className="text-sm text-slate-400">Arquivo PDF não disponível.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
