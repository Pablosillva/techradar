import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RelatedJobs } from "@/components/recommendations/related-jobs";
import { ExternalLink, ArrowLeft } from "lucide-react";
import { AddToLibraryButton } from "@/components/study/add-to-library-button";

interface LivroPageProps {
  params: Promise<{ id: string }>;
}

export default async function LivroPage({ params }: LivroPageProps) {
  const { id } = await params;

  const book = await prisma.book.findUnique({
    where: { id },
    include: {
      skills: {
        include: { skill: true },
      },
    },
  });

  if (!book) {
    notFound();
  }

  const skills = book.skills.map((s) => s.skill.slug);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link
        href="/busca?tab=livros"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <ArrowLeft size={14} />
        Voltar para livros
      </Link>

      <div className="mt-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {book.title}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {book.authors.join(", ")}
            </p>
          </div>
          {book.isFree && (
            <Badge variant="success">Gratuito</Badge>
          )}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {book.publisher && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-gray-500 dark:text-gray-400">Editora</p>
                <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                  {book.publisher}
                </p>
              </CardContent>
            </Card>
          )}
          {book.pageCount && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-gray-500 dark:text-gray-400">Páginas</p>
                <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                  {book.pageCount}
                </p>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-gray-500 dark:text-gray-400">Idioma</p>
              <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                {book.language.toUpperCase()}
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

        {book.description && (
          <div className="mt-6">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Descrição
            </h2>
            <p className="mt-2 text-gray-700 dark:text-gray-300">
              {book.description}
            </p>
          </div>
        )}

        <div className="mt-8">
          <Button asChild size="lg">
            <a href={book.url} target="_blank" rel="noopener noreferrer">
              Acessar livro
              <ExternalLink size={16} className="ml-2" aria-hidden="true" />
            </a>
          </Button>
        </div>
        <AddToLibraryButton itemType="book" itemId={book.id} />
      </div>

      {/* Vagas relacionadas */}
      <div className="mt-12">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Vagas que pedem estas skills
        </h2>
        <RelatedJobs skills={skills} excludeType="book" excludeId={book.id} />
      </div>
    </div>
  );
}
