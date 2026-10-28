"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface FilterOption {
  value: string;
  label: string;
}

interface FilterSidebarProps {
  // Filtros específicos por tipo
  showRemote?: boolean;
  showLevel?: boolean;
  showFree?: boolean;
  showLanguage?: boolean;
  showSalary?: boolean;
  showSource?: boolean;
  showSkill?: boolean;

  levelOptions?: FilterOption[];
  languageOptions?: FilterOption[];
  sourceOptions?: FilterOption[];
  skillOptions?: FilterOption[];

  // Valores ativos
  activeFilters: Record<string, string>;
}

export function FilterSidebar({
  showRemote = false,
  showLevel = false,
  showFree = false,
  showLanguage = false,
  showSalary = false,
  showSource = false,
  showSkill = false,
  levelOptions = [],
  languageOptions = [],
  sourceOptions = [],
  skillOptions = [],
  activeFilters,
}: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`/busca?${params.toString()}`);
  }

  function clearAllFilters() {
    const params = new URLSearchParams(searchParams.toString());
    // Mantém apenas q e tab
    const q = params.get("q");
    const tab = params.get("tab");
    const newParams = new URLSearchParams();
    if (q) newParams.set("q", q);
    if (tab) newParams.set("tab", tab);
    router.push(`/busca?${newParams.toString()}`);
  }

  const hasActiveFilters = Object.keys(activeFilters).length > 0;

  return (
    <aside className="space-y-6" aria-label="Filtros">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Filtros
        </h2>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-blue-600 hover:underline dark:text-blue-400"
          >
            Limpar todos
          </button>
        )}
      </div>

      {/* Filtro Remoto/Presencial */}
      {showRemote && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Modalidade
          </label>
          <div className="flex gap-2">
            {[
              { value: "", label: "Todas" },
              { value: "true", label: "Remoto" },
              { value: "false", label: "Presencial" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateFilter("remote", opt.value)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  (activeFilters.remote ?? "") === opt.value
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filtro Nível */}
      {showLevel && levelOptions.length > 0 && (
        <div className="space-y-2">
          <label
            htmlFor="filter-level"
            className="text-xs font-medium text-gray-500 dark:text-gray-400"
          >
            Nível
          </label>
          <Select
            id="filter-level"
            value={activeFilters.level ?? ""}
            onChange={(e) => updateFilter("level", e.target.value)}
          >
            <option value="">Todos os níveis</option>
            {levelOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
      )}

      {/* Filtro Fonte (Vagas) */}
      {showSource && sourceOptions.length > 0 && (
        <div className="space-y-2">
          <label
            htmlFor="filter-source"
            className="text-xs font-medium text-gray-500 dark:text-gray-400"
          >
            Fonte
          </label>
          <Select
            id="filter-source"
            value={activeFilters.source ?? ""}
            onChange={(e) => updateFilter("source", e.target.value)}
          >
            <option value="">Todas as fontes</option>
            {sourceOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
      )}

      {/* Filtro Skill */}
      {showSkill && skillOptions.length > 0 && (
        <div className="space-y-2">
          <label
            htmlFor="filter-skill"
            className="text-xs font-medium text-gray-500 dark:text-gray-400"
          >
            Skill
          </label>
          <Select
            id="filter-skill"
            value={activeFilters.skill ?? ""}
            onChange={(e) => updateFilter("skill", e.target.value)}
          >
            <option value="">Todas as skills</option>
            {skillOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
      )}

      {/* Filtro Gratuito/Pago */}
      {showFree && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Preço
          </label>
          <div className="flex gap-2">
            {[
              { value: "", label: "Todos" },
              { value: "true", label: "Gratuito" },
              { value: "false", label: "Pago" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateFilter("free", opt.value)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  (activeFilters.free ?? "") === opt.value
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filtro Idioma */}
      {showLanguage && languageOptions.length > 0 && (
        <div className="space-y-2">
          <label
            htmlFor="filter-language"
            className="text-xs font-medium text-gray-500 dark:text-gray-400"
          >
            Idioma
          </label>
          <Select
            id="filter-language"
            value={activeFilters.language ?? ""}
            onChange={(e) => updateFilter("language", e.target.value)}
          >
            <option value="">Todos os idiomas</option>
            {languageOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
      )}

      {/* Filtro Salário */}
      {showSalary && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Faixa salarial
          </label>
          <div className="flex gap-2">
            {[
              { value: "", label: "Qualquer" },
              { value: "0-5000", label: "Até $5k" },
              { value: "5000-10000", label: "$5k - $10k" },
              { value: "10000-15000", label: "$10k - $15k" },
              { value: "15000-", label: "$15k+" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateFilter("salary", opt.value)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  (activeFilters.salary ?? "") === opt.value
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tags de filtros ativos */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(activeFilters).map(([key, value]) => (
            <Badge
              key={key}
              variant="secondary"
              className="cursor-pointer"
              onClick={() => updateFilter(key, "")}
            >
              {key}: {value} ×
            </Badge>
          ))}
        </div>
      )}
    </aside>
  );
}
