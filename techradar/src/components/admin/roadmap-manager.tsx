"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ExternalLink,
  FileText,
  Link2,
  Loader2,
  Pencil,
  Plus,
  Target,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/roadmap/modal";
import { STATUS_META } from "@/lib/roadmap/presentation";
import type {
  RoadmapItemStatus,
  StudyContentType,
} from "@/lib/roadmap/types";
import { apiJson } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface AdminOwner {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
}

interface AdminRoadmap {
  id: string;
  title: string;
  description: string | null;
  goal: string | null;
  level: string;
  color: string | null;
  order: number;
  isArchived: boolean;
  owner: { id: string; name: string | null; email: string | null } | null;
  itemCount: number;
  completedCount: number;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

interface AdminContent {
  id: string;
  title: string;
  type: StudyContentType;
  content: string | null;
  url: string | null;
  order: number;
}

interface AdminItem {
  id: string;
  title: string;
  description: string | null;
  status: RoadmapItemStatus;
  order: number;
  estimatedMinutes: number | null;
  resourceUrl: string | null;
  contents: AdminContent[];
}

interface RoadmapDetail {
  id: string;
  title: string;
  items: Array<
    Omit<AdminItem, "contents"> & {
      contents?: Array<Omit<AdminContent, "type"> & { type: string }>;
    }
  >;
}

interface RoadmapManagerProps {
  initialRoadmaps: AdminRoadmap[];
  owners: AdminOwner[];
}

const LEVEL_LABELS: Record<string, string> = {
  beginner: "Iniciante",
  intermediate: "Intermediário",
  advanced: "Avançado",
};

const CONTENT_TYPE_LABELS: Record<StudyContentType, string> = {
  NOTE: "Nota",
  LINK: "Link",
  VIDEO: "Vídeo",
  ARTICLE: "Artigo",
  PDF: "PDF",
};

const STATUS_DOT: Record<RoadmapItemStatus, string> = {
  NOT_STARTED: "bg-slate-500",
  IN_PROGRESS: "bg-cyan-400",
  COMPLETED: "bg-emerald-400",
  NEEDS_REVIEW: "bg-amber-400",
};

function toNullableString(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? "").trim();
  return text ? text : null;
}

