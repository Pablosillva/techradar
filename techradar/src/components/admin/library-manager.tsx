"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  FileText,
  Loader2,
  Music2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/roadmap/modal";
import { apiFetch, apiJson } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface AdminOwner {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
}

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
  owners: AdminOwner[];
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
    <Badge variant={variants[status] ?? "secondary"}>{labels[status] ?? status}</Badge>
  );
}

/** Só permite links internos (/...) ou http/https; nunca javascript:/data:. */
function safeHref(value: string | null): string | null {
  if (!value) return null;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function nullableNumber(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function optionalNumber(value: FormDataEntryValue | null): number | undefined {
  const text = String(value ?? "").trim();
  if (!text) return undefined;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function LibraryManager({ initialItems, owners }: LibraryManagerProps) {
  const router = useRouter();
  const [items, setItems] = useState<AdminLibraryItem[]>(initialItems);
  const [message, setMessage] = useState<{ text: string; tone: "success" | "error" }>({
    text: "",
    tone: "success",
  });
  const [saving, setSaving] = useState<string | null>(null);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [editItem, setEditItem] = useState<AdminLibraryItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<AdminLibraryItem | null>(null);

  function show(text: string, tone: "success" | "error" = "success") {
    setMessage({ text, tone });
    setTimeout(() => setMessage({ text: "", tone: "success" }), 4500);
  }

  async function refreshItems() {
    const data = await apiJson<AdminLibraryItem[]>("/api/admin/library");
    setItems(Array.isArray(data) ? data : []);
  }

  // ─── Upload ──────────────────────────────────────────────────────────────
  async function handleUpload(form: HTMLFormElement) {
    const formData = new FormData(form);
    const file = formData.get("file") as File | null;
    const title = String(formData.get("title") ?? "").trim();
    const author = String(formData.get("author") ?? "").trim();
    const itemType = String(formData.get("itemType") ?? "pdf");
    const userId = String(formData.get("userId") ?? "").trim();

    if (!file || !title || !userId) {
      show("Preencha arquivo, título e usuário dono.", "error");
      return;
    }

    setSaving("upload");

    const uploadForm = new FormData();
    uploadForm.append("file", file);
    uploadForm.append("title", title);
    uploadForm.append("itemType", itemType);
    uploadForm.append("userId", userId);
    if (author) uploadForm.append("author", author);

    try {
      // apiFetch injeta o header X-CSRF-Token; FormData mantém o boundary.
      const response = await apiFetch("/api/admin/library/upload", {
        method: "POST",
        body: uploadForm,
      });
      const body = (await response.json().catch(() => null)) as
        | { data?: unknown; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(body?.error ?? "Falha no upload");
      }

      await refreshItems();
      show("Arquivo enviado com sucesso.");
      setUploadOpen(false);
      router.refresh();
    } catch (error) {
      show(error instanceof Error ? error.message : "Erro inesperado.", "error");
    } finally {
      setSaving(null);
    }
  }

  // ─── Editar ──────────────────────────────────────────────────────────────
  async function handleSaveEdit(form: HTMLFormElement, item: AdminLibraryItem) {
    const data = new FormData(form);
    const payload: Record<string, unknown> = {
      title: String(data.get("title") ?? "").trim(),
      author: String(data.get("author") ?? "").trim() || null,
      status: String(data.get("status") ?? item.status),
      notes: String(data.get("notes") ?? "").trim() || null,
      totalPages: nullableNumber(data.get("totalPages")),
      durationSec: nullableNumber(data.get("durationSec")),
      currentPage: optionalNumber(data.get("currentPage")),
      positionSec: optionalNumber(data.get("positionSec")),
      progress: optionalNumber(data.get("progress")),
      rating: nullableNumber(data.get("rating")),
    };

    setSaving(`library-${item.id}`);
    try {
      const updated = await apiJson<Partial<AdminLibraryItem>>(
        `/api/admin/library/${item.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      setItems((prev) =>
        prev.map((entry) => (entry.id === item.id ? { ...entry, ...payload, ...updated } : entry)),
      );
      show("Item atualizado com sucesso.");
      setEditItem(null);
      router.refresh();
    } catch (error) {
      show(error instanceof Error ? error.message : "Erro inesperado.", "error");
    } finally {
      setSaving(null);
    }
  }

  async function handleDelete() {
    if (!deleteItem) return;

    setSaving(`library-delete-${deleteItem.id}`);
    try {
      await apiJson(`/api/admin/library/${deleteItem.id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((entry) => entry.id !== deleteItem.id));
      show("Item e arquivo removidos.");
      setDeleteItem(null);
      router.refresh();
    } catch (error) {
      show(error instanceof Error ? error.message : "Erro inesperado.", "error");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Biblioteca (admin)</h2>
          <p className="text-sm text-slate-400">
            Envie PDFs/audiobooks com validação de magic number e acesso restrito ao
            dono ou administrador.
          </p>
        </div>
        <Button
          type="button"
          variant="glow"
          onClick={() => setUploadOpen(true)}
          disabled={owners.length === 0}
        >
          <Plus className="h-4 w-4" /> Enviar arquivo
        </Button>
      </div>

      {message.text && (
        <div
          className={cn(
            "rounded-lg border px-4 py-3 text-sm",
            message.tone === "success"
              ? "border-emerald-400/25 bg-[#0b1f1a]/50 text-emerald-200"
              : "border-rose-400/25 bg-[#241016]/50 text-rose-200",
          )}
          role={message.tone === "error" ? "alert" : "status"}
        >
          {message.text}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-white/[0.06] bg-white/[0.02]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.04] bg-white/[0.02]">
              <th className="px-5 py-3 text-left font-medium text-slate-400">Título</th>
              <th className="px-5 py-3 text-left font-medium text-slate-400">Tipo</th>
              <th className="px-5 py-3 text-left font-medium text-slate-400">Dono</th>
              <th className="px-5 py-3 text-left font-medium text-slate-400">Status</th>
              <th className="px-5 py-3 text-right font-medium text-slate-400">Progresso</th>
              <th className="px-5 py-3 text-right font-medium text-slate-400">Tamanho</th>
              <th className="px-5 py-3 text-right font-medium text-slate-400">Ações</th>
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
              items.map((item) => {
                const href = safeHref(item.fileUrl);

                return (
                  <tr key={item.id} className="transition-colors hover:bg-white/[0.02]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {item.itemType === "audiobook" ? (
                          <Music2 className="h-4 w-4 text-slate-500" />
                        ) : (
                          <FileText className="h-4 w-4 text-slate-500" />
                        )}
                        <div
                          className="max-w-xs truncate font-medium text-slate-200"
                          title={item.title ?? ""}
                        >
                          {item.title ?? "—"}
                        </div>
                      </div>
                      {item.author && (
                        <p className="mt-1 text-xs text-slate-500">{item.author}</p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs uppercase tracking-wider text-slate-400">
                        {item.itemType}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-slate-200">{item.owner?.email ?? "—"}</div>
                      {item.owner?.name && (
                        <span className="text-xs text-slate-500">{item.owner.name}</span>
                      )}
                    </td>
                    <td className="px-5 py-4">{statusBadge(item.status)}</td>
                    <td className="px-5 py-4 text-right">
                      <span className="font-semibold text-slate-200">{item.progress}%</span>
                    </td>
                    <td className="px-5 py-4 text-right text-slate-400">
                      {formatBytes(item.fileSize)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {href && (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-md border border-cyan-400/20 bg-cyan-400/[0.06] px-2 py-1 text-[10px] font-medium text-cyan-300 transition-colors hover:bg-cyan-400/10"
                            title="Abrir arquivo (acesso restrito)"
                          >
                            <Download className="h-3 w-3" /> Abrir
                          </a>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditItem(item)}
                          disabled={saving === `library-${item.id}`}
                          className="text-slate-400 hover:text-slate-200"
                          title="Editar metadados e progresso"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteItem(item)}
                          disabled={saving === `library-delete-${item.id}`}
                          className="text-slate-400 hover:bg-rose-500/10 hover:text-rose-300"
                          title="Excluir item e arquivo"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Upload */}
      <Modal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Enviar PDF ou áudio"
        description="O tipo real é validado pelo cabeçalho binário (magic number), não pela extensão."
        size="lg"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleUpload(event.currentTarget);
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">
              Arquivo (PDF, MP3, M4A, OGG, WAV, FLAC)
            </label>
            <input
              type="file"
              name="file"
              required
              accept=".pdf,.mp3,.m4a,.ogg,.wav,.flac"
              className="block w-full text-sm text-slate-400 file:mr-3 file:rounded-lg file:border file:border-white/[0.06] file:bg-white/[0.02] file:px-3 file:py-1.5 file:text-slate-200 hover:file:bg-white/[0.05]"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Título</label>
              <Input name="title" required maxLength={200} autoFocus />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Autor (opcional)</label>
              <Input name="author" maxLength={200} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Tipo</label>
              <Select name="itemType" defaultValue="pdf">
                <option value="pdf">Livro / PDF</option>
                <option value="audiobook">Audiobook</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Usuário dono</label>
              <Select name="userId" defaultValue={owners[0]?.id ?? ""} required>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name ?? owner.email ?? owner.id}
                    {owner.email ? ` — ${owner.email}` : ""}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Limites: PDF até 100 MB, áudio até 300 MB. O arquivo fica fora de
            <code className="mx-1 rounded bg-white/[0.06] px-1">public/</code> e só é
            servido por rota autenticada.
          </p>

          <div className="flex flex-col-reverse gap-2 border-t border-white/[0.06] pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setUploadOpen(false)}
              disabled={saving === "upload"}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving === "upload"}>
              {saving === "upload" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Enviar arquivo
            </Button>
          </div>
        </form>
      </Modal>

      {/* Editar */}
      <Modal
        open={editItem !== null}
        onClose={() => setEditItem(null)}
        title="Editar item da biblioteca"
        description="Metadados e progresso de leitura/escuta."
        size="lg"
      >
        {editItem && (
          <form
            key={editItem.id}
            onSubmit={(event) => {
              event.preventDefault();
              void handleSaveEdit(event.currentTarget, editItem);
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Título</label>
                <Input
                  name="title"
                  required
                  maxLength={200}
                  defaultValue={editItem.title ?? ""}
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Autor</label>
                <Input name="author" maxLength={200} defaultValue={editItem.author ?? ""} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Status</label>
                <Select name="status" defaultValue={editItem.status}>
                  <option value="to_read">Para ler</option>
                  <option value="reading">Lendo</option>
                  <option value="completed">Concluído</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Progresso (%)</label>
                <Input
                  name="progress"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={editItem.progress}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Avaliação (1-5)</label>
                <Input
                  name="rating"
                  type="number"
                  min={1}
                  max={5}
                  defaultValue={editItem.rating ?? ""}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Página atual</label>
                <Input
                  name="currentPage"
                  type="number"
                  min={0}
                  defaultValue={editItem.currentPage ?? ""}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Total de páginas</label>
                <Input
                  name="totalPages"
                  type="number"
                  min={0}
                  defaultValue={editItem.totalPages ?? ""}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Posição do áudio (segundos)
                </label>
                <Input
                  name="positionSec"
                  type="number"
                  min={0}
                  defaultValue={editItem.positionSec ?? ""}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Duração do áudio (segundos)
                </label>
                <Input
                  name="durationSec"
                  type="number"
                  min={0}
                  defaultValue={editItem.durationSec ?? ""}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Notas</label>
              <Textarea name="notes" rows={3} maxLength={20000} defaultValue={editItem.notes ?? ""} />
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-white/[0.06] pt-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditItem(null)}
                disabled={saving === `library-${editItem.id}`}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving === `library-${editItem.id}`}>
                {saving === `library-${editItem.id}` ? (
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
      <Modal
        open={deleteItem !== null}
        onClose={() => setDeleteItem(null)}
        title="Excluir item da biblioteca?"
        description="O registro e o arquivo físico serão removidos permanentemente."
        size="sm"
      >
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => setDeleteItem(null)}
            disabled={saving === `library-delete-${deleteItem?.id}`}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={saving === `library-delete-${deleteItem?.id}`}
          >
            {saving === `library-delete-${deleteItem?.id}` ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Excluir
          </Button>
        </div>
      </Modal>
    </div>
  );
}
