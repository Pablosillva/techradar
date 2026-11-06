"use client";

import { useEffect, useState } from "react";
import {
  Clock3,
  ExternalLink,
  Loader2,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { STATUS_META, formatDuration, safeHttpUrl } from "@/lib/roadmap/presentation";
import type {
  RoadmapItemDto,
  RoadmapItemStatus,
  ROADMAP_ITEM_STATUSES,
} from "@/lib/roadmap/types";
import { cn } from "@/lib/utils";

interface RoadmapItemProps {
  item: RoadmapItemDto;
  onStatusChange: (item: RoadmapItemDto, status: RoadmapItemStatus) => Promise<boolean>;
  onEdit: (item: RoadmapItemDto) => void;
  onDelete: (item: RoadmapItemDto) => void;
  onAddContent: (item: RoadmapItemDto) => void;
}

export function RoadmapItem({
  item,
  onStatusChange,
  onEdit,
  onDelete,
  onAddContent,
}: RoadmapItemProps) {
  const [status, setStatus] = useState<RoadmapItemStatus>(item.status);
  const [savingStatus, setSavingStatus] = useState(false);

  useEffect(() => {
    setStatus(item.status);
  }, [item.status]);

  const statusMeta = STATUS_META[status] ?? STATUS_META.NOT_STARTED;
  const resourceUrl = safeHttpUrl(item.resourceUrl);
  const estimated = formatDuration(item.estimatedMinutes);

  async function handleStatusChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value as RoadmapItemStatus;
    const previous = status;
    setStatus(next);
    setSavingStatus(true);
    const success = await onStatusChange(item, next);
    if (!success) setStatus(previous);
    setSavingStatus(false);
  }

  return (
    <div className="px-4 py-4 transition-colors hover:bg-white/[0.015] sm:px-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
        {/* Status */}
        <div className="flex shrink-0 items-center gap-2 lg:w-[170px]">
          <span className={cn("h-2 w-2 shrink-0 rounded-full", statusMeta.dot)} aria-hidden="true" />
          <Select
            value={status}
            onChange={handleStatusChange}
            disabled={savingStatus}
            aria-label={`Status do item ${item.title}`}
            className={cn("h-8 text-[11px] font-medium", statusMeta.select)}
          >
            {ROADMAP_ITEM_STATUSES.map((value) => (
              <option key={value} value={value}>
                {STATUS_META[value].label}
              </option>
            ))}
          </Select>
          {savingStatus && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-slate-500" />}
        </div>

        {/* Conteúdo do item */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-100">{item.title}</h3>
            {estimated && (
              <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                <Clock3 className="h-3 w-3" /> {estimated}
              </span>
            )}
            {resourceUrl && (
              <a
                href={resourceUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="inline-flex items-center gap-1 rounded-md border border-cyan-400/20 bg-cyan-400/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-cyan-300 transition-colors hover:bg-cyan-400/10"
              >
                Link oficial <ExternalLink className="h-2.5 w-2.5" />
              </a>
            )}
          </div>

          {item.description && (
            <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-400">
              {item.description}
            </p>
          )}

          {/* Botão para adicionar conteúdo */}
          <button
            type="button"
            onClick={() => onAddContent(item)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-300/80 transition-colors hover:text-cyan-300 mt-2"
          >
            <Plus className="h-3 w-3" /> Adicionar conteúdo teórico
          </button>
        </div>

        {/* Ações do item */}
        <div className="flex shrink-0 items-center gap-1 self-end lg:self-start">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onEdit(item)}
            aria-label={`Editar item ${item.title}`}
            title="Editar item"
            className="h-8 w-8 text-slate-500 hover:text-slate-200"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onDelete(item)}
            aria-label={`Excluir item ${item.title}`}
            title="Excluir item"
            className="h-8 w-8 text-slate-500 hover:bg-rose-500/10 hover:text-rose-300"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
