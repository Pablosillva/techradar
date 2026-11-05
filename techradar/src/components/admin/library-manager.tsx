"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Music2, Plus, Pencil, Trash2, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/roadmap/modal";
import { cn } from "@/lib/utils";

interface AdminLibraryItem {
  id: string;
  userId: string;
  owner: { id: string; name: string | null; email: string | null } | null;
  itemType: string;
  title: string | null;
  author: string | null;
  status: string;
  progress: number;
  currentPage: number | null;
  totalPages: number | null;
  positionSec: number | null;
  durationSec: number | null;
  rating: number | null;
  fileUrl: string | null;
  fileKey: string | null;
  mimeType: string | null;
  fileSize: number | null;
  coverUrl: string | null;
  notes: string | null;
  lastAccessedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface LibraryManagerProps {
  initialItems: AdminLibraryItem[];
}

function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(1)} ${units[unit]}`;
}

function statusBadge(status: string) {
  const variants: Record<string, "success" | "warning" | "default" | "secondary"> = {
    to_read: "secondary",
    reading: "default",
    completed: "success",
  };
  const labels: Record<string, string> = {
    to_read: "Para ler",
    reading: "Lendo",
    completed: "Concluído",
  };
  return (
    <Badge variant={variants[status] ?? "secondary"}>
      {labels[status] ?? status}
    </Badge>
  );
}

async function apiRequest(url: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  const body = (await response.json().catch(() => null)) as
    | { data?: unknown; error?: string }
    | null;
  if (!response.ok) {
    throw new Error(body?.error ?? "Erro na requisição");
  }
  return body?.data;
}

export function LibraryManager({ initialItems }: LibraryManagerProps) {
  const router = useRouter();
  const [items, setItems] = useState<AdminLibraryItem[]>(initialItems);
  const [message, setMessage] = useState<{ text: string; tone: "success" | "error" }>({
    text: "",
    tone: "success",
  });
  const [saving, setSaving] = useState<string | null>(null);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [editOpen, setEditOpen] = useState<AdminLibraryItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function show(text: string, tone: "success" | "error" = "success") {
    setMessage({ text, tone });
    setTimeout(() => setMessage({ text: "", tone: "success" }), 4000);
  }

  async function run(key: string, action: () => Promise<unknown>, onSuccess: () => void) {
    if (saving) return;
    setSaving(key);
    try {
      await action();
      show("Salvo com sucesso.");
      onSuccess();
      router.refresh();
    } catch (error) {
      show(error instanceof Error ? error.message : "Erro inesperado.", "error");
    } finally {
      setSaving(null);
    }
  }

  useEffect(() => {
    apiRequest("/api/admin/library").then((data: any) => {
      setItems(Array.isArray(data) ? data : []);
    });
  }, []);

  // ---------- Upload ----------
  async function handleUpload(form: HTMLFormElement) {
    const formData = new FormData(form);
    const file = formData.get("file") as File | null;
    const title = String(formData.get("title") ?? "").trim();
    const itemType = String(formData.get("itemType") ?? "pdf");
    const userId = String(formData.get("userId") ?? "").trim();

    if (!file || !title || !userId) {
      show("Preencha arquivo, título e usuário dono.", "error");
      return;
    }

    if (saving) return;
    setSaving("upload");

    const uploadForm = new FormData();
    uploadForm.append("file", file);
    uploadForm.append("title", title);
    uploadForm.append("itemType", itemType);
    uploadForm.append("userId", userId);

    try {
      const response = await fetch("/api/admin/library/upload", {
        method: "POST",
        body: uploadForm,
      });
      const body = (await response.json().catch(() => null)) as
        | { data?: unknown; error?: string }
        | null;
      if (!response.ok) {
        throw new Error(body?.error ?? "Falha no upload");
      }
      show("Arquivo enviado com sucesso.");
      setUploadOpen(false);
      router.refresh();
    } catch (error) {
      show(error instanceof Error ? error.message : "Erro inesperado.", "error");
    } finally {
      setSaving(null);
    }
  }

  // ---------- Editar ----------
  async function handleSaveEdit(form: HTMLFormElement, item: AdminLibraryItem) {
    const data = new FormData(form);
    const payload: Record<string, unknown> = {};
    const status = String(data.get("status") ?? "");
    const progress = String(data.get("progress") ?? "");
    const rating = String(data.get("rating") ?? "");
    const notes = String(data.get("notes") ?? "").trim();
    const currentPage = String(data.get("currentPage") ?? "");

    if (status) payload.status = status;
    if (progress !== "") payload.progress = Number(progress);
    if (rating !== "") payload.rating = Number(rating);
    if (notes !== undefined) payload.notes = notes || null;
    if (currentPage !== "") payload.currentPage = Number(currentPage);

    await run(
      `library-${item.id}`,
      () =>
        apiRequest(`/api/admin/library/${item.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        }),
      () => {
        setEditOpen(null);
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, ...payload } : i))
        );
      }
    );
  }

  async function handleDelete() {
    if (!deleteId) return;
    await run(
      `library-delete-${deleteId}`,
      () => apiRequest(`/api/admin/library/${deleteId}`, { method: "DELETE" }),
      () => {
        setItems((prev) => prev.filter((i) => i.id !== deleteId));
        setDeleteId(null);
      }
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Biblioteca (admin)</h2>
          <p className="text-sm text-slate-400">
            Gerencie livros, PDFs e audiobooks de todos os usuários.
          </p>
        </div>
        <Button type="button" variant="glow" onClick={() => setUploadOpen(true)}>
          <Plus className="h-4 w-4" /> Enviar arquivo
        </Button>
      </div>

      {message.text && (
        <div
          className={cn(
            "rounded-lg border px-4 py-3 text-sm",
            message.tone === "success"
              ? "border-emerald-400/25 bg-[#0b1f1a]/50 text-emerald-200"
              : "border-rose-400/25 bg-[#241016]/50 text-rose-200"
          )}
          role={message.tone === "error" ? "alert" : "status"}
        >
          {message.text}
        </div>
      )}

      <div className="overflow-x-auto border border-white/[0.06] rounded-xl bg-white/[0.02]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.04] bg-white/[0.02]">
              <th className="text-left px-5 py-3 text-slate-400 font-medium">Título</th>
              <th className="text-left px-5 py-3 text-slate-400 font-medium">Tipo</th>
              <th className="text-left px-5 py-3 text-slate-400 font-medium">Dono</th>
              <th className="text-left px-5 py-3 text-slate-400 font-medium">Status</th>
              <th className="text-right px-5 py-3 text-slate-400 font-medium">Progresso</th>
              <th className="text-right px-5 py-3 text-slate-400 font-medium">Tamanho</th>
              <th className="text-right px-5 py-3 text-slate-400 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                  Nenhum item na biblioteca.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {item.itemType === "audiobook" ? (
                        <Music2 className="h-4 w-4 text-slate-500" />
                      ) : (
                        <FileText className="h-4 w-4 text-slate-500" />
                      )}
                      <div className="font-medium text-slate-200 truncate" title={item.title ?? ""}>
                        {item.title ?? "—"}
                      </div>
                    </div>
                    {item.author && <p className="mt-1 text-xs text-slate-500">{item.author}</p>}
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs text-slate-400 uppercase tracking-wider">
                      {item.itemType}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-slate-200">{item.owner?.email ?? "—"}</div>
                    {item.owner?.name && <span className="text-xs text-slate-500">{item.owner.name}</span>}
                  </td>
                  <td className="px-5 py-4">{statusBadge(item.status)}</td>
                  <td className="px-5 py-4 text-right">
                    <span className="font-semibold text-slate-200">{item.progress}%</span>
                  </td>
                  <td className="px-5 py-4 text-right text-slate-400">
                    {formatBytes(item.fileSize)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {item.fileKey && (
                        <a
                          href={item.fileUrl ?? ""}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md border border-cyan-400/20 bg-cyan-400/[0.06] px-2 py-1 text-[10px] font-medium text-cyan-300 transition-colors hover:bg-cyan-400/10"
                          title="Abrir/baixar arquivo"
                        >
                          <Download className="h-3 w-3" /> Abrir
                        </a>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditOpen(item)}
                        disabled={saving?.startsWith(`library-${item.id}`)}
                        className="text-slate-400 hover:text-slate-200"
                        title="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(item.id)}
                        disabled={saving === `library-delete-${item.id}`}
                        className="text-slate-400 hover:bg-rose-500/10 hover:text-rose-300"
                        title="Excluir"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Upload */}
      <Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="Enviar PDF ou áudio" description="O tipo real do arquivo é validado pelo cabeçalho binário (magic number), não pela extensão." size="lg">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleUpload(e.currentTarget);
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Arquivo (PDF, MP3, M4A, OGG, WAV, FLAC)</label>
            <input
              type="file"
              name="file"
              required
              accept=".pdf,.mp3,.m4a,.ogg,.wav,.flac"
              className="block w-full text-sm text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-white/[0.06] file:bg-white/[0.02] file:text-slate-200 hover:file:bg-white/[0.05]"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Título</label>
              <Input name="title" required maxLength={200} autoFocus />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Tipo</label>
              <Select name="itemType" defaultValue="pdf">
                <option value="pdf">Livro / PDF</option>
                <option value="audiobook">Audiobook</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">ID do usuário dono</label>
              <Input name="userId" required placeholder="ID do usuário" />
              <p className="text-[10px] text-slate-500">O item será vinculado a este usuário.</p>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Limites: PDF até 100 MB, áudio até 300 MB. Acesso ao arquivo restrito ao dono ou admin.
          </p>
          <div className="flex flex-col-reverse gap-2 border-t border-white/[0.06] pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setUploadOpen(false)} disabled={saving === "upload"}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving === "upload"}>
              {saving === "upload" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Enviar arquivo
            </Button>
          </div>
        </form>
      </Modal>

      {/* Editar */}
      <Modal open={editOpen !== null} onClose={() => setEditOpen(null)} title="Editar item da biblioteca" size="lg">
        {editOpen && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveEdit(e.currentTarget, editOpen);
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Status</label>
                <Select name="status" defaultValue={editOpen.status}>
                  <option value="to_read">Para ler</option>
                  <option value="reading">Lendo</option>
                  <option value="completed">Concluído</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Progresso (%)</label>
                <Input name="progress" type="number" min={0} max={100} defaultValue={String(editOpen.progress ?? "")} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Avaliação (1-5)</label>
                <Input name="rating" type="number" min={1} max={5} defaultValue={String(editOpen.rating ?? "")} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Página atual</label>
                <Input name="currentPage" type="number" min={0} defaultValue={String(editOpen.currentPage ?? "")} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Notas</label>
              <Textarea name="notes" rows={3} defaultValue={editOpen.notes ?? ""} />
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-white/[0.06] pt-4 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setEditOpen(null)} disabled={saving?.startsWith(`library-${editOpen.id}`)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving?.startsWith(`library-${editOpen.id}`)}>
                {saving?.startsWith(`library-${editOpen.id}`) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Pencil className="h-4 w-4" />
                )}
                Salvar
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Excluir */}
      <Modal open={deleteId !== null} onClose={() => setDeleteId(null)} title="Excluir item da biblioteca?" description="O arquivo e o registro serão removidos." size="sm">
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => setDeleteId(null)} disabled={saving?.startsWith("library-delete")}>
            Cancelar
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={saving === `library-delete-${deleteId}`}>
            {saving === `library-delete-${deleteId}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Excluir
          </Button>
        </div>
      </Modal>
    </div>
  );
}
