import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { JobCard } from "@/components/cards/job-card";
import { CourseCard } from "@/components/cards/course-card";
import { BookCard } from "@/components/cards/book-card";
import { AudiobookCard } from "@/components/cards/audiobook-card";
import type { JobSummary, CourseSummary, BookSummary, AudiobookSummary } from "@/types/api";

export default async function FavoritosPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/entrar");
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  // Busca os itens favoritados
  const jobIds = favorites.filter((f) => f.itemType === "job").map((f) => f.itemId);
  const courseIds = favorites.filter((f) => f.itemType === "course").map((f) => f.itemId);
  const bookIds = favorites.filter((f) => f.itemType === "book").map((f) => f.itemId);
  const audiobookIds = favorites.filter((f) => f.itemType === "audiobook").map((f) => f.itemId);

  const [jobs, courses, books, audiobooks] = await Promise.all([
    prisma.job.findMany({
      where: { id: { in: jobIds } },
      include: { skills: { include: { skill: true } } },
    }),
    prisma.course.findMany({
      where: { id: { in: courseIds } },
      include: { skills: { include: { skill: true } } },
    }),
    prisma.book.findMany({
      where: { id: { in: bookIds } },
      include: { skills: { include: { skill: true } } },
    }),
    prisma.audiobook.findMany({
      where: { id: { in: audiobookIds } },
      include: { skills: { include: { skill: true } } },
    }),
  ]);

  const jobSummaries: JobSummary[] = jobs.map((j) => ({
    id: j.id,
    title: j.title,
    company: j.company,
    source: j.source,
    isRemote: j.isRemote,
    level: j.level,
    salaryMin: j.salaryMin,
    salaryMax: j.salaryMax,
    currency: j.currency,
    url: j.url,
    skills: j.skills.map((s) => s.skill.slug),
    postedAt: j.postedAt?.toISOString() ?? null,
  }));

  const courseSummaries: CourseSummary[] = courses.map((c) => ({
    id: c.id,
    title: c.title,
    provider: c.provider,
    source: c.source,
    isFree: c.isFree,
    price: c.price,
    currency: c.currency,
    level: c.level,
    rating: c.rating,
    url: c.url,
    skills: c.skills.map((s) => s.skill.slug),
  }));

  const bookSummaries: BookSummary[] = books.map((b) => ({
    id: b.id,
    title: b.title,
    authors: b.authors,
    source: b.source,
    language: b.language,
    isFree: b.isFree,
    url: b.url,
    thumbnailUrl: b.thumbnailUrl,
    skills: b.skills.map((s) => s.skill.slug),
  }));

  const audiobookSummaries: AudiobookSummary[] = audiobooks.map((a) => ({
    id: a.id,
    title: a.title,
    authors: a.authors,
    source: a.source,
    language: a.language,
    isFree: a.isFree,
    durationMin: a.durationMin,
    url: a.url,
    skills: a.skills.map((s) => s.skill.slug),
  }));

  const total = jobSummaries.length + courseSummaries.length + bookSummaries.length + audiobookSummaries.length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Meus Favoritos
      </h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {total} item{total !== 1 ? "s" : ""} salvo{total !== 1 ? "s" : ""}
      </p>

      {total === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-16 dark:border-gray-700">
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Nenhum favorito ainda
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Salve vagas, cursos, livros e audiobooks para acessá-los rapidamente.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobSummaries.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
          {courseSummaries.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
          {bookSummaries.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
          {audiobookSummaries.map((audiobook) => (
            <AudiobookCard key={audiobook.id} audiobook={audiobook} />
          ))}
        </div>
      )}
    </div>
  );
}
