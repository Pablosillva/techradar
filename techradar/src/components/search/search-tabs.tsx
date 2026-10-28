"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Briefcase, GraduationCap, BookOpen, Headphones, LayoutGrid } from "lucide-react";

const TABS = [
  { id: "vagas", label: "Vagas", icon: Briefcase },
  { id: "cursos", label: "Cursos", icon: GraduationCap },
  { id: "livros", label: "Livros", icon: BookOpen },
  { id: "audiobooks", label: "Audiobooks", icon: Headphones },
  { id: "tudo", label: "Tudo", icon: LayoutGrid },
] as const;

interface SearchTabsProps {
  activeTab: string;
}

export function SearchTabs({ activeTab }: SearchTabsProps) {
  const searchParams = useSearchParams();

  return (
    <div className="flex flex-wrap gap-1 border-b border-gray-200 dark:border-gray-800" role="tablist">
      {TABS.map((tab) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", tab.id);
        params.delete("page");
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <Link
            key={tab.id}
            href={`/busca?${params.toString()}`}
            role="tab"
            aria-selected={isActive}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
              isActive
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200"
            )}
          >
            <Icon size={16} aria-hidden="true" />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
