import { prisma } from "@/lib/prisma";
import { searchJobIds, searchCourseIds, searchBookIds, searchAudiobookIds } from "@/lib/search/fulltext";
import { JobCard } from "@/components/cards/job-card";
import { CourseCard } from "@/components/cards/course-card";
import { BookCard } from "@/components/cards/book-card";
import { AudiobookCard } from "@/components/cards/audiobook-card";
import { CardSkeleton } from "@/components/cards/card-skeleton";
import { FilterSidebar } from "@/components/search/filter-sidebar";
import { SortSelect } from "@/components/search/sort-select";
import { Pagination } from "@/components/search/pagination";
import type { JobSummary, CourseSummary, BookSummary, AudiobookSummary } from "@/types/api";

interface SearchResultsProps {
  query: string;
  tab: string;
  searchParams: Record<string, string>;
}

const PAGE_SIZE = 20;

export async function SearchResults({ query, tab, searchParams }: SearchResultsProps) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10));
  const sort = searchParams.sort ?? "relevance";

  // Constrói filtros comuns
  const filters: Record<string, string> = {};
  if (searchParams.remote) filters.remote = searchParams.remote;
  if (searchParams.level) filters.level = searchParams.level;
  if (searchParams.free) filters.free = searchParams.free;
  if (searchParams.language) filters.language = searchParams.language;
  if (searchParams.salary) filters.salary = searchParams.salary;
  // Garante que todos os valores são strings
  Object.keys(filters).forEach((key) => {
    if (typeof filters[key] !== "string") {
      delete filters[key];
    }
  });

  // Busca IDs com full-text search (se houver query)
  let jobIds: string[] | null = null;
  let courseIds: string[] | null = null;
  let bookIds: string[] | null = null;
  let audiobookIds: string[] | null = null;

  if (query.trim()) {
    if (tab === "vagas" || tab === "tudo") {
      jobIds = await searchJobIds(query);
    }
    if (tab === "cursos" || tab === "tudo") {
      courseIds = await searchCourseIds(query);
    }
    if (tab === "livros" || tab === "tudo") {
      bookIds = await searchBookIds(query);
    }
    if (tab === "audiobooks" || tab === "tudo") {
      audiobookIds = await searchAudiobookIds(query);
    }
  }

  // Busca vagas
  const jobsPromise =
    tab === "vagas" || tab === "tudo"
      ? prisma.job.findMany({
          where: {
            isActive: true,
            ...(jobIds ? { id: { in: jobIds } } : {}),
            ...(filters.remote === "true" ? { isRemote: true } : {}),
            ...(filters.remote === "false" ? { isRemote: false } : {}),
            ...(filters.level ? { level: filters.level } : {}),
            ...(filters.source ? { source: filters.source } : {}),
            ...(filters.skill
              ? { skills: { some: { skill: { slug: filters.skill } } } }
              : {}),
          },
          include: { skills: { include: { skill: true } } },
          orderBy:
            sort === "date"
              ? { postedAt: "desc" as const }
              : sort === "salary"
                ? { salaryMax: "desc" as const }
                : { createdAt: "desc" as const },
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
        })
      : Promise.resolve([]);

  // Busca cursos
  const coursesPromise =
    tab === "cursos" || tab === "tudo"
      ? prisma.course.findMany({
          where: {
            ...(courseIds ? { id: { in: courseIds } } : {}),
            ...(filters.free === "true" ? { isFree: true } : {}),
            ...(filters.free === "false" ? { isFree: false } : {}),
            ...(filters.level ? { level: filters.level } : {}),
            ...(filters.language ? { language: filters.language } : {}),
          },
          include: { skills: { include: { skill: true } } },
          orderBy:
            sort === "rating"
              ? { rating: "desc" as const }
              : { createdAt: "desc" as const },
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
        })
      : Promise.resolve([]);

  // Busca livros
  const booksPromise =
    tab === "livros" || tab === "tudo"
      ? prisma.book.findMany({
          where: {
            ...(bookIds ? { id: { in: bookIds } } : {}),
            ...(filters.language ? { language: filters.language } : {}),
          },
          include: { skills: { include: { skill: true } } },
          orderBy: { createdAt: "desc" as const },
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
        })
      : Promise.resolve([]);

  // Busca audiobooks
  const audiobooksPromise =
    tab === "audiobooks" || tab === "tudo"
      ? prisma.audiobook.findMany({
          where: {
            ...(audiobookIds ? { id: { in: audiobookIds } } : {}),
            ...(filters.language ? { language: filters.language } : {}),
          },
          include: { skills: { include: { skill: true } } },
          orderBy: { createdAt: "desc" as const },
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
        })
      : Promise.resolve([]);

  const [jobs, courses, books, audiobooks] = await Promise.all([
    jobsPromise,
    coursesPromise,
    booksPromise,
    audiobooksPromise,
  ]);

  // Contagens totais para paginação
  const totalJobs =
    tab === "vagas" || tab === "tudo"
      ? await prisma.job.count({
          where: {
            isActive: true,
            ...(jobIds ? { id: { in: jobIds } } : {}),
            ...(filters.remote === "true" ? { isRemote: true } : {}),
            ...(filters.remote === "false" ? { isRemote: false } : {}),
            ...(filters.level ? { level: filters.level } : {}),
            ...(filters.source ? { source: filters.source } : {}),
            ...(filters.skill
              ? { skills: { some: { skill: { slug: filters.skill } } } }
              : {}),
          },
        })
      : 0;

  const totalCourses =
    tab === "cursos" || tab === "tudo"
      ? await prisma.course.count({
          where: {
            ...(courseIds ? { id: { in: courseIds } } : {}),
            ...(filters.free === "true" ? { isFree: true } : {}),
            ...(filters.free === "false" ? { isFree: false } : {}),
            ...(filters.level ? { level: filters.level } : {}),
            ...(filters.language ? { language: filters.language } : {}),
          },
        })
      : 0;

  const totalBooks =
    tab === "livros" || tab === "tudo"
      ? await prisma.book.count({
          where: {
            ...(bookIds ? { id: { in: bookIds } } : {}),
            ...(filters.language ? { language: filters.language } : {}),
          },
        })
      : 0;

  const totalAudiobooks =
    tab === "audiobooks" || tab === "tudo"
      ? await prisma.audiobook.count({
          where: {
            ...(audiobookIds ? { id: { in: audiobookIds } } : {}),
            ...(filters.language ? { language: filters.language } : {}),
          },
        })
      : 0;

  const total = totalJobs + totalCourses + totalBooks + totalAudiobooks;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Mapeia para o formato de summary
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

  const hasResults =
    jobSummaries.length > 0 ||
    courseSummaries.length > 0 ||
    bookSummaries.length > 0 ||
    audiobookSummaries.length > 0;

  return (
    <div className="flex gap-8">
      {/* Sidebar de filtros */}
      <div className="hidden w-64 shrink-0 lg:block">
        <FilterSidebar
          showRemote={tab === "vagas" || tab === "tudo"}
          showLevel={tab === "vagas" || tab === "cursos" || tab === "tudo"}
          showFree={tab === "cursos" || tab === "tudo"}
          showLanguage={tab === "cursos" || tab === "livros" || tab === "audiobooks" || tab === "tudo"}
          showSalary={tab === "vagas" || tab === "tudo"}
          showSource={tab === "vagas" || tab === "tudo"}
          showSkill={tab === "vagas" || tab === "tudo"}
          levelOptions={[
            { value: "junior", label: "Júnior" },
            { value: "pleno", label: "Pleno" },
            { value: "senior", label: "Sênior" },
            { value: "lead", label: "Lead" },
          ]}
          languageOptions={[
            { value: "en", label: "Inglês" },
            { value: "pt", label: "Português" },
            { value: "es", label: "Espanhol" },
          ]}
          sourceOptions={[
            { value: "remotive", label: "Remotive" },
            { value: "arbeitnow", label: "Arbeitnow" },
            { value: "trampos", label: "Trampos" },
            { value: "coodesh", label: "Coodesh" },
          ]}
          skillOptions={[
            { value: "react", label: "React" },
            { value: "typescript", label: "TypeScript" },
            { value: "nodejs", label: "Node.js" },
            { value: "python", label: "Python" },
            { value: "javascript", label: "JavaScript" },
            { value: "docker", label: "Docker" },
            { value: "kubernetes", label: "Kubernetes" },
            { value: "aws", label: "AWS" },
            { value: "postgresql", label: "PostgreSQL" },
            { value: "mongodb", label: "MongoDB" },
            { value: "graphql", label: "GraphQL" },
            { value: "react-native", label: "React Native" },
          ]}
          activeFilters={filters}
        />
      </div>

      {/* Resultados */}
      <div className="flex-1">
        {/* Header com count e sort */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {total} resultado{total !== 1 ? "s" : ""}
            {query && (
              <>
                {" "}para <span className="font-medium text-gray-900 dark:text-gray-100">"{query}"</span>
              </>
            )}
          </p>
          <SortSelect
            options={[
              { value: "relevance", label: "Relevância" },
              { value: "date", label: "Mais recentes" },
              ...(tab === "vagas" || tab === "tudo"
                ? [{ value: "salary", label: "Maior salário" }]
                : []),
              ...(tab === "cursos" || tab === "tudo"
                ? [{ value: "rating", label: "Melhor avaliados" }]
                : []),
            ]}
            defaultValue="relevance"
          />
        </div>

        {/* Grid de resultados */}
        {hasResults ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-16 dark:border-gray-700">
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Nenhum resultado encontrado
            </p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Tente buscar por outro termo ou ajuste os filtros.
            </p>
          </div>
        )}

        {/* Paginação */}
        {totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            searchParams={searchParams}
          />
        )}
      </div>
    </div>
  );
}
