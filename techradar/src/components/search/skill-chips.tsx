"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface SkillChipsProps {
  skills: Array<{ slug: string; name: string; count: number }>;
}

export function SkillChips({ skills }: SkillChipsProps) {
  const searchParams = useSearchParams();

  if (skills.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2" aria-label="Skills populares">
      {skills.map((skill) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("q", skill.slug);
        params.set("tab", "tudo");
        params.delete("page");

        return (
          <Link
            key={skill.slug}
            href={`/busca?${params.toString()}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-blue-700 dark:hover:bg-blue-950 dark:hover:text-blue-300"
          >
            {skill.name}
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {skill.count}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
