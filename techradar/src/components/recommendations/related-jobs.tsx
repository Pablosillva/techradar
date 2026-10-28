import { prisma } from "@/lib/prisma";
import { calculateMatchScore, getSourcePopularity } from "@/lib/skills/score";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

interface RelatedJobsProps {
  skills: string[];
  excludeType?: string;
  excludeId?: string;
}

export async function RelatedJobs({ skills, excludeType, excludeId }: RelatedJobsProps) {
  if (skills.length === 0) {
    return (
      <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        Nenhuma skill identificada.
      </p>
    );
  }

  // Busca vagas que têm pelo menos 1 skill em comum
  const skillIds = await prisma.skill.findMany({
    where: { slug: { in: skills } },
    select: { id: true },
  }).then((s) => s.map((skill) => skill.id));

  const jobs = await prisma.job.findMany({
    where: {
      isActive: true,
      skills: {
        some: {
          skillId: { in: skillIds },
        },
      },
    },
    include: { skills: { include: { skill: true } } },
    take: 20,
  });

  // Calcula score e ordena
  const scoredJobs = jobs
    .map((job) => {
      const targetSkills = job.skills.map((s) => s.skill.slug);
      const match = calculateMatchScore(skills, targetSkills, getSourcePopularity(job.source));
      return { ...job, ...match };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  if (scoredJobs.length === 0) {
    return (
      <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        Nenhuma vaga encontrada para as skills: {skills.join(", ")}
      </p>
    );
  }

  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {scoredJobs.map((job) => (
        <Card key={job.id}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-sm">
                <Link
                  href={`/vaga/${job.id}`}
                  className="hover:text-blue-600 dark:hover:text-blue-400"
                >
                  {job.title}
                </Link>
              </CardTitle>
              <Badge variant={job.isRemote ? "success" : "secondary"} className="shrink-0">
                {job.isRemote ? "Remoto" : "Presencial"}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {job.company}
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {job.reason}
              </p>
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline dark:text-blue-400"
              >
                <ExternalLink size={10} className="inline" aria-hidden="true" />
              </a>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
