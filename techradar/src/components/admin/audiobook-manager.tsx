"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Edit2, Save, X } from "lucide-react";

export interface Audiobook {
  id: string;
  title: string;
  authors: string[];
  narrator: string | null;
  description: string | null;
  url: string;
  thumbnailUrl: string | null;
  language: string;
  durationMin: number | null;
  isFree: boolean;
  skills: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface AudiobookManagerProps {
  initialAudiobooks: Audiobook[];
}

export function AudiobookManager({ initialAudiobooks }: AudiobookManagerProps) {
  const [audiobooks, setAudiobooks] = useState<Audiobook[]>(initialAudiobooks);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string | boolean | number | string[] | null>>({});
  const [message, setMessage] = useState("");

  function startEdit(audiobook: Audiobook) {
    setEditingId(audiobook.id);
    setFormData({
      title: audiobook.title,
      authors: audiobook.authors.join(", "),
      narrator: audiobook.narrator ?? "",
      description: audiobook.description ?? "",
      url: audiobook.url,
      language: audiobook.language,
      isFree: audiobook.isFree,
      durationMin: audiobook.durationMin ?? 0,
      skillSlugs: audiobook.skills.join(","),
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setFormData({});
  }

  async function handleSave(audiobookId: string) {
    setMessage("");

    const payload = {
      title: String(formData.title ?? ""),
      authors: String(formData.authors ?? "")
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean),
      narrator: String(formData.narrator ?? ""),
      description: String(formData.description ?? ""),
      url: String(formData.url ?? ""),
      language: String(formData.language ?? "en"),
      isFree: Boolean(formData.isFree),
      durationMin: formData.durationMin ? Number(formData.durationMin) : null,
      skillSlugs: String(formData.skillSlugs ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    const res = await fetch(`/api/admin/audiobooks/${audiobookId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      setAudiobooks((prev) => prev.map((a) => (a.id === audiobookId ? data.data : a)));
      setEditingId(null);
      setMessage("Audiobook atualizado com sucesso!");
    } else {
      const error = await res.json();
      setMessage(error.error ?? "Erro ao atualizar audiobook");
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {audiobooks.map((audiobook) => (
          <Card key={audiobook.id}>
            <CardContent className="py-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {audiobook.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {audiobook.authors.join(", ")} {audiobook.narrator && `• Narrador: ${audiobook.narrator}`} •{" "}
                    {audiobook.language.toUpperCase()} •{" "}
                    {audiobook.durationMin ? `${Math.floor(audiobook.durationMin / 60)}h ${audiobook.durationMin % 60}min` : "?"} •{" "}
                    {audiobook.isFree ? "Gratuito" : "Pago"}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {audiobook.skills.map((skill) => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => (editingId === audiobook.id ? cancelEdit() : startEdit(audiobook))}
                >
                  {editingId === audiobook.id ? <X size={14} /> : <Edit2 size={14} />}
                  {editingId === audiobook.id ? "Cancelar" : "Editar"}
                </Button>
              </div>

              {editingId === audiobook.id && (
                <div className="mt-4 space-y-3 border-t pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      placeholder="Título"
                      value={String(formData.title ?? "")}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                    <Input
                      placeholder="Autores (separados por vírgula)"
                      value={String(formData.authors ?? "")}
                      onChange={(e) => setFormData({ ...formData, authors: e.target.value })}
                    />
                    <Input
                      placeholder="URL"
                      value={String(formData.url ?? "")}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    />
                    <Input
                      placeholder="Narrador"
                      value={String(formData.narrator ?? "")}
                      onChange={(e) => setFormData({ ...formData, narrator: e.target.value })}
                    />
                    <Input
                      placeholder="Duração em minutos"
                      type="number"
                      value={formData.durationMin ? String(formData.durationMin) : ""}
                      onChange={(e) => setFormData({ ...formData, durationMin: e.target.value ? Number(e.target.value) : null })}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={Boolean(formData.isFree)}
                        onChange={(e) => setFormData({ ...formData, isFree: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      Gratuito
                    </label>
                    <Button size="sm" onClick={() => handleSave(audiobook.id)}>
                      <Save size={14} className="mr-1" />
                      Salvar
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      {message && <p className="text-sm text-green-600 dark:text-green-400">{message}</p>}
    </div>
  );
}
