import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StudyPanel } from "@/components/recommendations/study-panel";
import { formatSalary, timeAgo } from "@/lib/utils";
import { MapPin, Clock, Building2, ExternalLink, ArrowLeft } from "lucide-react";

interface VagaPageProps {
  params: Promise<{ id: string }>;
}

export default async function VagaPage({ params }: VagaPageProps) {
  const { id } = await params;

  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      skills: {
        include: { skill: true },
      },
    },
  });

  if (!job || !job.isActive) {
    notFound();
  }

  const salary = formatSalary(job.salaryMin, job.salaryMax, job.currency);
  const skills = job.skills.map((s) => s.skill.slug);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Breadcrumb */}
      <Link
        href="/busca?tab=vagas"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <ArrowLeft size={14} />
        Voltar para vagas
      </Link>

      {/* Header */}
      <div className="mt-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {job.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Building2 size={14} aria-hidden="true" />
                {job.company}
              </span>
              {job.location && (
                <span className="flex items-center gap-1">
                  <MapPin size={14} aria-hidden="true" />
                  {job.location}
                </span>
              )}
              {job.postedAt && (
                <span className="flex items-center gap-1">
                  <Clock size={14} aria-hidden="true" />
                  {timeAgo(job.postedAt)}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant={job.isRemote ? "success" : "secondary"}>
              {job.isRemote ? "Remoto" : "Presencial"}
            </Badge>
            {job.level && <Badge variant="outline">{job.level}</Badge>}
          </div>
        </div>

        {/* Info cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {salary && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-gray-500 dark:text-gray-400">Salário</p>
                <p className="mt-1 text-lg font-semibold text-green-600 dark:text-green-400">
                  {salary}
                </p>
              </CardContent>
            </Card>
          )}
          {job.jobType && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-gray-500 dark:text-gray-400">Tipo</p>
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                  {job.jobType}
                </p>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-gray-500 dark:text-gray-400">Fonte</p>
              <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                {job.source}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Skills */}
        {skills.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Skills exigidas
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

        {/* Descrição */}
        <div className="mt-6">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Descrição
          </h2>
          <div
            className="prose prose-sm mt-2 max-w-none text-gray-700 dark:text-gray-300"
            dangerouslySetInnerHTML={{ __html: job.description }}
          />
        </div>

        {/* CTA */}
        <div className="mt-8 flex gap-4">
          <Button asChild size="lg">
            <a href={job.url} target="_blank" rel="noopener noreferrer">
              Candidatar-se
              <ExternalLink size={16} className="ml-2" aria-hidden="true" />
            </a>
          </Button>
        </div>
      </div>

      {/* Painel de recomendações */}
      <div className="mt-12">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Estudar para esta vaga
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Cursos, livros e audiobooks que cobrem as skills exigidas
        </p>
        <StudyPanel originType="job" originId={job.id} originSkills={skills} />
      </div>
    </div>
  );
}
