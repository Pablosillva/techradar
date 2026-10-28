import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RelatedJobs } from "@/components/recommendations/related-jobs";
import { ExternalLink, ArrowLeft, Star } from "lucide-react";

interface CursoPageProps {
  params: Promise<{ id: string }>;
}

export default async function CursoPage({ params }: CursoPageProps) {
  const { id } = await params;

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      skills: {
        include: { skill: true },
      },
    },
  });

  if (!course) {
    notFound();
  }

  const skills = course.skills.map((s) => s.skill.slug);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link
        href="/busca?tab=cursos"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <ArrowLeft size={14} />
        Voltar para cursos
      </Link>

      <div className="mt-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {course.title}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {course.provider}
            </p>
          </div>
          <Badge variant={course.isFree ? "success" : "warning"}>
            {course.isFree ? "Gratuito" : "Pago"}
          </Badge>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {course.level && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-gray-500 dark:text-gray-400">Nível</p>
                <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                  {course.level}
                </p>
              </CardContent>
            </Card>
          )}
          {course.rating && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-gray-500 dark:text-gray-400">Avaliação</p>
                <p className="mt-1 flex items-center gap-1 font-semibold text-gray-900 dark:text-white">
                  <Star size={14} className="fill-yellow-400 text-yellow-400" aria-hidden="true" />
                  {course.rating.toFixed(1)}
                </p>
              </CardContent>
            </Card>
          )}
          {!course.isFree && course.price != null && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-gray-500 dark:text-gray-400">Preço</p>
                <p className="mt-1 font-semibold text-green-600 dark:text-green-400">
                  ${course.price}
                </p>
              </CardContent>
            </Card>
          )}
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

        {course.description && (
          <div className="mt-6">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Descrição
            </h2>
            <p className="mt-2 text-gray-700 dark:text-gray-300">
              {course.description}
            </p>
          </div>
        )}

        <div className="mt-8">
          <Button asChild size="lg">
            <a href={course.url} target="_blank" rel="noopener noreferrer">
              Acessar curso
              <ExternalLink size={16} className="ml-2" aria-hidden="true" />
            </a>
          </Button>
        </div>
      </div>

      {/* Vagas relacionadas */}
      <div className="mt-12">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Vagas que pedem estas skills
        </h2>
        <RelatedJobs skills={skills} excludeType="course" excludeId={course.id} />
      </div>
    </div>
  );
}
