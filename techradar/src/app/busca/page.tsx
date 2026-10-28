import { Suspense } from "react";
import { SearchTabs } from "@/components/search/search-tabs";
import { SearchResults } from "./search-results";
import { SearchSkeleton } from "./search-skeleton";

interface BuscaPageProps {
  searchParams: Promise<{
    q?: string;
    tab?: string;
    page?: string;
    remote?: string;
    level?: string;
    free?: string;
    language?: string;
    salary?: string;
    sort?: string;
    skill?: string;
  }>;
}

export default async function BuscaPage({ searchParams }: BuscaPageProps) {
  const rawParams = await searchParams;
  const activeTab = rawParams.tab ?? "tudo";
  const query = rawParams.q ?? "";

  // Converte para Record<string, string>
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(rawParams)) {
    if (value) params[key] = value;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <SearchTabs activeTab={activeTab} />

      <div className="mt-6">
        <Suspense fallback={<SearchSkeleton />}>
          <SearchResults
            query={query}
            tab={activeTab}
            searchParams={params}
          />
        </Suspense>
      </div>
    </div>
  );
}
