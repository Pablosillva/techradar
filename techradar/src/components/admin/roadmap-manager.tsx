"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  Plus,
  Pencil,
  Target,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/roadmap/modal";
import { STATUS_META } from "@/lib/roadmap/presentation";
import type { RoadmapItemStatus } from "@/lib/roadmap/types";
import { cn } from "@/lib/utils";

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

interface RoadmapItemSummary {
  id: string;
  title: string;
  status: RoadmapItemStatus;
  contentCount: number;
}

interface RoadmapManagerProps {
  initialRoadmaps: AdminRoadmap[];
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

function levelBadge(level: string) {
  const labels: Record<string, string> = {
    beginner: "Iniciante",
    intermediate: "Intermediário",
    advanced: "Avançado",
  };
  return <Badge variant="secondary">{labels[level] ?? level}</Badge>;
}

const STATUS_COLORS: Record<RoadmapItemStatus, string> = {
  NOT_STARTED: "#94a3b8",
  IN_PROGRESS: "#22d3ee",
  COMPLETED: "#34d399",
  NEEDS_REVIEW: "#fbbf24",
};

export function RoadmapManager({ initialRoadmaps }: RoadmapManagerProps) {
  const router = useRouter();
  const [roadmaps, setRoadmaps] = useState<AdminRoadmap[]>(initialRoadmaps);
  const [message, setMessage] = useState<{ text: string; tone: "success" | "error" }>({
    text: "",
    tone: "success",
  });
  const [saving, setSaving] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState<AdminRoadmap | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [manageId, setManageId] = useState<string | null>(null);

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

  // ---------- Trilhas ----------
  async function handleSaveRoadmap(form: HTMLFormElement, editing: boolean) {
    const data = new FormData(form);
    const payload = {
      title: String(data.get("title") ?? "").trim(),
      description: String(data.get("description") ?? "").trim() || null,
      goal: String(data.get("goal") ?? "").trim() || null,
      level: String(data.get("level") ?? "beginner"),
      color: String(data.get("color") ?? "#22d3ee"),
      isArchived: data.get("isArchived") === "on",
    };

    if (editing && editOpen) {
      await run(
        `roadmap-${editOpen.id}`,
        () => apiRequest(`/api/admin/roadmaps/${editOpen.id}`, { method: "PATCH", body: JSON.stringify(payload) }),
        () => {
          setEditOpen(null);
          setRoadmaps((prev) =>
            prev.map((r) => (r.id === editOpen!.id ? { ...r, ...payload } : r))
          );
        }
      );
    } else {
      // Criação: precisa do userId do dono. Use o primeiro admin? Não — exigimos userId.
      // Para simplificar a criação administrativa, criamos sob o usuário logado não é possível aqui;
      // o formulário de criação pede o e-mail/ID do dono via campo oculto preenchido pelo admin.
      await run(
        "roadmap-create",
        () =>
          apiRequest("/api/admin/roadmaps", {
            method: "POST",
            body: JSON.stringify({ ...payload, userId: data.get("userId") ?? "" }),
          }),
        () => setRoadmaps((prev) => [...prev]) // recarregado pelo router.refresh
      );
      setEditOpen(null);
    }
  }

  // ---------- Itens ----------
  const [items, setItems] = useState<RoadmapItemSummary[]>([]);
  const [itemEdit, setItemEdit] = useState<RoadmapItemSummary | null>(null);
  const [itemDeleteId, setItemDeleteId] = useState<string | null>(null);
  const [contentAdd, setContentAdd] = useState<string | null>(null);

  useEffect(() => {
    if (!manageId) {
      setItems([]);
      return;
    }
    apiRequest(`/api/admin/roadmaps/${manageId}`).then((data: any) => {
      const roadmap = data?.roadmap ?? data;
      const list = (roadmap?.items ?? []).map((i: any) => ({
        id: i.id,
        title: i.title,
        status: i.status,
        contentCount: (i.contents ?? []).length,
      }));
      setItems(list);
    });
  }, [manageId]);

  async function handleItemStatus(item: RoadmapItemSummary, status: RoadmapItemStatus) {
    await run(
      `item-status-${item.id}`,
      () =>
        apiRequest(`/api/admin/roadmap-items/${item.id}`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        }),
      () => {
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status } : i)));
      }
    );
  }

  async function handleItemDelete() {
    if (!itemDeleteId) return;
    await run(
      `item-delete-${itemDeleteId}`,
      () => apiRequest(`/api/admin/roadmap-items/${itemDeleteId}`, { method: "DELETE" }),
      () => {
        setItems((prev) => prev.filter((i) => i.id !== itemDeleteId));
        setItemDeleteId(null);
      }
    );
  }

  async function handleRoadmapDelete() {
    if (!deleteId) return;
    await run(
      `roadmap-delete-${deleteId}`,
      () => apiRequest(`/api/admin/roadmaps/${deleteId}`, { method: "DELETE" }),
      () => {
        setRoadmaps((prev) => prev.filter((r) => r.id !== deleteId));
        setDeleteId(null);
      }
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Gerenciar trilhas</h2>
          <p className="text-sm text-slate-400">
            Administra todas as trilhas de todos os usuários.
          </p>
        </div>
        <Button type="button" variant="glow" onClick={() => setEditOpen(null)}>
          <Plus className="h-4 w-4" /> Nova trilha
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
              <th className="text-left px-5 py-3 text-slate-400 font-medium">Dono</th>
              <th className="text-left px-5 py-3 text-slate-400 font-medium">Nível</th>
              <th className="text-right px-5 py-3 text-slate-400 font-medium">Itens</th>
              <th className="text-right px-5 py-3 text-slate-400 font-medium">Progresso</th>
              <th className="text-right px-5 py-3 text-slate-400 font-medium">Ações</th>
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
                <tr key={roadmap.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-medium text-slate-200">{roadmap.title}</div>
                    {roadmap.description && (
                      <p className="mt-1 text-xs text-slate-500 whitespace-pre-wrap">
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
                  <td className="px-5 py-4">{levelBadge(roadmap.level)}</td>
                  <td className="px-5 py-4 text-right">
                    <span className="text-slate-400">{roadmap.completedCount}</span>{" / "}
                    <span className="font-medium text-slate-200">{roadmap.itemCount}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-end gap-2">
                      <span className="font-semibold text-slate-200">{roadmap.progress}%</span>
                      <div className="h-1 w-24 overflow-hidden rounded-full bg-white/[0.06] mb-0.5">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-400 to-violet-500"
                          style={{ width: `${roadmap.progress}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setManageId(roadmap.id)}
                        disabled={saving?.startsWith("roadmap-") && !saving.startsWith("roadmap-delete")}
                        className="text-slate-400 hover:text-cyan-300"
                        title="Gerenciar itens"
                      >
                        <Target className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditOpen(roadmap)}
                        disabled={saving?.startsWith("roadmap-") && !saving.startsWith("roadmap-delete")}
                        className="text-slate-400 hover:text-slate-200"
                        title="Editar trilha"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(roadmap.id)}
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

      {/* Editar / criar trilha */}
      <Modal
        open={editOpen !== null}
        onClose={() => setEditOpen(null)}
        title={editOpen ? "Editar trilha" : "Nova trilha"}
        description={
          editOpen
            ? "Atualize os dados da trilha de qualquer usuário."
            : "Informe o dono (ID do usuário) e os dados da nova trilha."
        }
        size="lg"
      >
        {editOpen !== null && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveRoadmap(e.currentTarget, true);
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
                  maxLength={120}
                  defaultValue={editOpen.title}
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Nível</label>
                <Select name="level" defaultValue={editOpen.level}>
                  <option value="beginner">Iniciante</option>
                  <option value="intermediate">Intermediário</option>
                  <option value="advanced">Avançado</option>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Descrição</label>
              <Textarea name="description" rows={2} defaultValue={editOpen.description ?? ""} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Objetivo</label>
              <Textarea name="goal" rows={2} defaultValue={editOpen.goal ?? ""} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Cor</label>
              <input
                name="color"
                type="color"
                defaultValue={editOpen.color ?? "#22d3ee"}
                className="h-10 w-full cursor-pointer rounded-lg border border-white/[0.06] bg-white/[0.02] p-1"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <input
                id="isArchived"
                name="isArchived"
                type="checkbox"
                defaultChecked={editOpen.isArchived}
                className="rounded border-white/[0.06] bg-white/[0.02] text-cyan-400 focus:ring-cyan-400"
              />
              <label htmlFor="isArchived">Arquivada</label>
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-white/[0.06] pt-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(null)}
                disabled={saving?.startsWith("roadmap-") && !saving.startsWith("roadmap-delete")}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving?.startsWith("roadmap-") && !saving.startsWith("roadmap-delete")}>
                {saving?.startsWith("roadmap-") && !saving.startsWith("roadmap-delete") ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Pencil className="h-4 w-4" />
                )}
                {editOpen ? "Salvar trilha" : "Criar trilha"}
              </Button>
            </div>
          </form>
        )}
        {!editOpen && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveRoadmap(e.currentTarget, false);
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">ID do usuário dono</label>
              <Input
                name="userId"
                required
                placeholder="Ex: 6f3a1b2c..."
                autoFocus
              />
              <p className="text-[10px] text-slate-500">Obrigatório: a trilha será vinculada a este usuário.</p>
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
              <Textarea name="description" rows={2} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Cor</label>
              <input
                name="color"
                type="color"
                defaultValue="#22d3ee"
                className="h-10 w-full cursor-pointer rounded-lg border border-white/[0.06] bg-white/[0.02] p-1"
              />
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-white/[0.06] pt-4 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setEditOpen(null)}>
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
        )}
      </Modal>

      {/* Excluir trilha */}
      <Modal open={deleteId !== null} onClose={() => setDeleteId(null)} title="Excluir trilha?" description="Esta ação remove a trilha e todos os itens/conteúdos vinculados." size="sm">
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => setDeleteId(null)} disabled={saving === `roadmap-delete-${deleteId}`}>
            Cancelar
          </Button>
          <Button type="button" variant="destructive" onClick={handleRoadmapDelete} disabled={saving === `roadmap-delete-${deleteId}`}>
            {saving === `roadmap-delete-${deleteId}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Excluir
          </Button>
        </div>
      </Modal>

      {/* Gerenciar itens */}
      <Modal open={manageId !== null} onClose={() => setManageId(null)} title="Itens da trilha" size="lg">
        {manageId && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-white">Itens</h3>
              <Button type="button" variant="outline" size="sm" onClick={() => setContentAdd(null)}>
                <Plus className="h-3.5 w-3.5" /> Adicionar item
              </Button>
            </div>
            <div className="divide-y divide-white/[0.04] rounded-lg border border-white/[0.05] bg-white/[0.02]">
              {items.length === 0 ? (
                <div className="px-5 py-6 text-center text-slate-500 text-sm">Nenhum item ainda.</div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-white/[0.02]">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="shrink-0 h-2 w-2 rounded-full"
                        style={{ backgroundColor: STATUS_COLORS[item.status] }}
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-200 truncate" title={item.title}>
                          {item.title}
                        </div>
                        <span className="text-xs text-slate-500">{item.contentCount} conteúdo(s)</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={item.status}
                        onChange={(e) => handleItemStatus(item, e.target.value as RoadmapItemStatus)}
                        disabled={saving?.startsWith(`item-status-${item.id}`)}
                        className="h-8 text-[11px] w-44"
                      >
                        <option value="NOT_STARTED">Não iniciado</option>
                        <option value="IN_PROGRESS">Em andamento</option>
                        <option value="COMPLETED">Concluído</option>
                        <option value="NEEDS_REVIEW">Precisa revisar</option>
                      </Select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setItemDeleteId(item.id)}
                        className="text-slate-500 hover:bg-rose-500/10 hover:text-rose-300"
                        title="Excluir item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Excluir item */}
      <Modal open={itemDeleteId !== null} onClose={() => setItemDeleteId(null)} title="Excluir item?" description="Este item e seus conteúdos serão removidos." size="sm">
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => setItemDeleteId(null)} disabled={saving?.startsWith("item-delete")}>
            Cancelar
          </Button>
          <Button type="button" variant="destructive" onClick={handleItemDelete} disabled={saving === `item-delete-${itemDeleteId}`}>
            {saving === `item-delete-${itemDeleteId}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Excluir
          </Button>
        </div>
      </Modal>
    </div>
  );
}
