import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin";
import { JobSourcesManager } from "@/components/admin/job-sources-manager";
import { CourseManager } from "@/components/admin/course-manager";
import { BookManager } from "@/components/admin/book-manager";
import { AudiobookManager } from "@/components/admin/audiobook-manager";

export default async function AdminPage() {
  const { session, isAdmin } = await getAdminSession();

  if (!session?.user) {
    redirect("/entrar");
  }

  if (!isAdmin) {
    redirect("/");
  }

  const sources = await prisma.jobSource.findMany({
    orderBy: { createdAt: "desc" },
  });

  const courses = await prisma.course.findMany({
    include: { skills: { include: { skill: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const books = await prisma.book.findMany({
    include: { skills: { include: { skill: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const audiobooks = await prisma.audiobook.findMany({
    include: { skills: { include: { skill: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mt-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Painel Administrativo
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Configure fontes de vagas e gerencie cursos, livros e audiobooks.
        </p>
      </div>

      <div className="mt-8 space-y-12">
        {/* Fontes de vagas */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Fontes de Vagas
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Adicione sites de vagas para que possam ser buscados no TechRadar.
          </p>
          <div className="mt-4">
            <JobSourcesManager
              initialSources={sources.map((s) => ({
                id: s.id,
                name: s.name,
                url: s.url,
                source: s.source,
                isActive: s.isActive,
                createdAt: s.createdAt,
                updatedAt: s.updatedAt,
              }))}
            />
          </div>
        </section>

        {/* Cursos */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Cursos
          </h2>
          <div className="mt-4">
            <CourseManager
              initialCourses={courses.map((c) => ({
                id: c.id,
                title: c.title,
                provider: c.provider,
                description: c.description,
                url: c.url,
                thumbnailUrl: c.thumbnailUrl,
                language: c.language,
                isFree: c.isFree,
                price: c.price,
                currency: c.currency,
                level: c.level,
                duration: c.duration,
                rating: c.rating,
                createdAt: c.createdAt,
                updatedAt: c.updatedAt,
                skills: c.skills.map((s) => s.skill.slug),
              }))}
            />
          </div>
        </section>

        {/* Livros */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Livros
          </h2>
          <div className="mt-4">
            <BookManager
              initialBooks={books.map((b) => ({
                id: b.id,
                title: b.title,
                authors: b.authors,
                description: b.description,
                url: b.url,
                thumbnailUrl: b.thumbnailUrl,
                language: b.language,
                pageCount: b.pageCount,
                publishedAt: b.publishedAt,
                publisher: b.publisher,
                isFree: b.isFree,
                createdAt: b.createdAt,
                updatedAt: b.updatedAt,
                skills: b.skills.map((s) => s.skill.slug),
              }))}
            />
          </div>
        </section>

        {/* Audiobooks */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Audiobooks
          </h2>
          <div className="mt-4">
            <AudiobookManager
              initialAudiobooks={audiobooks.map((a) => ({
                id: a.id,
                title: a.title,
                authors: a.authors,
                narrator: a.narrator,
                description: a.description,
                url: a.url,
                thumbnailUrl: a.thumbnailUrl,
                language: a.language,
                durationMin: a.durationMin,
                isFree: a.isFree,
                createdAt: a.createdAt,
                updatedAt: a.updatedAt,
                skills: a.skills.map((s) => s.skill.slug),
              }))}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
