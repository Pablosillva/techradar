import { CardSkeleton } from "@/components/cards/card-skeleton";

export function SearchSkeleton() {
  return (
    <div className="flex gap-8">
      <div className="hidden w-64 shrink-0 lg:block">
        <div className="space-y-4">
          <div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-8 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-8 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-8 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>
      <div className="flex-1">
        <div className="mb-4 h-4 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
