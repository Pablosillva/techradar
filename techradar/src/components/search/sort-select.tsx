"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/select";

interface SortOption {
  value: string;
  label: string;
}

interface SortSelectProps {
  options: SortOption[];
  defaultValue?: string;
}

export function SortSelect({ options, defaultValue = "relevance" }: SortSelectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    params.delete("page");
    router.push(`/busca?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort" className="text-sm text-gray-500 dark:text-gray-400">
        Ordenar:
      </label>
      <Select
        id="sort"
        value={searchParams.get("sort") ?? defaultValue}
        onChange={(e) => handleChange(e.target.value)}
        className="w-40"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
