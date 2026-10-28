"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function NewMindMapForm() {
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/mindmaps", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, topic }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        router.push(`/mapas/${json.data?.id ?? ""}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={create} className="mt-8 flex flex-col gap-3 sm:flex-row">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Título do mapa (ex: React Hooks)"
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
        required
      />
      <input
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="Tópico central (ex: useEffect)"
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
        required
      />
      <Button type="submit" disabled={loading || !title || !topic}>
        {loading ? "Criando..." : "Criar mapa"}
      </Button>
    </form>
  );
}
