"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Layers3,
  Loader2,
  Plus,
  Route,
  Target,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  STATUS_META,
  summarizeOverall,
  trackAccent,
} from "@/lib/roadmap/presentation";
import type {
  RoadmapDto,
  RoadmapItemDto,
  RoadmapItemStatus,
  StudyContentDto,
} from "@/lib/roadmap/types";
import { cn } from "@/lib/utils";
import { Modal } from "./modal";
import { RoadmapCard } from "./roadmap-card";
import {
  ContentForm,
  ItemForm,
  TrackForm,
  type ContentFormPayload,
  type ItemFormPayload,
  type TrackFormPayload,
} from "./roadmap-forms";

type TrackModalState =
  | { mode: "create" }
  | { mode: "edit"; roadmap: RoadmapDto }
  | null;

type ItemModalState =
  | { mode: "create"; roadmapId: string }
  | { mode: "edit"; item: RoadmapItemDto }
  | null;

type ContentModalState =
  | { mode: "create"; item: RoadmapItemDto }
  | { mode: "edit"; item: RoadmapItemDto; content: StudyContentDto }
  | null;

type DeleteTarget =
  | { kind: "roadmap"; roadmap: RoadmapDto }
  | { kind: "item"; item: RoadmapItemDto }
  | { kind: "content"; item: RoadmapItemDto; content: StudyContentDto }
  | null;

type ToastState = { tone: "success" | "error"; message: string } | null;

interface RoadmapWorkspaceProps {
  roadmaps: RoadmapDto[];
}

/** Lê o JSON da API e devolve mensagens de erro seguras. */
async function requestData<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json().catch(() => null)) as
    | { data?: T; error?: string }
    | null;

  if (!response.ok) {
    throw new Error(
      payload?.error ?? "Não foi possível concluir a ação. Tente novamente."
    );
  }

  return payload?.data as T;
}

function MiniStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Activity;
  label: string;
  value: number;
  tone: "emerald" | "cyan" | "amber";
}) {
  const tones = {
    emerald: "bg-emerald-400/10 text-emerald-300",
    cyan: "bg-cyan-400/10 text-cyan-300",
    amber: "bg-amber-400/10 text-amber-300",
  } as const;

  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          tones[tone]
        )}
        aria-hidden="true"
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div>
        <p className="text-[10px] leading-none text-slate-500">{label}</p>
        <p className="mt-1 text-sm font-semibold text-slate-200">{value}</p>
      </div>
    </div>
  );
}

