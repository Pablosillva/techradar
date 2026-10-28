"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";

export interface JobSource {
  id: string;
  name: string;
  url: string;
  source: string;
  isActive: boolean;
  isDefault?: boolean;
}

interface JobSourcesManagerProps {
  initialSources: JobSource[];
}

export function JobSourcesManager({ initialSources }: JobSourcesManagerProps) {
  const [sources, setSources] = useState<JobSource[]>(initialSources);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [source, setSource] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [message, setMessage] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    const res = await fetch("/api/admin/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, url, source, isActive }),
    });

    if (res.ok) {
      const data = await res.json();
      setSources((prev) => [...prev, data.data]);
      setName("");
      setUrl("");
      setSource("");
      setIsActive(true);
      setMessage("Fonte adicionada com sucesso!");
    } else {
      const error = await res.json();
      setMessage(error.error ?? "Erro ao adicionar fonte");
    }
  }

  async function handleToggle(source: JobSource) {
    const res = await fetch(`/api/admin/sources/${source.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...source, isActive: !source.isActive }),
    });
    if (res.ok) {
      const data = await res.json();
      setSources((prev) => prev.map((s) => (s.id === source.id ? data.data : s)));
    }
  }

  async function handleDelete(sourceId: string) {
    const res = await fetch(`/api/admin/sources/${sourceId}`, { method: "DELETE" });
    if (res.ok) {
      setSources((prev) => prev.filter((s) => s.id !== sourceId));
    }
  }

  return (
    <div className="space-y-4">
      {/* Lista de fontes */}
      <div className="space-y-2">
        {sources.map((source) => (
          <Card key={source.id}>
            <CardContent className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {source.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {source.url} {source.isDefault && "• Padrão"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggle(source)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    source.isActive
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  }`}
                >
                  {source.isActive ? "Ativo" : "Inativo"}
                </button>
                {!source.isDefault && (
                  <button
                    onClick={() => handleDelete(source.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded-md"
                    aria-label={`Remover ${source.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Form de adicionar fonte */}
      <form onSubmit={handleAdd} className="flex flex-wrap gap-2">
        <Input
          placeholder="Nome (ex: Trampos)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-40"
        />
        <Input
          placeholder="URL da API/site"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          className="flex-1 min-w-56"
        />
        <Input
          placeholder="Chave source (ex: trampos)"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          required
          className="w-40"
        />
        <Button type="submit">
          <Plus size={16} className="mr-1" />
          Adicionar
        </Button>
      </form>

      {message && <p className="text-sm text-green-600 dark:text-green-400">{message}</p>}
    </div>
  );
}
