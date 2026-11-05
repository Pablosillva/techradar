"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  CONTENT_TYPE_META,
  LEVEL_META,
  STATUS_META,
} from "@/lib/roadmap/presentation";
import {
  ROADMAP_ITEM_STATUSES,
  ROADMAP_LEVELS,
  STUDY_CONTENT_TYPES,
  type RoadmapDto,
  type RoadmapItemDto,
  type RoadmapItemStatus,
  type RoadmapLevel,
  type StudyContentDto,
  type StudyContentType,
} from "@/lib/roadmap/types";

const labelClass = "text-xs font-medium text-slate-300";
const hintClass = "mt-1 text-[11px] text-slate-500";

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
      </label>
      {children}
      {hint && <p className={hintClass}>{hint}</p>}
    </div>
  );
}

export interface TrackFormPayload {
  title: string;
  description: string | null;
  goal: string | null;
  level: RoadmapLevel;
  color: string;
  order: number;
}

interface TrackFormProps {
  initial?: RoadmapDto;
  nextOrder: number;
  saving: boolean;
  onSubmit: (payload: TrackFormPayload) => void;
  onCancel: () => void;
}

export function TrackForm({ initial, nextOrder, saving, onSubmit, onCancel }: TrackFormProps) {
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    onSubmit({
      title: String(form.get("title") ?? "").trim(),
      description: String(form.get("description") ?? "").trim() || null,
      goal: String(form.get("goal") ?? "").trim() || null,
      level: String(form.get("level") ?? "beginner") as RoadmapLevel,
      color: String(form.get("color") ?? "#22d3ee"),
      order: initial?.order ?? nextOrder,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Título da trilha" htmlFor="track-title">
        <Input
          id="track-title"
          name="title"
          required
          minLength={3}
          maxLength={120}
          defaultValue={initial?.title ?? ""}
          placeholder="Ex: Full Stack JavaScript"
          autoFocus
        />
      </Field>

      <Field
        label="Descrição"
        htmlFor="track-description"
        hint="Um resumo do que será estudado nesta trilha."
      >
        <Textarea
          id="track-description"
          name="description"
          rows={3}
          maxLength={5000}
          defaultValue={initial?.description ?? ""}
          placeholder="Frontend, backend, banco de dados e deploy..."
        />
      </Field>

      <Field label="Objetivo" htmlFor="track-goal" hint="Onde você quer chegar com esta trilha?">
        <Textarea
          id="track-goal"
          name="goal"
          rows={2}
          maxLength={2000}
          defaultValue={initial?.goal ?? ""}
          placeholder="Ex: conseguir minha primeira vaga como desenvolvedor full stack"
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_120px]">
        <Field label="Nível" htmlFor="track-level">
          <Select id="track-level" name="level" defaultValue={initial?.level ?? "beginner"}>
            {ROADMAP_LEVELS.map((level) => (
              <option key={level} value={level}>
                {LEVEL_META[level].label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Cor" htmlFor="track-color">
          <input
            id="track-color"
            name="color"
            type="color"
            defaultValue={initial?.color ?? "#22d3ee"}
            className="h-10 w-full cursor-pointer rounded-lg border border-line bg-panel-2/80 p-1"
          />
        </Field>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-white/[0.06] pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {initial ? "Salvar trilha" : "Criar trilha"}
        </Button>
      </div>
    </form>
  );
}

export interface ItemFormPayload {
  title: string;
  description: string | null;
  status: RoadmapItemStatus;
  estimatedMinutes: number | null;
  resourceUrl: string | null;
}

interface ItemFormProps {
  initial?: RoadmapItemDto;
  saving: boolean;
  onSubmit: (payload: ItemFormPayload) => void;
  onCancel: () => void;
}

export function ItemForm({ initial, saving, onSubmit, onCancel }: ItemFormProps) {
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const estimated = String(form.get("estimatedMinutes") ?? "").trim();

    onSubmit({
      title: String(form.get("title") ?? "").trim(),
      description: String(form.get("description") ?? "").trim() || null,
      status: String(form.get("status") ?? "NOT_STARTED") as RoadmapItemStatus,
      estimatedMinutes: estimated ? Number(estimated) : null,
      resourceUrl: String(form.get("resourceUrl") ?? "").trim() || null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Título do item" htmlFor="item-title">
        <Input
          id="item-title"
          name="title"
          required
          minLength={3}
          maxLength={160}
          defaultValue={initial?.title ?? ""}
          placeholder="Ex: React — componentes e estado"
          autoFocus
        />
      </Field>

      <Field label="Descrição" htmlFor="item-description">
        <Textarea
          id="item-description"
          name="description"
          rows={3}
          maxLength={5000}
          defaultValue={initial?.description ?? ""}
          placeholder="O que você precisa aprender ou praticar neste item?"
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Status" htmlFor="item-status">
          <Select id="item-status" name="status" defaultValue={initial?.status ?? "NOT_STARTED"}>
            {ROADMAP_ITEM_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_META[status].label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Tempo estimado (min)" htmlFor="item-estimated">
          <Input
            id="item-estimated"
            name="estimatedMinutes"
            type="number"
            min={1}
            max={6000}
            defaultValue={initial?.estimatedMinutes ?? ""}
            placeholder="Ex: 60"
          />
        </Field>
      </div>

      <Field
        label="Link oficial (opcional)"
        htmlFor="item-resource"
        hint="Apenas links http/https. Ex: documentação oficial, curso ou artigo."
      >
        <Input
          id="item-resource"
          name="resourceUrl"
          type="url"
          maxLength={2048}
          defaultValue={initial?.resourceUrl ?? ""}
          placeholder="https://react.dev/learn"
        />
      </Field>

      <div className="flex flex-col-reverse gap-2 border-t border-white/[0.06] pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {initial ? "Salvar item" : "Adicionar item"}
        </Button>
      </div>
    </form>
  );
}

export interface ContentFormPayload {
  title: string;
  type: StudyContentType;
  content: string | null;
  url: string | null;
}

interface ContentFormProps {
  initial?: StudyContentDto;
  saving: boolean;
  onSubmit: (payload: ContentFormPayload) => void;
  onCancel: () => void;
}

export function ContentForm({ initial, saving, onSubmit, onCancel }: ContentFormProps) {
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const content = String(form.get("content") ?? "").trim();
    const url = String(form.get("url") ?? "").trim();

    if (!content && !url) {
      setError("Informe o conteúdo teórico ou um link oficial.");
      return;
    }

    setError(null);
    onSubmit({
      title: String(form.get("title") ?? "").trim(),
      type: String(form.get("type") ?? "NOTE") as StudyContentType,
      content: content || null,
      url: url || null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Título do conteúdo" htmlFor="content-title">
        <Input
          id="content-title"
          name="title"
          required
          minLength={3}
          maxLength={160}
          defaultValue={initial?.title ?? ""}
          placeholder="Ex: Documentação oficial do React"
          autoFocus
        />
      </Field>

      <Field label="Tipo" htmlFor="content-type">
        <Select id="content-type" name="type" defaultValue={initial?.type ?? "NOTE"}>
          {STUDY_CONTENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {CONTENT_TYPE_META[type].label}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="Conteúdo teórico"
        htmlFor="content-body"
        hint="Exibido como texto seguro, sem executar HTML."
      >
        <Textarea
          id="content-body"
          name="content"
          rows={7}
          maxLength={100_000}
          defaultValue={initial?.content ?? ""}
          placeholder="Resumo, anotações, passos de um tutorial..."
        />
      </Field>

      <Field
        label="Link oficial (opcional)"
        htmlFor="content-url"
        hint="Use http/https. Você pode preencher só o link, só o texto, ou ambos."
      >
        <Input
          id="content-url"
          name="url"
          type="url"
          maxLength={2048}
          defaultValue={initial?.url ?? ""}
          placeholder="https://developer.mozilla.org/..."
        />
      </Field>

      {error && (
        <p role="alert" className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs text-rose-300">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 border-t border-white/[0.06] pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {initial ? "Salvar conteúdo" : "Adicionar conteúdo"}
        </Button>
      </div>
    </form>
  );
}