export function RoadmapWorkspace({ roadmaps }: RoadmapWorkspaceProps) {
  const router = useRouter();
  const overall = useMemo(() => summarizeOverall(roadmaps), [roadmaps]);
  const nextOrder = useMemo(
    () => Math.max(-1, ...roadmaps.map((roadmap) => roadmap.order)) + 1,
    [roadmaps]
  );

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [trackModal, setTrackModal] = useState<TrackModalState>(null);
  const [itemModal, setItemModal] = useState<ItemModalState>(null);
  const [contentModal, setContentModal] = useState<ContentModalState>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function toggleCollapsed(roadmapId: string) {
    setCollapsed((previous) => {
      const next = new Set(previous);
      if (next.has(roadmapId)) next.delete(roadmapId);
      else next.add(roadmapId);
      return next;
    });
  }

  async function run(
    key: string,
    action: () => Promise<unknown>,
    successMessage: string
  ): Promise<boolean> {
    if (pending) return false;

    setPending(key);
    try {
      await action();
      setToast({ tone: "success", message: successMessage });
      router.refresh();
      return true;
    } catch (error) {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        router.push("/entrar");
        return false;
      }
      setToast({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível concluir a ação. Tente novamente.",
      });
      return false;
    } finally {
      setPending(null);
    }
  }

  async function handleTrackSubmit(payload: TrackFormPayload) {
    const modal = trackModal;
    if (!modal) return;

    const editing = modal.mode === "edit";
    const key = editing ? `track-${modal.roadmap.id}` : "track-create";
    const success = await run(
      key,
      () =>
        requestData(
          editing ? `/api/roadmaps/${modal.roadmap.id}` : "/api/roadmaps",
          {
            method: editing ? "PATCH" : "POST",
            body: JSON.stringify(payload),
          }
        ),
      editing ? "Trilha atualizada." : "Trilha criada."
    );

    if (success) setTrackModal(null);
  }

  async function handleItemSubmit(payload: ItemFormPayload) {
    const modal = itemModal;
    if (!modal) return;

    const editing = modal.mode === "edit";
    const key = editing ? `item-${modal.item.id}` : `item-create-${modal.roadmapId}`;
    const success = await run(
      key,
      () =>
        requestData(
          editing
            ? `/api/roadmap-items/${modal.item.id}`
            : `/api/roadmaps/${modal.roadmapId}/items`,
          {
            method: editing ? "PATCH" : "POST",
            body: JSON.stringify(payload),
          }
        ),
      editing ? "Item atualizado." : "Item adicionado à trilha."
    );

    if (success) setItemModal(null);
  }

  async function handleContentSubmit(payload: ContentFormPayload) {
    const modal = contentModal;
    if (!modal) return;

    const editing = modal.mode === "edit";
    const key = editing ? `content-${modal.content.id}` : `content-create-${modal.item.id}`;
    const success = await run(
      key,
      () =>
        requestData(
          editing
            ? `/api/study-contents/${modal.content.id}`
            : `/api/roadmap-items/${modal.item.id}/contents`,
          {
            method: editing ? "PATCH" : "POST",
            body: JSON.stringify(payload),
          }
        ),
      editing ? "Conteúdo atualizado." : "Conteúdo adicionado."
    );

    if (success) setContentModal(null);
  }

  async function handleStatusChange(
    item: RoadmapItemDto,
    status: RoadmapItemStatus
  ): Promise<boolean> {
    return run(
      `status-${item.id}`,
      () =>
        requestData(`/api/roadmap-items/${item.id}`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        }),
      `Status atualizado para “${STATUS_META[status].label}”.`
    );
  }

  async function handleDeleteConfirm() {
    const target = deleteTarget;
    if (!target) return;

    let endpoint = "";
    let successMessage = "";

    if (target.kind === "roadmap") {
      endpoint = `/api/roadmaps/${target.roadmap.id}`;
      successMessage = "Trilha excluída.";
    } else if (target.kind === "item") {
      endpoint = `/api/roadmap-items/${target.item.id}`;
      successMessage = "Item excluído.";
    } else if (target.kind === "content") {
      endpoint = `/api/study-contents/${target.content.id}`;
      successMessage = "Conteúdo excluído.";
    }

    const success = await run(
      "delete",
      () => requestData(endpoint, { method: "DELETE" }),
      successMessage
    );

    if (success) setDeleteTarget(null);
  }

  const itemModalRoadmap =
    itemModal?.mode === "create"
      ? roadmaps.find((roadmap) => roadmap.id === itemModal.roadmapId)
      : undefined;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex items-start gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300">
            <Route className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300/80">
              Plano de estudos
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
              Roadmap de Estudos
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              Organize suas trilhas, acompanhe o progresso e gerencie o
              conteúdo teórico na página de Conteúdo.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="glow"
          onClick={() => setTrackModal({ mode: "create" })}
          className="shrink-0"
        >
          <Plus className="h-4 w-4" /> Nova trilha
        </Button>
      </div>

      {/* Resumo geral */}
      {roadmaps.length > 0 && (
        <Card className="p-4 sm:p-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
            <div className="flex items-center gap-3 lg:w-52 lg:shrink-0">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/20 to-violet-500/20 text-cyan-300">
                <Target className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                  Progresso geral
                </p>
                <p className="text-2xl font-bold leading-none text-white">
                  {overall.progress}%
                </p>
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3 text-[11px]">
                <span className="text-slate-400">
                  {overall.completed} de {overall.total} itens concluídos
                </span>
                <span className="inline-flex items-center gap-1 text-slate-500">
                  <Layers3 className="h-3 w-3" />
                  {roadmaps.length} {roadmaps.length === 1 ? "trilha" : "trilhas"}
                </span>
              </div>
              <div
                className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={overall.progress}
                aria-label="Progresso geral do roadmap"
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-[width] duration-500"
                  style={{ width: `${overall.progress}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 border-t border-white/[0.06] pt-4 sm:gap-6 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              <MiniStat
                icon={CheckCircle2}
                label="Concluídos"
                value={overall.completed}
                tone="emerald"
              />
              <MiniStat
                icon={Activity}
                label="Em andamento"
                value={overall.inProgress}
                tone="cyan"
              />
              <MiniStat
                icon={AlertTriangle}
                label="Revisar"
                value={overall.needsReview}
                tone="amber"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Trilhas */}
      {roadmaps.length === 0 ? (
        <Card className="border-dashed border-white/10 bg-transparent p-10 text-center sm:p-16">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] text-cyan-300">
            <Route className="h-6 w-6" />
          </span>
          <h2 className="mt-4 text-lg font-semibold text-white">
            Comece sua primeira trilha
          </h2>
          <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-slate-400">
            Crie uma trilha com objetivo e nível, adicione itens de estudo e
            gerencie o conteúdo teórico na página de Conteúdo.
          </p>
          <Button
            type="button"
            variant="glow"
            onClick={() => setTrackModal({ mode: "create" })}
            className="mt-5"
          >
            <Plus className="h-4 w-4" /> Criar primeira trilha
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {roadmaps.map((roadmap) => (
            <RoadmapCard
              key={roadmap.id}
              roadmap={roadmap}
              accent={trackAccent(roadmap.color)}
              collapsed={collapsed.has(roadmap.id)}
              onToggle={() => toggleCollapsed(roadmap.id)}
              onEdit={() => setTrackModal({ mode: "edit", roadmap })}
              onDelete={() => setDeleteTarget({ kind: "roadmap", roadmap })}
              onAddItem={() =>
                setItemModal({ mode: "create", roadmapId: roadmap.id })
              }
              onEditItem={(item) => setItemModal({ mode: "edit", item })}
              onDeleteItem={(item) => setDeleteTarget({ kind: "item", item })}
              onStatusChange={handleStatusChange}
              onAddContent={(item) => setContentModal({ mode: "create", item })}
              onEditContent={(item, content) =>
                setContentModal({ mode: "edit", item, content })
              }
              onDeleteContent={(item, content) =>
                setDeleteTarget({ kind: "content", item, content })
              }
            />
          ))}

          <button
            type="button"
            onClick={() => setTrackModal({ mode: "create" })}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 px-4 py-4 text-xs font-medium text-slate-500 transition-colors hover:border-cyan-400/30 hover:bg-cyan-400/[0.03] hover:text-cyan-300"
          >
            <Plus className="h-3.5 w-3.5" /> Adicionar outra trilha
          </button>
        </div>
      )}

      {/* Modal de trilha */}
      <Modal
        open={trackModal !== null}
        onClose={() => setTrackModal(null)}
        title={trackModal?.mode === "edit" ? "Editar trilha" : "Nova trilha"}
        description={
          trackModal?.mode === "edit"
            ? "Atualize as informações e a cor de destaque da trilha."
            : "Defina o objetivo, o nível e a cor da nova trilha."
        }
      >
        {trackModal && (
          <TrackForm
            key={trackModal.mode === "edit" ? trackModal.roadmap.id : "new"}
            initial={
              trackModal.mode === "edit" ? trackModal.roadmap : undefined
            }
            nextOrder={nextOrder}
            saving={pending?.startsWith("track-") ?? false}
            onSubmit={handleTrackSubmit}
            onCancel={() => setTrackModal(null)}
          />
        )}
      </Modal>

      {/* Modal de item */}
      <Modal
        open={itemModal !== null}
        onClose={() => setItemModal(null)}
        title={itemModal?.mode === "edit" ? "Editar item" : "Novo item de estudo"}
        description={
          itemModal?.mode === "edit"
            ? "Atualize o status, o tempo estimado ou o link oficial."
            : itemModalRoadmap
              ? `Adicionando um item à trilha “${itemModalRoadmap.title}”.`
              : "Adicione um novo passo à sua trilha."
        }
        size="lg"
      >
        {itemModal && (
          <ItemForm
            key={
              itemModal.mode === "edit"
                ? itemModal.item.id
                : `new-${itemModal.roadmapId}`
            }
            initial={itemModal.mode === "edit" ? itemModal.item : undefined}
            saving={
              pending?.startsWith("item-") ||
              pending?.startsWith("item-create-") ||
              false
            }
            onSubmit={handleItemSubmit}
            onCancel={() => setItemModal(null)}
          />
        )}
      </Modal>

      {/* Modal de conteúdo teórico */}
      <Modal
        open={contentModal !== null}
        onClose={() => setContentModal(null)}
        title={
          contentModal?.mode === "edit"
            ? "Editar conteúdo"
            : "Novo conteúdo teórico"
        }
        description={
          contentModal
            ? `Vinculado ao item “${contentModal.item.title}”.`
            : undefined
        }
        size="lg"
      >
        {contentModal && (
          <ContentForm
            key={
              contentModal.mode === "edit"
                ? contentModal.content.id
                : `new-${contentModal.item.id}`
            }
            initial={
              contentModal.mode === "edit" ? contentModal.content : undefined
            }
            saving={pending?.startsWith("content") ?? false}
            onSubmit={handleContentSubmit}
            onCancel={() => setContentModal(null)}
          />
        )}
      </Modal>

      {/* Confirmação de exclusão */}
      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title={
          deleteTarget?.kind === "roadmap"
            ? "Excluir trilha?"
            : deleteTarget?.kind === "content"
              ? "Excluir conteúdo?"
              : "Excluir item?"
        }
        description="Esta ação não pode ser desfeita."
        size="sm"
      >
        {deleteTarget && (
          <div className="space-y-5">
            <p className="text-sm leading-relaxed text-slate-400">
              {deleteTarget.kind === "roadmap" && (
                <>
                  A trilha{" "}
                  <strong className="text-slate-200">
                    “{deleteTarget.roadmap.title}”
                  </strong>{" "}
                  e todos os seus itens e conteúdos serão removidos
                  permanentemente.
                </>
              )}
              {deleteTarget.kind === "item" && (
                <>
                  O item{" "}
                  <strong className="text-slate-200">
                    “{deleteTarget.item.title}”
                  </strong>{" "}
                  e os conteúdos vinculados a ele serão removidos.
                </>
              )}
              {deleteTarget.kind === "content" && (
                <>
                  O conteúdo{" "}
                  <strong className="text-slate-200">
                    “{deleteTarget.content.title}”
                  </strong>{" "}
                  será removido do item “{deleteTarget.item.title}”.
                </>
              )}
            </p>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                disabled={pending === "delete"}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={pending === "delete"}
              >
                {pending === "delete" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                Excluir
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Feedback */}
      {toast && (
        <div
          role={toast.tone === "error" ? "alert" : "status"}
          className={cn(
            "fixed bottom-4 left-4 right-4 z-[120] flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-2xl backdrop-blur sm:left-auto sm:max-w-sm",
            toast.tone === "success"
              ? "border-emerald-400/25 bg-[#0b1f1a]/95 text-emerald-200"
              : "border-rose-400/25 bg-[#241016]/95 text-rose-200"
          )}
        >
          {toast.tone === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <p className="flex-1 text-xs leading-relaxed">{toast.message}</p>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="rounded p-0.5 opacity-70 transition-opacity hover:opacity-100"
            aria-label="Fechar aviso"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
