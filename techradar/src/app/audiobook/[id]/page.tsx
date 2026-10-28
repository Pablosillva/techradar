import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RelatedJobs } from "@/components/recommendations/related-jobs";
import { ExternalLink, ArrowLeft, Clock } from "lucide-react";
import { AddToLibraryButton } from "@/components/study/add-to-library-button";

interface AudiobookPageProps {
  params: Promise<{ id: string }>;
}

export default async function AudiobookPage({ params }: AudiobookPageProps) {
  const { id } = await params;

  const audiobook = await prisma.audiobook.findUnique({
    where: { id },
    include: {
      skills: {
        include: { skill: true },
      },
    },
  });

  if (!audiobook) {
    notFound();
  }

  const skills = audiobook.skills.map((s) => s.skill.slug);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link
        href="/busca?tab=audiobooks"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <ArrowLeft size={14} />
        Voltar para audiobooks
      </Link>

      <div className="mt-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {audiobook.title}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {audiobook.authors.join(", ")}
            </p>
          </div>
          {audiobook.isFree && (
            <Badge variant="success">Gratuito</Badge>
          )}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {audiobook.durationMin && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-gray-500 dark:text-gray-400">Duração</p>
                <p className="mt-1 flex items-center gap-1 font-semibold text-gray-900 dark:text-white">
                  <Clock size={14} aria-hidden="true" />
                  {Math.floor(audiobook.durationMin / 60)}h {audiobook.durationMin % 60}min
                </p>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-gray-500 dark:text-gray-400">Idioma</p>
              <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                {audiobook.language.toUpperCase()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-gray-500 dark:text-gray-400">Fonte</p>
              <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                {audiobook.source}
              </p>
            </CardContent>
          </Card>
        </div>

        {skills.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Skills cobertas
            </h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {skills.map((skill) => (
                <Badge key={skill} variant="default">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {audiobook.description && (
          <div className="mt-6">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Descrição
            </h2>
            <p className="mt-2 text-gray-700 dark:text-gray-300">
              {audiobook.description}
            </p>
          </div>
        )}

        <div className="mt-8">
          <Button asChild size="lg">
            <a href={audiobook.url} target="_blank" rel="noopener noreferrer">
              Acessar audiobook
              <ExternalLink size={16} className="ml-2" aria-hidden="true" />
            </a>
          </Button>
        </div>
        <AddToLibraryButton itemType="audiobook" itemId={audiobook.id} />
      </div>

      {/* Vagas relacionadas */}
      <div className="mt-12">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Vagas que pedem estas skills
        </h2>
        <RelatedJobs skills={skills} excludeType="audiobook" excludeId={audiobook.id} />
      </div>
    </div>
  );
}