function toOptionalNumber(value: FormDataEntryValue | null): number | undefined {
  const text = String(value ?? "").trim();
  if (!text) return undefined;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function RoadmapManager({ initialRoadmaps, owners }: RoadmapManagerProps) {
  const router = useRouter();
  const [roadmaps, setRoadmaps] = useState<AdminRoadmap[]>(initialRoadmaps);
  const [message, setMessage] = useState<{ text: string; tone: "success" | "error" }>({
    text: "",
    tone: "success",
  });
  const [saving, setSaving] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editRoadmap, setEditRoadmap] = useState<AdminRoadmap | null>(null);
  const [deleteRoadmap, setDeleteRoadmap] = useState<AdminRoadmap | null>(null);

  const [manageId, setManageId] = useState<string | null>(null);
  const [detailItems, setDetailItems] = useState<AdminItem[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const [itemModal, setItemModal] = useState<{ item: AdminItem | null } | null>(null);
  const [itemDelete, setItemDelete] = useState<AdminItem | null>(null);
  const [contentModal, setContentModal] = useState<{
    itemId: string;
    content: AdminContent | null;
  } | null>(null);
  const [contentDelete, setContentDelete] = useState<{
    itemId: string;
    content: AdminContent;
  } | null>(null);

  const manageRoadmap = roadmaps.find((roadmap) => roadmap.id === manageId) ?? null;

  function show(text: string, tone: "success" | "error" = "success") {
    setMessage({ text, tone });
    setTimeout(() => setMessage({ text: "", tone: "success" }), 4500);
  }

  async function run(
    key: string,
    action: () => Promise<unknown>,
    onSuccess?: () => void,
  ) {
    if (saving) return;
    setSaving(key);
    try {
      await action();
      show("Alteração salva com sucesso.");
      onSuccess?.();
      router.refresh();
    } catch (error) {
      show(error instanceof Error ? error.message : "Erro inesperado.", "error");
    } finally {
      setSaving(null);
    }
  }

  // ─── Carregamento de itens/conteúdos ─────────────────────────────────────
  useEffect(() => {
    if (!manageId) {
      setDetailItems([]);
      return;
    }

    let cancelled = false;
    setDetailLoading(true);

    apiJson<RoadmapDetail>(`/api/admin/roadmaps/${manageId}`)
      .then((data) => {
        if (cancelled) return;
        setDetailItems(
          (data.items ?? []).map((item) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            status: item.status,
            order: item.order,
            estimatedMinutes: item.estimatedMinutes,
            resourceUrl: item.resourceUrl,
            contents: (item.contents ?? []).map((content) => ({
              id: content.id,
              title: content.title,
              type: content.type as StudyContentType,
              content: content.content,
              url: content.url,
              order: content.order,
            })),
          })),
        );
      })
      .catch((error) => {
        if (!cancelled) {
          show(
            error instanceof Error ? error.message : "Falha ao carregar a trilha.",
            "error",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manageId]);

  // Mantém os contadores da trilha sincronizados com os itens carregados.
  useEffect(() => {
    if (!manageId || detailLoading) return;

    setRoadmaps((prev) =>
      prev.map((roadmap) => {
        if (roadmap.id !== manageId) return roadmap;
        const total = detailItems.length;
        const completed = detailItems.filter((item) => item.status === "COMPLETED").length;
        return {
          ...roadmap,
          itemCount: total,
          completedCount: completed,
          progress: total === 0 ? 0 : Math.round((completed / total) * 100),
        };
      }),
    );
  }, [detailItems, detailLoading, manageId]);

  // ─── Trilhas ─────────────────────────────────────────────────────────────
  async function handleCreateRoadmap(form: HTMLFormElement) {
    const data = new FormData(form);
    const userId = String(data.get("userId") ?? "").trim();

    if (!userId) {
      show("Selecione o usuário dono da trilha.", "error");
      return;
    }

    const payload = {
      userId,
      title: String(data.get("title") ?? "").trim(),
      description: toNullableString(data.get("description")),
      goal: toNullableString(data.get("goal")),
      level: String(data.get("level") ?? "beginner"),
      color: toNullableString(data.get("color")),
      order: toOptionalNumber(data.get("order")),
    };

    await run("roadmap-create", async () => {
      const created = await apiJson<{
        id: string;
        title: string;
        description: string | null;
        goal: string | null;
        level: string;
        color: string | null;
        order: number;
        createdAt: string;
        updatedAt: string;
      }>("/api/admin/roadmaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const owner = owners.find((entry) => entry.id === userId) ?? null;

      setRoadmaps((prev) => [
        ...prev,
        {
          ...created,
          isArchived: false,
          owner: owner
            ? { id: owner.id, name: owner.name, email: owner.email }
            : null,
          itemCount: 0,
          completedCount: 0,
          progress: 0,
        },
      ]);
      setCreateOpen(false);
    });
  }

  async function handleUpdateRoadmap(form: HTMLFormElement, roadmap: AdminRoadmap) {
    const data = new FormData(form);
    const payload = {
      title: String(data.get("title") ?? "").trim(),
      description: toNullableString(data.get("description")),
      goal: toNullableString(data.get("goal")),
      level: String(data.get("level") ?? "beginner"),
      color: toNullableString(data.get("color")),
      order: toOptionalNumber(data.get("order")) ?? roadmap.order,
      isArchived: data.get("isArchived") === "on",
    };

    await run(`roadmap-${roadmap.id}`, async () => {
      const updated = await apiJson<Partial<AdminRoadmap>>(
        `/api/admin/roadmaps/${roadmap.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      setRoadmaps((prev) =>
        prev.map((entry) =>
          entry.id === roadmap.id ? { ...entry, ...payload, ...updated } : entry,
        ),
      );
      setEditRoadmap(null);
    });
  }

  async function handleDeleteRoadmap() {
    if (!deleteRoadmap) return;

    await run(
      `roadmap-delete-${deleteRoadmap.id}`,
      () => apiJson(`/api/admin/roadmaps/${deleteRoadmap.id}`, { method: "DELETE" }),
      () => {
        setRoadmaps((prev) => prev.filter((entry) => entry.id !== deleteRoadmap.id));
        if (manageId === deleteRoadmap.id) setManageId(null);
        setDeleteRoadmap(null);
      },
    );
  }

  // ─── Itens ───────────────────────────────────────────────────────────────
  async function handleSaveItem(form: HTMLFormElement) {
    if (!manageId || !itemModal) return;
    const data = new FormData(form);
    const editing = itemModal.item;

    const payload = {
      title: String(data.get("title") ?? "").trim(),
      description: toNullableString(data.get("description")),
      status: String(data.get("status") ?? "NOT_STARTED"),
      estimatedMinutes: toOptionalNumber(data.get("estimatedMinutes")),
      resourceUrl: toNullableString(data.get("resourceUrl")),
      order: toOptionalNumber(data.get("order")),
    };

    const key = editing ? `item-${editing.id}` : "item-create";

    await run(key, async () => {
      const saved = await apiJson<Omit<AdminItem, "contents">>(
        editing
          ? `/api/admin/roadmap-items/${editing.id}`
          : `/api/admin/roadmaps/${manageId}/items`,
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      setDetailItems((prev) => {
        if (editing) {
          return prev.map((item) =>
            item.id === editing.id
              ? {
                  ...item,
                  ...saved,
                  status: saved.status as RoadmapItemStatus,
                  contents: item.contents,
                }
              : item,
          );
        }

        return [
          ...prev,
          {
            ...saved,
            status: saved.status as RoadmapItemStatus,
            contents: [],
          },
        ];
      });
      setItemModal(null);
    });
  }

  async function handleItemStatus(item: AdminItem, status: RoadmapItemStatus) {
    await run(
      `item-status-${item.id}`,
      async () => {
        const saved = await apiJson<Omit<AdminItem, "contents">>(
          `/api/admin/roadmap-items/${item.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
          },
        );

        setDetailItems((prev) =>
          prev.map((entry) =>
            entry.id === item.id
              ? { ...entry, status: saved.status as RoadmapItemStatus }
              : entry,
          ),
        );
      },
    );
  }

  async function handleDeleteItem() {
    if (!itemDelete) return;

    await run(
      `item-delete-${itemDelete.id}`,
      () => apiJson(`/api/admin/roadmap-items/${itemDelete.id}`, { method: "DELETE" }),
      () => {
        setDetailItems((prev) => prev.filter((entry) => entry.id !== itemDelete.id));
        setItemDelete(null);
      },
    );
  }

  // ─── Conteúdos ───────────────────────────────────────────────────────────
  async function handleSaveContent(form: HTMLFormElement) {
    if (!contentModal) return;
    const data = new FormData(form);
    const editing = contentModal.content;

    const payload = {
      title: String(data.get("title") ?? "").trim(),
      type: String(data.get("type") ?? "NOTE"),
      content: toNullableString(data.get("content")),
      url: toNullableString(data.get("url")),
      order: toOptionalNumber(data.get("order")),
    };

    const key = editing ? `content-${editing.id}` : `content-create-${contentModal.itemId}`;

    await run(key, async () => {
      const saved = await apiJson<Omit<AdminContent, "type"> & { type: string }>(
        editing
          ? `/api/admin/study-contents/${editing.id}`
          : `/api/admin/roadmap-items/${contentModal.itemId}/contents`,
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const normalized: AdminContent = {
        ...saved,
        type: saved.type as StudyContentType,
      };

      setDetailItems((prev) =>
        prev.map((item) => {
          if (item.id !== contentModal.itemId) return item;
          return {
            ...item,
            contents: editing
              ? item.contents.map((entry) =>
                  entry.id === editing.id ? normalized : entry,
                )
              : [...item.contents, normalized],
          };
        }),
      );
      setContentModal(null);
    });
  }

  async function handleDeleteContent() {
    if (!contentDelete) return;

    await run(
      `content-delete-${contentDelete.content.id}`,
      () =>
        apiJson(`/api/admin/study-contents/${contentDelete.content.id}`, {
          method: "DELETE",
        }),
      () => {
        setDetailItems((prev) =>
          prev.map((item) =>
            item.id === contentDelete.itemId
              ? {
                  ...item,
                  contents: item.contents.filter(
                    (entry) => entry.id !== contentDelete.content.id,
                  ),
                }
              : item,
          ),
        );
        setContentDelete(null);
      },
    );
  }

  const busyRoadmapForm =
    saving === "roadmap-create" || saving?.startsWith("roadmap-");

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Gerenciar trilhas</h2>
          <p className="text-sm text-slate-400">
            Crie, edite e exclua trilhas, itens e conteúdos de qualquer usuário.
          </p>
        </div>
        <Button
          type="button"
          variant="glow"
          onClick={() => setCreateOpen(true)}
          disabled={owners.length === 0}
        >
          <Plus className="h-4 w-4" /> Nova trilha
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
              <th className="px-5 py-3 text-left font-medium text-slate-400">Dono</th>
              <th className="px-5 py-3 text-left font-medium text-slate-400">Nível</th>
              <th className="px-5 py-3 text-right font-medium text-slate-400">Itens</th>
              <th className="px-5 py-3 text-right font-medium text-slate-400">Progresso</th>
              <th className="px-5 py-3 text-right font-medium text-slate-400">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {roadmaps.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                  Nenhuma trilha encontrada.
                </td>
              </tr>
            ) : (
              roadmaps.map((roadmap) => (
                <tr key={roadmap.id} className="transition-colors hover:bg-white/[0.02]">
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-slate-200">{roadmap.title}</span>
                      {roadmap.isArchived && (
                        <Badge variant="secondary">Arquivada</Badge>
                      )}
                    </div>
                    {roadmap.description && (
                      <p className="mt-1 max-w-md truncate text-xs text-slate-500">
                        {roadmap.description}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-slate-200">{roadmap.owner?.email ?? "—"}</div>
                    {roadmap.owner?.name && (
                      <span className="text-xs text-slate-500">{roadmap.owner.name}</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant="secondary">
                      {LEVEL_LABELS[roadmap.level] ?? roadmap.level}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="text-slate-400">{roadmap.completedCount}</span>
                    {" / "}
                    <span className="font-medium text-slate-200">{roadmap.itemCount}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-end justify-end gap-2">
                      <span className="font-semibold text-slate-200">{roadmap.progress}%</span>
                      <div className="mb-0.5 h-1 w-24 overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-400 to-violet-500"
                          style={{ width: `${roadmap.progress}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setManageId(roadmap.id)}
                        className="text-slate-400 hover:text-cyan-300"
                        title="Gerenciar itens e conteúdos"
                      >
                        <Target className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditRoadmap(roadmap)}
                        disabled={busyRoadmapForm}
                        className="text-slate-400 hover:text-slate-200"
                        title="Editar trilha"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteRoadmap(roadmap)}
                        disabled={saving === `roadmap-delete-${roadmap.id}`}
                        className="text-slate-400 hover:bg-rose-500/10 hover:text-rose-300"
                        title="Excluir trilha"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Criar trilha */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Nova trilha"
        description="A trilha será vinculada ao usuário selecionado."
        size="lg"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleCreateRoadmap(event.currentTarget);
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300" htmlFor="new-owner">
              Usuário dono
            </label>
            <Select id="new-owner" name="userId" defaultValue={owners[0]?.id ?? ""} required>
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.name ?? owner.email ?? owner.id}
                  {owner.email ? ` — ${owner.email}` : ""}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Título</label>
              <Input name="title" required minLength={3} maxLength={120} autoFocus />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Nível</label>
              <Select name="level" defaultValue="beginner">
                <option value="beginner">Iniciante</option>
                <option value="intermediate">Intermediário</option>
                <option value="advanced">Avançado</option>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Descrição</label>
            <Textarea name="description" rows={2} maxLength={5000} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Objetivo</label>
            <Textarea name="goal" rows={2} maxLength={2000} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Cor</label>
              <input
                name="color"
                type="color"
                defaultValue="#22d3ee"
                className="h-10 w-full cursor-pointer rounded-lg border border-white/[0.06] bg-white/[0.02] p-1"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Ordem</label>
              <Input name="order" type="number" min={0} max={9999} defaultValue={0} />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-white/[0.06] pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={saving === "roadmap-create"}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving === "roadmap-create"}>
              {saving === "roadmap-create" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Criar trilha
            </Button>
          </div>
        </form>
      </Modal>

      {/* Editar trilha */}
      <Modal
        open={editRoadmap !== null}
        onClose={() => setEditRoadmap(null)}
        title="Editar trilha"
        description="Atualize os dados da trilha de qualquer usuário."
        size="lg"
      >
        {editRoadmap && (
          <form
            key={editRoadmap.id}
            onSubmit={(event) => {
              event.preventDefault();
              void handleUpdateRoadmap(event.currentTarget, editRoadmap);
            }}
            className="space-y-4"
          >
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-xs text-slate-400">
              Dono:{" "}
              <span className="font-medium text-slate-200">
                {editRoadmap.owner?.name ?? editRoadmap.owner?.email ?? "—"}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Título</label>
                <Input
                  name="title"
                  required
                  minLength={3}
                  maxLength={120}
                  defaultValue={editRoadmap.title}
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Nível</label>
                <Select name="level" defaultValue={editRoadmap.level}>
                  <option value="beginner">Iniciante</option>
                  <option value="intermediate">Intermediário</option>
                  <option value="advanced">Avançado</option>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Descrição</label>
              <Textarea
                name="description"
                rows={2}
                maxLength={5000}
                defaultValue={editRoadmap.description ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Objetivo</label>
              <Textarea
                name="goal"
                rows={2}
                maxLength={2000}
                defaultValue={editRoadmap.goal ?? ""}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Cor</label>
                <input
                  name="color"
                  type="color"
                  defaultValue={editRoadmap.color ?? "#22d3ee"}
                  className="h-10 w-full cursor-pointer rounded-lg border border-white/[0.06] bg-white/[0.02] p-1"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Ordem</label>
                <Input
                  name="order"
                  type="number"
                  min={0}
                  max={9999}
                  defaultValue={editRoadmap.order}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <input
                id="isArchived"
                name="isArchived"
                type="checkbox"
                defaultChecked={editRoadmap.isArchived}
                className="rounded border-white/[0.06] bg-white/[0.02] text-cyan-400 focus:ring-cyan-400"
              />
              <label htmlFor="isArchived">Arquivada</label>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-white/[0.06] pt-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditRoadmap(null)}
                disabled={saving === `roadmap-${editRoadmap.id}`}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving === `roadmap-${editRoadmap.id}`}>
                {saving === `roadmap-${editRoadmap.id}` ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Pencil className="h-4 w-4" />
                )}
                Salvar trilha
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Excluir trilha */}
      <Modal
        open={deleteRoadmap !== null}
        onClose={() => setDeleteRoadmap(null)}
        title="Excluir trilha?"
        description="Esta ação remove a trilha e todos os itens/conteúdos vinculados."
        size="sm"
      >
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => setDeleteRoadmap(null)}
            disabled={saving === `roadmap-delete-${deleteRoadmap?.id}`}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDeleteRoadmap}
            disabled={saving === `roadmap-delete-${deleteRoadmap?.id}`}
          >
            {saving === `roadmap-delete-${deleteRoadmap?.id}` ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Excluir
          </Button>
        </div>
      </Modal>

      {/* Gerenciar itens e conteúdos */}
      <Modal
        open={manageRoadmap !== null}
        onClose={() => setManageId(null)}
        title={manageRoadmap ? `Itens — ${manageRoadmap.title}` : "Itens da trilha"}
        description="Edite o status dos itens e gerencie o conteúdo teórico de cada um."
        size="lg"
      >
        {manageRoadmap && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-slate-500">
                {detailItems.length} item(ns) · {manageRoadmap.progress}% concluído
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setItemModal({ item: null })}
                disabled={detailLoading || saving === "item-create"}
              >
                <Plus className="h-3.5 w-3.5" /> Adicionar item
              </Button>
            </div>

            {detailLoading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando itens...
              </div>
            ) : detailItems.length === 0 ? (
              <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] px-5 py-8 text-center text-sm text-slate-500">
                Nenhum item ainda. Adicione o primeiro item desta trilha.
              </div>
            ) : (
              <div className="space-y-3">
                {detailItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02]"
                  >
                    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "h-2 w-2 shrink-0 rounded-full",
                              STATUS_DOT[item.status],
                            )}
                          />
                          <h4 className="truncate text-sm font-medium text-slate-100">
                            {item.title}
                          </h4>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                          <span>{STATUS_META[item.status].label}</span>
                          <span>·</span>
                          <span>{item.contents.length} conteúdo(s)</span>
                          {item.estimatedMinutes && (
                            <>
                              <span>·</span>
                              <span>{item.estimatedMinutes} min</span>
                            </>
                          )}
                        </div>
                        {item.description && (
                          <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                            {item.description}
                          </p>
                        )}
                        {item.resourceUrl && (
                          <a
                            href={item.resourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-[11px] text-cyan-300 hover:text-cyan-200"
                          >
                            <ExternalLink className="h-3 w-3" /> Link oficial
                          </a>
                        )}
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                        <Select
                          value={item.status}
                          onChange={(event) =>
                            handleItemStatus(
                              item,
                              event.target.value as RoadmapItemStatus,
                            )
                          }
                          disabled={saving === `item-status-${item.id}`}
                          className="h-8 w-40 text-[11px]"
                          aria-label={`Status de ${item.title}`}
                        >
                          <option value="NOT_STARTED">Não iniciado</option>
                          <option value="IN_PROGRESS">Em andamento</option>
                          <option value="COMPLETED">Concluído</option>
                          <option value="NEEDS_REVIEW">Precisa revisar</option>
                        </Select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setItemModal({ item })}
                          className="text-slate-400 hover:text-slate-200"
                          title="Editar item"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setItemDelete(item)}
                          className="text-slate-400 hover:bg-rose-500/10 hover:text-rose-300"
                          title="Excluir item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="border-t border-white/[0.04] px-4 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          Conteúdo teórico
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setContentModal({ itemId: item.id, content: null })}
                          className="h-7 text-[11px] text-cyan-300 hover:text-cyan-200"
                        >
                          <Plus className="h-3 w-3" /> Adicionar
                        </Button>
                      </div>

                      {item.contents.length === 0 ? (
                        <p className="mt-1 text-xs text-slate-600">
                          Nenhum conteúdo vinculado.
                        </p>
                      ) : (
                        <ul className="mt-2 space-y-1.5">
                          {item.contents.map((content) => (
                            <li
                              key={content.id}
                              className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.02] px-3 py-2"
                            >
                              <div className="flex min-w-0 items-center gap-2">
                                {content.url ? (
                                  <Link2 className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                                ) : (
                                  <FileText className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                                )}
                                <div className="min-w-0">
                                  <div className="truncate text-xs font-medium text-slate-300">
                                    {content.title}
                                  </div>
                                  <div className="text-[10px] text-slate-600">
                                    {CONTENT_TYPE_LABELS[content.type] ?? content.type}
                                  </div>
                                </div>
                              </div>
                              <div className="flex shrink-0 items-center gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setContentModal({ itemId: item.id, content })
                                  }
                                  className="h-6 w-6 p-0 text-slate-500 hover:text-slate-200"
                                  title="Editar conteúdo"
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setContentDelete({ itemId: item.id, content })
                                  }
                                  className="h-6 w-6 p-0 text-slate-500 hover:bg-rose-500/10 hover:text-rose-300"
                                  title="Excluir conteúdo"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Criar/editar item */}
      <Modal
        open={itemModal !== null}
        onClose={() => setItemModal(null)}
        title={itemModal?.item ? "Editar item" : "Novo item"}
        description="Itens aparecem no roadmap do usuário dono da trilha."
        size="lg"
      >
        {itemModal && (
          <form
            key={itemModal.item?.id ?? "new-item"}
            onSubmit={(event) => {
              event.preventDefault();
              void handleSaveItem(event.currentTarget);
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Título</label>
                <Input
                  name="title"
                  required
                  minLength={3}
                  maxLength={160}
                  defaultValue={itemModal.item?.title ?? ""}
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Status</label>
                <Select name="status" defaultValue={itemModal.item?.status ?? "NOT_STARTED"}>
                  <option value="NOT_STARTED">Não iniciado</option>
                  <option value="IN_PROGRESS">Em andamento</option>
                  <option value="COMPLETED">Concluído</option>
                  <option value="NEEDS_REVIEW">Precisa revisar</option>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Descrição</label>
              <Textarea
                name="description"
                rows={2}
                maxLength={5000}
                defaultValue={itemModal.item?.description ?? ""}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Minutos estimados</label>
                <Input
                  name="estimatedMinutes"
                  type="number"
                  min={1}
                  max={6000}
                  defaultValue={itemModal.item?.estimatedMinutes ?? ""}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Ordem</label>
                <Input
                  name="order"
                  type="number"
                  min={0}
                  max={9999}
                  defaultValue={itemModal.item?.order ?? ""}
                  placeholder="Automática"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-xs font-medium text-slate-300">Link oficial</label>
                <Input
                  name="resourceUrl"
                  type="url"
                  maxLength={2048}
                  defaultValue={itemModal.item?.resourceUrl ?? ""}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-white/[0.06] pt-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setItemModal(null)}
                disabled={saving === "item-create" || saving?.startsWith("item-")}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving === "item-create" || saving?.startsWith("item-")}
              >
                {saving === "item-create" || saving?.startsWith("item-") ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <BookOpen className="h-4 w-4" />
                )}
                {itemModal.item ? "Salvar item" : "Criar item"}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Excluir item */}
      <Modal
        open={itemDelete !== null}
        onClose={() => setItemDelete(null)}
        title="Excluir item?"
        description="Este item e todos os seus conteúdos serão removidos."
        size="sm"
      >
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => setItemDelete(null)}
            disabled={saving === `item-delete-${itemDelete?.id}`}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDeleteItem}
            disabled={saving === `item-delete-${itemDelete?.id}`}
          >
            {saving === `item-delete-${itemDelete?.id}` ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Excluir
          </Button>
        </div>
      </Modal>

      {/* Criar/editar conteúdo */}
      <Modal
        open={contentModal !== null}
        onClose={() => setContentModal(null)}
        title={contentModal?.content ? "Editar conteúdo" : "Novo conteúdo teórico"}
        description="Informe uma nota em Markdown ou um link oficial (http/https)."
        size="lg"
      >
        {contentModal && (
          <form
            key={contentModal.content?.id ?? `new-${contentModal.itemId}`}
            onSubmit={(event) => {
              event.preventDefault();
              void handleSaveContent(event.currentTarget);
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-medium text-slate-300">Título</label>
                <Input
                  name="title"
                  required
                  minLength={3}
                  maxLength={160}
                  defaultValue={contentModal.content?.title ?? ""}
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Tipo</label>
                <Select
                  name="type"
                  defaultValue={contentModal.content?.type ?? "NOTE"}
                >
                  <option value="NOTE">Nota</option>
                  <option value="LINK">Link</option>
                  <option value="VIDEO">Vídeo</option>
                  <option value="ARTICLE">Artigo</option>
                  <option value="PDF">PDF</option>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Link (opcional)
              </label>
              <Input
                name="url"
                type="url"
                maxLength={2048}
                defaultValue={contentModal.content?.url ?? ""}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Conteúdo em Markdown
              </label>
              <Textarea
                name="content"
                rows={8}
                maxLength={100000}
                defaultValue={contentModal.content?.content ?? ""}
                placeholder="Escreva a explicação teórica ou deixe vazio se usar apenas um link."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Ordem</label>
              <Input
                name="order"
                type="number"
                min={0}
                max={9999}
                defaultValue={contentModal.content?.order ?? ""}
                placeholder="Automática"
              />
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-white/[0.06] pt-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setContentModal(null)}
                disabled={saving?.startsWith("content-")}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving?.startsWith("content-")}>
                {saving?.startsWith("content-") ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {contentModal.content ? "Salvar conteúdo" : "Adicionar conteúdo"}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Excluir conteúdo */}
      <Modal
        open={contentDelete !== null}
        onClose={() => setContentDelete(null)}
        title="Excluir conteúdo?"
        description="O conteúdo teórico será removido deste item."
        size="sm"
      >
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => setContentDelete(null)}
            disabled={saving === `content-delete-${contentDelete?.content.id}`}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDeleteContent}
            disabled={saving === `content-delete-${contentDelete?.content.id}`}
          >
            {saving === `content-delete-${contentDelete?.content.id}` ? (
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
