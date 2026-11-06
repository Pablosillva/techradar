"use client";

import { useId } from "react";
import {
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Pencil,
  Plus,
  Target,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  LEVEL_META,
  STATUS_META,
  summarizeRoadmap,
} from "@/lib/roadmap/presentation";
import type {
  RoadmapDto,
  RoadmapItemDto,
  RoadmapItemStatus,
} from "@/lib/roadmap/types";
import { cn } from "@/lib/utils";
import { RoadmapItem } from "./roadmap-item";

interface RoadmapCardProps {
  roadmap: RoadmapDto;
  accent: string;
  collapsed: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddItem: () => void;
  onEditItem: (item: RoadmapItemDto) => void;
  onDeleteItem: (item: RoadmapItemDto) => void;
  onStatusChange: (item: RoadmapItemDto, status: RoadmapItemStatus) => Promise<boolean>;
}

export function RoadmapCard({
  roadmap,
  accent,
  collapsed,
  onToggle,
  onEdit,
  onDelete,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onStatusChange,
}: RoadmapCardProps) {
  const panelId = useId();
  const summary = summarizeRoadmap(roadmap);
  const level = LEVEL_META[roadmap.level] ?? LEVEL_META.beginner;
  const statusCounts: Array<{ status: RoadmapItemStatus; count: number }> = [
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
              style={{
                borderColor: `${accent}33`,
                backgroundColor: `${accent}14`,
                color: accent,
              }}
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
                aria-label={`Editar trilha ${roadmap.title}`}
                title="Editar trilha"
                className="h-8 w-8 text-slate-500 hover:text-slate-200"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onDelete}
                aria-label={`Excluir trilha ${roadmap.title}`}
                title="Excluir trilha"
                className="h-8 w-8 text-slate-500 hover:bg-rose-500/10 hover:text-rose-300"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onToggle}
                aria-expanded={!collapsed}
                aria-controls={panelId}
                aria-label={collapsed ? "Expandir trilha" : "Recolher trilha"}
                title={collapsed ? "Expandir trilha" : "Recolher trilha"}
                className="h-8 w-8 text-slate-400 hover:text-white"
              >
                {collapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Progresso */}
          <div className="mt-4">
            <div className="flex items-center justify-between gap-3 text-[11px]">
              <span className="text-slate-500">
                {summary.completed} de {summary.total} concluídos
              </span>
              <span className="font-semibold" style={{ color: accent }}>
                {summary.progress}%
              </span>
            </div>
            <div
              className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={summary.progress}
              aria-label={`Progresso da trilha ${roadmap.title}`}
            >
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{ width: `${summary.progress}%`, backgroundColor: accent }}
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
              {statusCounts.map(({ status, count }) => {
                const meta = STATUS_META[status];
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
        <div id={panelId} className="border-t border-white/[0.05]">
          {roadmap.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-5 py-10 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.03] text-slate-500">
                <MoreHorizontal className="h-4 w-4" />
              </span>
              <p className="text-xs text-slate-500">
                Esta trilha ainda não tem itens de estudo.
              </p>
              <Button type="button" variant="outline" size="sm" onClick={onAddItem}>
                <Plus className="h-3.5 w-3.5" /> Adicionar primeiro item
              </Button>
            </div>
          ) : (
            <>
              <div className="divide-y divide-white/[0.04]">
                {roadmap.items.map((item) => (
                  <RoadmapItem
                    key={item.id}
                    item={item}
                    onStatusChange={onStatusChange}
                    onEdit={onEditItem}
                    onDelete={onDeleteItem}
                    onAddContent={() => {}}
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
