import Link from "next/link";
import { ExternalLink, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AudiobookSummary } from "@/types/api";

interface AudiobookCardProps {
  audiobook: AudiobookSummary;
}

export function AudiobookCard({ audiobook }: AudiobookCardProps) {
  return (
    <Card className="flex flex-col transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-base leading-tight">
              <Link
                href={`/audiobook/${audiobook.id}`}
                className="hover:text-blue-600 dark:hover:text-blue-400"
              >
                {audiobook.title}
              </Link>
            </CardTitle>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {audiobook.authors.join(", ")}
            </p>
          </div>
          {audiobook.isFree && (
            <Badge variant="success">Gratuito</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span>{audiobook.language.toUpperCase()}</span>
          {audiobook.durationMin && (
            <span className="flex items-center gap-1">
              <Clock size={12} aria-hidden="true" />
              {Math.floor(audiobook.durationMin / 60)}h {audiobook.durationMin % 60}min
            </span>
          )}
          <span>{audiobook.source}</span>
        </div>

        {audiobook.skills.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {audiobook.skills.slice(0, 5).map((skill) => (
              <Badge key={skill} variant="outline" className="text-xs">
                {skill}
              </Badge>
            ))}
            {audiobook.skills.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{audiobook.skills.length - 5}
              </Badge>
            )}
          </div>
        )}

        <a
          href={audiobook.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
        >
          Ver audiobook original
          <ExternalLink size={10} aria-hidden="true" />
        </a>
      </CardContent>
    </Card>
  );
}
