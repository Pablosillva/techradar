"use client";

import { useState } from "react";
import {
  ChevronRight,
  Clock3,
  ExternalLink,
  FileText,
  Link2,
  StickyNote,
  Video,
  Newspaper,
  Play,
  CheckCircle2,
  AlertTriangle,
  Pencil,
  Trash2,
  Plus,
  Target,
  Route,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "./modal";
import {
  STATUS_META,
  summarizeRoadmap,
  trackAccent,
  formatDuration,
  safeHttpUrl,
  LEVEL_META,
} from "@/lib/roadmap/presentation";
import type {
  RoadmapDto,
  RoadmapItemDto,
  RoadmapItemStatus,
  StudyContentDto,
} from "@/lib/roadmap/types";
import { cn } from "@/lib/utils";

interface RoadmapItemCardProps {
  item: RoadmapItemDto;
  onStatusChange: (itemId: string, status: RoadmapItemStatus) => void;
  onEdit: (item: RoadmapItemDto) => void;
  onDelete: (itemId: string) => void;
  onAddContent: (item: RoadmapItemDto) => void;
}

export function RoadmapItemCard({
  item,
  onStatusChange,
  onEdit,
  onDelete,
  onAddContent,
}: RoadmapItemCardProps) {
  const [status, setStatus] = useState<RoadmapItemStatus>(item.status);
  const statusMeta = STATUS_META[status] ?? STATUS_META.NOT_STARTED;
  const resourceUrl = safeHttpUrl(item.resourceUrl);

  async function handleStatusChange(next: RoadmapItemStatus) {
    setStatus(next);
    await onStatusChange(item.id, next);
  }

  const getStatusProgress = (status: RoadmapItemStatus) => {
    switch (status) {
      case "COMPLETED":
        return 100;
      case "IN_PROGRESS":
        return 50;
      case "NEEDS_REVIEW":
        return 75;
      default:
        return 0;
    }
  };

  return (
    <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4 mb-4 hover:bg-white/[0.03] transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-violet-400/10 text-violet-300">
            <FileText className="h-3 w-3" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-200 truncate" title={item.title}>
              {item.title}
            </h3>
            <Badge variant={statusMeta.badge} className="text-xs mt-1">
              {statusMeta.label}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onEdit(item)}
            className="h-7 w-7 text-slate-500 hover:text-slate-200"
            title="Editar item"
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onDelete(item.id)}
            className="h-7 w-7 text-slate-500 hover:bg-rose-500/10 hover:text-rose-300"
            title="Excluir item"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {item.resourceUrl && (
        <a
          href={item.resourceUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-cyan-300 transition-colors hover:text-cyan-200"
        >
          <ExternalLink className="h-3 w-3" /> Link oficial
        </a>
      )}

      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-500">{formatDuration(item.estimatedMinutes)}</span>
            <span className="text-xs font-semibold text-slate-400">
              {getStatusProgress(item.status)}%
            </span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-all duration-500"
              style={{ width: `${getStatusProgress(item.status)}%` }}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => onAddContent(item)}
          className="inline-flex items-center gap-1 text-[10px] font-medium text-cyan-300 transition-colors hover:text-cyan-200"
        >
          <Plus className="h-3 w-3" /> Adicionar conteúdo
        </button>
      </div>
    </div>
  );
}

interface RoadmapColumnProps {
  roadmap: RoadmapDto;
  accent: string;
  collapsed: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddItem: () => void;
  onEditItem: (item: RoadmapItemDto) => void;
  onDeleteItem: (itemId: string) => void;
  onAddContent: (item: RoadmapItemDto) => void;
  onStatusChange: (itemId: string, status: RoadmapItemStatus) => void;
}

