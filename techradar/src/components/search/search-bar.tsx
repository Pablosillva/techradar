"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  initialQuery?: string;
  placeholder?: string;
  size?: "default" | "large";
}

export function SearchBar({
  initialQuery = "",
  placeholder = "Busque por tecnologia, skill, cargo...",
  size = "default",
}: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (query.trim()) {
      params.set("q", query.trim());
    } else {
      params.delete("q");
    }
    params.delete("page"); // reseta paginação ao buscar
    router.push(`/busca?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full gap-2" role="search">
      <div className="relative flex-1">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={size === "large" ? 20 : 16}
          aria-hidden="true"
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          aria-label="Buscar"
          className={size === "large" ? "pl-10 h-12 text-base" : "pl-9"}
        />
      </div>
      <Button type="submit" size={size === "large" ? "lg" : "default"}>
        Buscar
      </Button>
    </form>
  );
}
