import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BookSummary } from "@/types/api";

interface BookCardProps {
  book: BookSummary;
}

export function BookCard({ book }: BookCardProps) {
  return (
    <Card className="flex flex-col transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-base leading-tight">
              <Link
                href={`/livro/${book.id}`}
                className="hover:text-blue-600 dark:hover:text-blue-400"
              >
                {book.title}
              </Link>
            </CardTitle>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {book.authors.join(", ")}
            </p>
          </div>
          {book.isFree && (
            <Badge variant="success">Gratuito</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span>{book.language.toUpperCase()}</span>
          <span>{book.source}</span>
        </div>

        {book.skills.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {book.skills.slice(0, 5).map((skill) => (
              <Badge key={skill} variant="outline" className="text-xs">
                {skill}
              </Badge>
            ))}
            {book.skills.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{book.skills.length - 5}
              </Badge>
            )}
          </div>
        )}

        <a
          href={book.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
        >
          Ver livro original
          <ExternalLink size={10} aria-hidden="true" />
        </a>
      </CardContent>
    </Card>
  );
}