export function RoadmapColumn({
  roadmap,
  accent,
  collapsed,
  onToggle,
  onEdit,
  onDelete,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onAddContent,
  onStatusChange,
}: RoadmapColumnProps) {
  const summary = summarizeRoadmap(roadmap);
  const level = LEVEL_META[roadmap.level as keyof typeof LEVEL_META] ?? LEVEL_META.beginner;
  const statusCounts = [
    { status: "COMPLETED", count: summary.completed },
    { status: "IN_PROGRESS", count: summary.inProgress },
    { status: "NEEDS_REVIEW", count: summary.needsReview },
    { status: "NOT_STARTED", count: summary.notStarted },
  ];

  return (
    <Card className="overflow-hidden">
      <div className="relative">
        <span
          className="absolute inset-y-0 left-0 w-0.5"
          style={{ backgroundColor: accent }}
          aria-hidden="true"
        />
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span
              className="mt-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
              style={{ borderColor: `${accent}33`, backgroundColor: `${accent}14`, color: accent }}
              aria-hidden="true"
            >
              <Target className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold tracking-tight text-white sm:text-lg">
                  {roadmap.title}
                </h2>
                <Badge variant={level.badge}>{level.label}</Badge>
                <Badge variant="outline">
                  {summary.total} {summary.total === 1 ? "item" : "itens"}
                </Badge>
              </div>
              {roadmap.description && (
                <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-400 sm:text-sm">
                  {roadmap.description}
                </p>
              )}
              {roadmap.goal && (
                <p className="mt-2 inline-flex max-w-full items-start gap-1.5 rounded-md bg-white/[0.03] px-2 py-1 text-[11px] text-slate-400">
                  <Target className="mt-0.5 h-3 w-3 shrink-0 text-slate-500" />
                  <span className="break-words">{roadmap.goal}</span>
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onEdit}
                className="h-8 w-8 text-slate-500 hover:text-slate-200"
                title="Editar trilha"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onDelete}
                className="h-8 w-8 text-slate-500 hover:bg-rose-500/10 hover:text-rose-300"
                title="Excluir trilha"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onToggle}
                aria-expanded={!collapsed}
                aria-controls={`roadmap-${roadmap.id}`}
                aria-label={collapsed ? "Expandir trilha" : "Recolher trilha"}
                title={collapsed ? "Expandir trilha" : "Recolher trilha"}
                className="h-8 w-8 text-slate-400 hover:text-white"
              >
                {collapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between gap-3 text-[11px]">
              <span className="text-slate-500">
                {summary.completed} de {summary.total} concluídos
              </span>
              <span className="font-semibold" style={{ color: accent }}>
                {summary.progress}%
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-all duration-500"
                style={{ width: `${summary.progress}%` }}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
              {statusCounts.map(({ status, count }) => {
                const meta = STATUS_META[status as RoadmapItemStatus];
                return (
                  <span
                    key={status}
                    className="inline-flex items-center gap-1.5 text-[10px] text-slate-500"
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
                    {meta.label}
                    <span className="font-semibold text-slate-400">{count}</span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {!collapsed && (
        <div className="divide-y divide-white/[0.04]">
          {roadmap.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-5 py-10 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.03] text-slate-500">
                <Route className="h-4 w-4" />
              </span>
              <p className="text-xs text-slate-500">Esta trilha ainda não tem itens de estudo.</p>
              <Button type="button" variant="outline" size="sm" onClick={onAddItem}>
                <Plus className="h-3.5 w-3.5" /> Adicionar primeiro item
              </Button>
            </div>
          ) : (
            <>
              <div className="divide-y divide-white/[0.04]">
                {roadmap.items.map((item) => (
                  <RoadmapItemCard
                    key={item.id}
                    item={item}
                    onStatusChange={(status) => onStatusChange(item.id, status as RoadmapItemStatus)}
                    onEdit={onEditItem}
                    onDelete={onDeleteItem}
                    onAddContent={onAddContent}
                  />
                ))}
              </div>
              <div className="border-t border-white/[0.04] px-4 py-3 sm:px-5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onAddItem}
                  className="text-slate-400 hover:text-cyan-300"
                >
                  <Plus className="h-3.5 w-3.5" /> Adicionar item a esta trilha
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  );
}

interface RoadmapColumnsProps {
  roadmaps: RoadmapDto[];
}

export function RoadmapColumns({ roadmaps }: RoadmapColumnsProps) {
  const allItems = roadmaps.flatMap((r) => r.items);
  const totalItems = allItems.length;
  const completedItems = allItems.filter((i) => i.status === "COMPLETED").length;
  const progress = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex items-start gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300">
            <Target className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300/80">
              Plano de estudos
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
              Roadmap de Estudos
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              Organize suas trilhas, acompanhe o progresso e mantenha o conteúdo
              teórico e os links oficiais sempre à mão.
            </p>
          </div>
        </div>
        <Button type="button" variant="glow" className="shrink-0">
          <Plus className="h-4 w-4" /> Nova trilha
        </Button>
      </div>

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
            guarde resumos, links oficiais e o status de cada etapa.
          </p>
          <Button type="button" variant="glow" className="mt-5">
            <Plus className="h-4 w-4" /> Criar primeira trilha
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roadmaps.map((roadmap) => (
            <RoadmapColumn
              key={roadmap.id}
              roadmap={roadmap}
              accent={trackAccent(roadmap.color)}
              collapsed={false}
              onToggle={() => {}}
              onEdit={() => {}}
              onDelete={() => {}}
              onAddItem={() => {}}
              onEditItem={() => {}}
              onDeleteItem={() => {}}
              onAddContent={() => {}}
              onStatusChange={() => {}}
            />
          ))}
        </div>
      )}
    </div>
  );
}
