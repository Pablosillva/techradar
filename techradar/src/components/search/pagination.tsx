"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  searchParams: Record<string, string>;
}

export function Pagination({ currentPage, totalPages, searchParams }: PaginationProps) {
  const params = new URLSearchParams();

  // Preserva todos os query params existentes
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value && key !== "page") {
      params.set(key, value);
    }
  });

  function getPageUrl(page: number) {
    const p = new URLSearchParams(params.toString());
    p.set("page", String(page));
    return `/busca?${p.toString()}`;
  }

  // Mostra no máximo 5 páginas ao redor da atual
  const getVisiblePages = () => {
    const pages: number[] = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Paginação">
      <Button
        variant="outline"
        size="icon"
        asChild
        disabled={currentPage <= 1}
        aria-label="Página anterior"
      >
        <Link href={getPageUrl(currentPage - 1)}>
          <ChevronLeft size={16} />
        </Link>
      </Button>

      {getVisiblePages().map((page) => (
        <Button
          key={page}
          variant={page === currentPage ? "default" : "outline"}
          size="sm"
          asChild
        >
          <Link href={getPageUrl(page)} aria-current={page === currentPage ? "page" : undefined}>
            {page}
          </Link>
        </Button>
      ))}

      <Button
        variant="outline"
        size="icon"
        asChild
        disabled={currentPage >= totalPages}
        aria-label="Próxima página"
      >
        <Link href={getPageUrl(currentPage + 1)}>
          <ChevronRight size={16} />
        </Link>
      </Button>
    </nav>
  );
}
