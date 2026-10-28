import { prisma } from "@/lib/prisma";
import { calculateMatchScore, getSourcePopularity } from "@/lib/skills/score";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { BookOpen, GraduationCap, Headphones, ExternalLink } from "lucide-react";

interface StudyPanelProps {
  originType: string;
  originId: string;
  originSkills: string[];
}

export async function StudyPanel({ originType, originId, originSkills }: StudyPanelProps) {
  if (originSkills.length === 0) {
    return (
      <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        Nenhuma skill identificada para esta item.
      </p>
    );
  }

  // Busca cursos, livros e audiobooks que têm pelo menos 1 skill em comum
  const [courses, books, audiobooks] = await Promise.all([
    prisma.course.findMany({
      where: {
        skills: {
          some: {
            skillId: {
              in: await prisma.skill.findMany({
                where: { slug: { in: originSkills } },
                select: { id: true },
              }).then((skills) => skills.map((s) => s.id)),
            },
          },
        },
      },
      include: { skills: { include: { skill: true } } },
      take: 20,
    }),
    prisma.book.findMany({
      where: {
        skills: {
          some: {
            skillId: {
              in: await prisma.skill.findMany({
                where: { slug: { in: originSkills } },
                select: { id: true },
              }).then((skills) => skills.map((s) => s.id)),
            },
          },
        },
      },
      include: { skills: { include: { skill: true } } },
      take: 20,
    }),
    prisma.audiobook.findMany({
      where: {
        skills: {
          some: {
            skillId: {
              in: await prisma.skill.findMany({
                where: { slug: { in: originSkills } },
                select: { id: true },
              }).then((skills) => skills.map((s) => s.id)),
            },
          },
        },
      },
      include: { skills: { include: { skill: true } } },
      take: 20,
    }),
  ]);

  // Calcula score e ordena
  const scoredCourses = courses
    .map((c) => {
      const targetSkills = c.skills.map((s) => s.skill.slug);
      const match = calculateMatchScore(originSkills, targetSkills, getSourcePopularity(c.source));
      return { ...c, ...match };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const scoredBooks = books
    .map((b) => {
      const targetSkills = b.skills.map((s) => s.skill.slug);
      const match = calculateMatchScore(originSkills, targetSkills, getSourcePopularity(b.source));
      return { ...b, ...match };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const scoredAudiobooks = audiobooks
    .map((a) => {
      const targetSkills = a.skills.map((s) => s.skill.slug);
      const match = calculateMatchScore(originSkills, targetSkills, getSourcePopularity(a.source));
      return { ...a, ...match };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return (
    <div className="mt-6 space-y-8">
      {/* Cursos recomendados */}
      {scoredCourses.length > 0 && (
        <section>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <GraduationCap size={20} className="text-blue-600 dark:text-blue-400" aria-hidden="true" />
            Cursos recomendados
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {scoredCourses.map((course) => (
              <Card key={course.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm">
                      <Link
                        href={`/curso/${course.id}`}
                        className="hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        {course.title}
                      </Link>
                    </CardTitle>
                    <Badge variant={course.isFree ? "success" : "warning"} className="shrink-0">
                      {course.isFree ? "Grátis" : "Pago"}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {course.provider}
                  </p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {course.reason}
                    </p>
                    <a
                      href={course.url}
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
        </section>
      )}

      {/* Livros recomendados */}
      {scoredBooks.length > 0 && (
        <section>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <BookOpen size={20} className="text-green-600 dark:text-green-400" aria-hidden="true" />
            Livros recomendados
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {scoredBooks.map((book) => (
              <Card key={book.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm">
                      <Link
                        href={`/livro/${book.id}`}
                        className="hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        {book.title}
                      </Link>
                    </CardTitle>
                    {book.isFree && (
                      <Badge variant="success" className="shrink-0">Grátis</Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {book.authors.join(", ")}
                  </p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {book.reason}
                    </p>
                    <a
                      href={book.url}
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
        </section>
      )}

      {/* Audiobooks recomendados */}
      {scoredAudiobooks.length > 0 && (
        <section>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <Headphones size={20} className="text-purple-600 dark:text-purple-400" aria-hidden="true" />
            Audiobooks recomendados
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {scoredAudiobooks.map((audiobook) => (
              <Card key={audiobook.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm">
                      <Link
                        href={`/audiobook/${audiobook.id}`}
                        className="hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        {audiobook.title}
                      </Link>
                    </CardTitle>
                    {audiobook.isFree && (
                      <Badge variant="success" className="shrink-0">Grátis</Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {audiobook.authors.join(", ")}
                  </p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {audiobook.reason}
                    </p>
                    <a
                      href={audiobook.url}
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
        </section>
      )}

      {scoredCourses.length === 0 && scoredBooks.length === 0 && scoredAudiobooks.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Nenhuma recomendação encontrada para as skills: {originSkills.join(", ")}
        </p>
      )}
    </div>
  );
}
