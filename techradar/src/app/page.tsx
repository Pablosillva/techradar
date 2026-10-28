import { SearchBar } from "@/components/search/search-bar";
import { SkillChips } from "@/components/search/skill-chips";
import { prisma } from "@/lib/prisma";
import { SKILL_DEFINITIONS } from "@/lib/skills/dictionary";

export default async function HomePage() {
  // Busca skills populares (contagem de vagas por skill)
  const popularSkills = await prisma.skill.findMany({
    where: {
      jobSkills: { some: {} },
    },
    include: {
      _count: {
        select: { jobSkills: true },
      },
    },
    orderBy: {
      jobSkills: { _count: "desc" },
    },
    take: 12,
  });

  const skillsWithCount = popularSkills.map((s) => ({
    slug: s.slug,
    name: s.name,
    count: s._count.jobSkills,
  }));

  // Se não há dados no banco, mostra skills do dicionário
  const displaySkills =
    skillsWithCount.length > 0
      ? skillsWithCount
      : SKILL_DEFINITIONS.slice(0, 12).map((s) => ({
          slug: s.slug,
          name: s.name,
          count: 0,
        }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      {/* Hero */}
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl dark:text-white">
          Encontre seu próximo passo em{" "}
          <span className="text-blue-600 dark:text-blue-400">tecnologia</span>
        </h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
          Busque vagas, cursos, livros e audiobooks em um só lugar.
          Receba recomendações cruzadas baseadas nas skills que você precisa.
        </p>

        <div className="mt-8">
          <SearchBar size="large" />
        </div>
      </div>

      {/* Skills Populares */}
      <div className="mt-12">
        <h2 className="text-center text-sm font-medium text-gray-500 dark:text-gray-400">
          Skills em alta
        </h2>
        <div className="mt-4 flex justify-center">
          <SkillChips skills={displaySkills} />
        </div>
      </div>

      {/* Como funciona */}
      <div className="mx-auto mt-20 max-w-4xl">
        <h2 className="text-center text-2xl font-bold text-gray-900 dark:text-white">
          Como funciona
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-gray-900">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">1. Busque</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Digite uma tecnologia, cargo ou skill. Filtre por modalidade, nível e idioma.
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-gray-900">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">2. Descubra</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Vagas recomendam cursos, livros e audiobooks. Cursos mostram quais vagas pedem aquela skill.
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-gray-900">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">3. Salve</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Favorite vagas e cursos. Compartilhe buscas via URL e acompanhe seu histórico.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
