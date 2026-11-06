/**
 * Script de seed do TechRadar.
 * Popula o banco com skills do dicionário e dados reais das APIs.
 *
 * Uso: npm run db:seed
 */

import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { SKILL_DEFINITIONS } from "../src/lib/skills/dictionary";
import { extractSkillsFromText } from "../src/lib/skills/extract";
import { fetchRemotiveJobs, normalizeRemotiveJob } from "../src/lib/sources/remotive";
import { fetchOpenLibraryBooks, normalizeOpenLibraryBook } from "../src/lib/sources/openlibrary";
import { fetchLibriVoxAudiobooks, normalizeLibriVoxAudiobook } from "../src/lib/sources/librivox";

const prisma = new PrismaClient();

async function seedSkills() {
  console.log("🌱 Populando skills...");

  for (const skill of SKILL_DEFINITIONS) {
    await prisma.skill.upsert({
      where: { slug: skill.slug },
      update: {
        name: skill.name,
        category: skill.category,
        aliases: skill.aliases,
      },
      create: {
        slug: skill.slug,
        name: skill.name,
        category: skill.category,
        aliases: skill.aliases,
      },
    });
  }

  console.log(`✅ ${SKILL_DEFINITIONS.length} skills criadas`);
}

async function seedJobs() {
  console.log("🌱 Populando vagas do Remotive...");

  try {
    const jobs = await fetchRemotiveJobs("", 30);
    let count = 0;

    for (const job of jobs) {
      const jobData = normalizeRemotiveJob(job);
      const skills = extractSkillsFromText(
        `${jobData.title} ${jobData.description}`
      );

      const saved = await prisma.job.upsert({
        where: { externalId: jobData.externalId },
        update: {
          title: jobData.title,
          company: jobData.company,
          description: jobData.description,
          url: jobData.url,
          location: jobData.location,
          isRemote: jobData.isRemote,
          jobType: jobData.jobType,
          salaryMin: jobData.salaryMin,
          salaryMax: jobData.salaryMax,
          currency: jobData.currency,
          postedAt: jobData.postedAt,
          logoUrl: jobData.logoUrl,
          isActive: true,
        },
        create: jobData,
      });

      for (const skillSlug of skills) {
        const skill = await prisma.skill.findUnique({
          where: { slug: skillSlug },
        });
        if (skill) {
          await prisma.jobSkill.upsert({
            where: {
              jobId_skillId: { jobId: saved.id, skillId: skill.id },
            },
            update: {},
            create: { jobId: saved.id, skillId: skill.id },
          });
        }
      }

      count++;
    }

    console.log(`✅ ${count} vagas sincronizadas`);
  } catch (error) {
    console.error("❌ Erro ao sincronizar vagas:", error);
  }
}

async function seedBooks() {
  console.log("🌱 Populando livros do Open Library...");

  const queries = ["programming", "react", "python", "javascript", "devops"];
  let totalCount = 0;

  for (const query of queries) {
    try {
      const books = await fetchOpenLibraryBooks(query, 10);

      for (const doc of books) {
        const bookData = normalizeOpenLibraryBook(doc);
        const skills = extractSkillsFromText(
          `${bookData.title} ${bookData.description ?? ""}`
        );

        const saved = await prisma.book.upsert({
          where: { externalId: bookData.externalId },
          update: {
            title: bookData.title,
            authors: bookData.authors,
            description: bookData.description,
            url: bookData.url,
            thumbnailUrl: bookData.thumbnailUrl,
            language: bookData.language,
            pageCount: bookData.pageCount,
            publishedAt: bookData.publishedAt,
            publisher: bookData.publisher,
            isFree: bookData.isFree,
          },
          create: bookData,
        });

        for (const skillSlug of skills) {
          const skill = await prisma.skill.findUnique({
            where: { slug: skillSlug },
          });
          if (skill) {
            await prisma.bookSkill.upsert({
              where: {
                bookId_skillId: { bookId: saved.id, skillId: skill.id },
              },
              update: {},
              create: { bookId: saved.id, skillId: skill.id },
            });
          }
        }

        totalCount++;
      }
    } catch (error) {
      console.error(`❌ Erro ao buscar livros para "${query}":`, error);
    }
  }

  console.log(`✅ ${totalCount} livros sincronizados`);
}

async function seedAudiobooks() {
  console.log("🌱 Populando audiobooks do LibriVox...");

  try {
    const audiobooks = await fetchLibriVoxAudiobooks("", 20);
    let count = 0;

    for (const book of audiobooks) {
      const bookData = normalizeLibriVoxAudiobook(book);
      const skills = extractSkillsFromText(
        `${bookData.title} ${bookData.description ?? ""}`
      );

      const saved = await prisma.audiobook.upsert({
        where: { externalId: bookData.externalId },
        update: {
          title: bookData.title,
          authors: bookData.authors,
          narrator: bookData.narrator,
          description: bookData.description,
          url: bookData.url,
          thumbnailUrl: bookData.thumbnailUrl,
          language: bookData.language,
          durationMin: bookData.durationMin,
          isFree: bookData.isFree,
        },
        create: bookData,
      });

      for (const skillSlug of skills) {
        const skill = await prisma.skill.findUnique({
          where: { slug: skillSlug },
        });
        if (skill) {
          await prisma.audiobookSkill.upsert({
            where: {
              audiobookId_skillId: { audiobookId: saved.id, skillId: skill.id },
            },
            update: {},
            create: { audiobookId: saved.id, skillId: skill.id },
          });
        }
      }

      count++;
    }

    console.log(`✅ ${count} audiobooks sincronizados`);
  } catch (error) {
    console.error("❌ Erro ao sincronizar audiobooks:", error);
  }
}

async function main() {
  console.log("🚀 Iniciando seed do DevPath Hub...\n");

  const demo = await seedDemoUsers();
  await seedDemoData(demo.pabloId);

  // Conteúdo externo (vagas/livros/audiobooks) é opcional e depende de rede.
  if (process.argv.includes("--with-content")) {
    await seedSkills();
    await seedJobs();
    await seedBooks();
    await seedAudiobooks();
  }

  console.log("\n🎉 Seed concluído!");
}

// ══════════════════════════════════════════════════════════════════════════
// Usuários e dados de demonstração do DevPath Hub
// ══════════════════════════════════════════════════════════════════════════

const ADMIN_EMAIL = "admin@devpath.com";
const ADMIN_PASSWORD = "D3vP@th_2026!S3cure_Adm#91";
const DEMO_EMAIL = "pablo@devpath.com";
const DEMO_PASSWORD = "D3vP@th_2026!Us3r_S3cure#82";

async function seedDemoUsers() {
  console.log("🌱 Criando usuários de demonstração...");

  const adminPassword = await hash(ADMIN_PASSWORD, 12);
  const demoPassword = await hash(DEMO_PASSWORD, 12);

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { role: "ADMIN", password: adminPassword, emailVerified: new Date() },
    create: {
      email: ADMIN_EMAIL,
      name: "DevPath Admin",
      password: adminPassword,
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });

  const pablo = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { name: "Pablo Silva", password: demoPassword },
    create: {
      email: DEMO_EMAIL,
      name: "Pablo Silva",
      password: demoPassword,
      role: "USER",
      emailVerified: new Date(),
    },
  });

  await prisma.userSettings.upsert({
    where: { userId: pablo.id },
    update: {},
    create: { userId: pablo.id, dailyGoalMinutes: 240, weeklyGoalMinutes: 1200 },
  });

  console.log(`✅ Admin: ${admin.email}`);
  console.log(`✅ Demo:  ${pablo.email}`);

  return { adminId: admin.id, pabloId: pablo.id };
}

/**
 * Popula o dashboard do usuário demo com dados coerentes.
 * Idempotente: limpa apenas os dados de domínio DO USUÁRIO DEMO antes de recriar.
 */
async function seedDemoData(userId: string) {
  console.log("🌱 Populando dashboard de demonstração...");

  await prisma.$transaction([
    prisma.studySession.deleteMany({ where: { userId } }),
    prisma.studyContent.deleteMany({ where: { userId } }),
    prisma.roadmapItem.deleteMany({ where: { userId } }),
    prisma.roadmap.deleteMany({ where: { userId } }),
    prisma.topic.deleteMany({ where: { userId } }),
    prisma.subject.deleteMany({ where: { userId } }),
    prisma.learningPath.deleteMany({ where: { userId } }),
    prisma.project.deleteMany({ where: { userId } }),
    prisma.jobApplication.deleteMany({ where: { userId } }),
    prisma.flashcard.deleteMany({ where: { userId } }),
    prisma.note.deleteMany({ where: { userId } }),
  ]);

  // ── Trilha principal ────────────────────────────────────────────────────
  const roadmap = await prisma.roadmap.create({
    data: {
      userId,
      title: "Full Stack em 12 meses",
      description:
        "Do zero ao primeiro emprego: fundamentos, frontend, backend, banco de dados e deploy.",
      goal: "Conquistar a primeira vaga como desenvolvedor Full Stack.",
      level: "beginner",
      color: "#0ea5e9",
      order: 0,
      items: {
        create: [
          { userId, title: "Fundamentos de JavaScript", status: "COMPLETED", order: 0, estimatedMinutes: 600 },
          { userId, title: "TypeScript na prática", status: "COMPLETED", order: 1, estimatedMinutes: 480 },
          { userId, title: "React: componentes e estado", status: "IN_PROGRESS", order: 2, estimatedMinutes: 720 },
          { userId, title: "Next.js App Router", status: "IN_PROGRESS", order: 3, estimatedMinutes: 600 },
          { userId, title: "APIs com Node.js e Prisma", status: "NOT_STARTED", order: 4, estimatedMinutes: 900 },
          { userId, title: "PostgreSQL e modelagem de dados", status: "NEEDS_REVIEW", order: 5, estimatedMinutes: 480 },
          { userId, title: "Deploy, CI/CD e observabilidade", status: "NOT_STARTED", order: 6, estimatedMinutes: 360 },
          { userId, title: "Git e controle de versão", status: "NOT_STARTED", order: 7, estimatedMinutes: 240 },
          { userId, title: "GitHub e GitLab", status: "NOT_STARTED", order: 8, estimatedMinutes: 180 },
          { userId, title: "CI/CD (Integração e Entrega Contínua)", status: "NOT_STARTED", order: 9, estimatedMinutes: 300 },
          { userId, title: "Docker e contêineres", status: "NOT_STARTED", order: 10, estimatedMinutes: 360 },
          { userId, title: "Tailwind CSS", status: "NOT_STARTED", order: 11, estimatedMinutes: 240 },
        ],
      },
    },
    include: { items: true },
  });

  const reactItem = roadmap.items.find((item) => item.title.startsWith("React"));
  const nextItem = roadmap.items.find((item) => item.title.startsWith("Next.js"));
  const sqlItem = roadmap.items.find((item) => item.title.startsWith("PostgreSQL"));
  const jsItem = roadmap.items.find((item) => item.title.startsWith("Fundamentos de JavaScript"));
  const tsItem = roadmap.items.find((item) => item.title.startsWith("TypeScript"));
  const nodeItem = roadmap.items.find((item) => item.title.startsWith("APIs com Node.js"));
  const deployItem = roadmap.items.find((item) => item.title.startsWith("Deploy, CI/CD"));
  const gitItem = roadmap.items.find((item) => item.title.startsWith("Git e controle"));
  const githubItem = roadmap.items.find((item) => item.title.startsWith("GitHub e GitLab"));
  const cicdItem = roadmap.items.find((item) => item.title.startsWith("CI/CD ("));
  const dockerItem = roadmap.items.find((item) => item.title.startsWith("Docker"));
  const tailwindItem = roadmap.items.find((item) => item.title.startsWith("Tailwind"));

  if (reactItem) {
    await prisma.studyContent.create({
      data: {
        userId,
        roadmapItemId: reactItem.id,
        title: "Resumo: props, state e fluxo de dados",
        type: "NOTE",
        content:
          "## Props\nDados imutáveis passados do pai para o filho.\n\n## State\nEstado local que dispara re-render quando muda.\n\n## Fluxo\nDados descem por props e eventos sobem por callbacks.",
        order: 0,
      },
    });
  }

  if (nextItem) {
    await prisma.studyContent.create({
      data: {
        userId,
        roadmapItemId: nextItem.id,
        title: "Documentação oficial do App Router",
        type: "LINK",
        url: "https://nextjs.org/docs/app",
        order: 0,
      },
    });
  }

  if (sqlItem) {
    await prisma.studyContent.create({
      data: {
        userId,
        roadmapItemId: sqlItem.id,
        title: "Checklist de revisão: índices e JOINs",
        type: "NOTE",
        content:
          "1. Entender quando o planner usa índice.\n2. Diferenciar INNER, LEFT e FULL JOIN.\n3. Praticar EXPLAIN ANALYZE em consultas lentas.",
        order: 0,
      },
    });
  }

  if (jsItem) {
    await prisma.studyContent.create({
      data: {
        userId,
        roadmapItemId: jsItem.id,
        title: "Fundamentos de JavaScript",
        type: "NOTE",
        content:
          "# JavaScript Moderno\n\n## Variáveis\n`let`, `const` e `var` — escopo de bloco vs função.\n\n## Tipos de dados\nString, Number, Boolean, null, undefined, Symbol, BigInt, Object.\n\n## Funções\nDeclaração, expressão, arrow functions, parâmetros rest e spread.\n\n## Async/Await\nPromises, `async`/`await`, `fetch`, tratamento de erros com try/catch.\n\n## DOM\nManipulação de elementos, eventos, seleção por querySelector.\n\n## Módulos\n`import`/`export`, CommonJS vs ES Modules.",
        order: 0,
      },
    });
  }

  if (tsItem) {
    await prisma.studyContent.create({
      data: {
        userId,
        roadmapItemId: tsItem.id,
        title: "TypeScript na prática",
        type: "NOTE",
        content:
          "# TypeScript\n\n## Tipagem estática\nInterfaces, tipos, union types, intersection types.\n\n## Tipos úteis\nPartial, Required, Readonly, Pick, Omit, Record.\n\n## Generics\nFunções e componentes genéricos, restrições de tipo.\n\n## Integração com React\nTipagem de props, estado, eventos.\n\n## tsconfig\nstrict, noImplicitAny, esModuleInterop.",
        order: 0,
      },
    });
  }

  if (nodeItem) {
    await prisma.studyContent.create({
      data: {
        userId,
        roadmapItemId: nodeItem.id,
        title: "APIs com Node.js e Prisma",
        type: "NOTE",
        content:
          "# Node.js + Prisma\n\n## Node.js\nHTTP nativo, Express, middlewares, rotas, controladores.\n\n## Prisma ORM\nSchema.prisma, models, relações, migrations.\n\n## Consultas\nfindMany, findUnique, create, update, delete, include, select.\n\n## Validação\nZod para validação de entrada de requisições.\n\n## Segurança\nHash de senhas (bcrypt), JWT, middleware de autenticação.",
        order: 0,
      },
    });
  }

  if (deployItem) {
    await prisma.studyContent.create({
      data: {
        userId,
        roadmapItemId: deployItem.id,
        title: "Deploy, CI/CD e observabilidade",
        type: "NOTE",
        content:
          "# Deploy e CI/CD\n\n## CI/CD\nGitHub Actions, pipelines, testes automatizados, lint, build.\n\n## Deploy\nVercel, variáveis de ambiente, domínios, SSL.\n\n## Observabilidade\nLogs, métricas, rastreamento de erros (Sentry).\n\n## Docker\nDockerfile, docker-compose, imagens otimizadas.\n\n## Variáveis de ambiente\n.ENV, segredos, configuração por ambiente.",
        order: 0,
      },
    });
  }

  if (gitItem) {
    await prisma.studyContent.create({
      data: {
        userId,
        roadmapItemId: gitItem.id,
        title: "Git e controle de versão",
        type: "NOTE",
        content:
          "# Git\n\n## Comandos básicos\ninit, clone, add, commit, push, pull, status, log.\n\n## Ramificações\nbranch, checkout, merge, rebase, resolve de conflitos.\n\n## Trabalho remoto\norigin, remote, fetch, pull request, fork.\n\n## Desfazer alterações\nreset, revert, restore, stash.\n\n## Boas práticas\nCommits atômicos, mensagens descritivas, .gitignore.",
        order: 0,
      },
    });
  }

  if (githubItem) {
    await prisma.studyContent.create({
      data: {
        userId,
        roadmapItemId: githubItem.id,
        title: "GitHub e GitLab",
        type: "NOTE",
        content:
          "# GitHub e GitLab\n\n## Repositórios\nCriação, clonagem, push, pull, branches protegidas.\n\n## Colaboração\nIssues, Pull Requests, code review, merge strategies.\n\n## GitHub Actions\nWorkflows, CI/CD, testes automatizados, deploy.\n\n## GitLab\nCI/CD nativo, runners, pipelines, MRs.\n\n## Organizações\nTeams, permissões, repositórios privados/públicos.",
        order: 0,
      },
    });
  }

  if (cicdItem) {
    await prisma.studyContent.create({
      data: {
        userId,
        roadmapItemId: cicdItem.id,
        title: "CI/CD (Integração e Entrega Contínua)",
        type: "NOTE",
        content:
          "# CI/CD\n\n## Conceitos\nIntegração Contínua, Entrega Contínua, Deploy Contínuo.\n\n## GitHub Actions\nYAML workflows, triggers, jobs, steps, actions.\n\n## Pipeline\nLint, testes unitários, build, deploy automatizado.\n\n## Qualidade\nSonarQube, ESLint, Prettier, testes de cobertura.\n\n## Rollback\nEstratégias de reversão, blue-green deployment.",
        order: 0,
      },
    });
  }

  if (dockerItem) {
    await prisma.studyContent.create({
      data: {
        userId,
        roadmapItemId: dockerItem.id,
        title: "Docker e contêineres",
        type: "NOTE",
        content:
          "# Docker\n\n## Conceitos\nImagens, contêineres, Dockerfile, volumes, redes.\n\n## Dockerfile\nFROM, COPY, RUN, CMD, ENTRYPOINT, EXPOSE.\n\n## docker-compose\nServiços, rede, volumes, variáveis de ambiente.\n\n## Boas práticas\nImagens multinível (multi-stage), .dockerignore, imagens leves.\n\n## Orquestração\nDocker Swarm, Kubernetes (conceitos básicos).",
        order: 0,
      },
    });
  }

  if (tailwindItem) {
    await prisma.studyContent.create({
      data: {
        userId,
        roadmapItemId: tailwindItem.id,
        title: "Tailwind CSS",
        type: "NOTE",
        content:
          "# Tailwind CSS\n\n## Utilitários\nClasses de utilitário para layout, espaçamento, tipografia, cores.\n\n## Responsividade\nPrefixos sm, md, lg, xl, 2xl para breakpoints.\n\n## Estados\nhover, focus, active, disabled, group-hover.\n\n## Personalização\ntailwind.config.js, cores, fontes, espaçamento customizado.\n\n## Integração\nNext.js, React, componentes reutilizáveis.",
        order: 0,
      },
    });
  }

  // ── Learning path (macro) ───────────────────────────────────────────────
  await prisma.learningPath.create({
    data: {
      userId,
      title: "Formação Full Stack",
      description: "Trilha macro com disciplinas e tópicos de estudo.",
      level: "beginner",
      subjects: {
        create: [
          {
            userId,
            title: "Frontend",
            order: 0,
            topics: {
              create: [
                { userId, title: "HTML semântico", status: "COMPLETED", order: 0 },
                { userId, title: "CSS moderno e responsivo", status: "COMPLETED", order: 1 },
                { userId, title: "React e gerenciamento de estado", status: "IN_PROGRESS", order: 2 },
              ],
            },
          },
          {
            userId,
            title: "Backend",
            order: 1,
            topics: {
              create: [
                { userId, title: "Node.js e APIs REST", status: "IN_PROGRESS", order: 0 },
                { userId, title: "Autenticação e autorização", status: "NOT_STARTED", order: 1 },
              ],
            },
          },
          {
            userId,
            title: "Banco de dados",
            order: 2,
            topics: {
              create: [
                { userId, title: "Modelagem relacional", status: "NEEDS_REVIEW", order: 0 },
                { userId, title: "Prisma ORM", status: "NOT_STARTED", order: 1 },
              ],
            },
          },
        ],
      },
    },
  });

  // ── Projetos ────────────────────────────────────────────────────────────
  await prisma.project.createMany({
    data: [
      {
        userId,
        title: "Sistema de Ordens de Serviço",
        description: "CRUD completo com autenticação e dashboard.",
        status: "IN_PROGRESS",
        progress: 45,
        techStack: ["React", "Node.js", "PostgreSQL"],
        startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45),
      },
      {
        userId,
        title: "Startup Builder",
        description: "Game de aprendizado com sistema de startups.",
        status: "PLANNING",
        progress: 20,
        techStack: ["React", "Node.js", "PostgreSQL"],
      },
      {
        userId,
        title: "Portfólio Pessoal",
        description: "Site pessoal com projetos e currículo.",
        status: "REVIEW",
        progress: 80,
        techStack: ["React", "TypeScript"],
        liveUrl: "https://example.com",
      },
    ],
  });

  // ── Candidaturas ────────────────────────────────────────────────────────
  await prisma.jobApplication.createMany({
    data: [
      {
        userId,
        company: "Nubank",
        role: "Desenvolvedor Full Stack Júnior",
        status: "APPLIED",
        location: "Remoto",
        appliedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
      },
      {
        userId,
        company: "Rocketseat",
        role: "Frontend Engineer",
        status: "INTERVIEW",
        location: "Remoto",
        appliedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12),
        nextStepAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
      },
      {
        userId,
        company: "Stone",
        role: "Backend Developer",
        status: "SAVED",
        location: "São Paulo, BR",
      },
    ],
  });

  // ── Sessões de estudo (últimos 30 dias) ─────────────────────────────────
  const sessions = Array.from({ length: 30 }, (_, index) => {
    const daysAgo = 29 - index;
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    date.setHours(19, 0, 0, 0);

    // Curva crescente com dias de descanso, para o gráfico ficar realista.
    const base = 40 + Math.round(index * 3.2);
    const minutes = daysAgo % 7 === 0 ? 0 : base + ((index * 17) % 45);

    return { userId, date, minutes, source: "manual" };
  }).filter((session) => session.minutes > 0);

  await prisma.studySession.createMany({ data: sessions });

  // ── Revisões pendentes (12) ─────────────────────────────────────────────
  const cards = [
    ["React - Hooks", "useState, useEffect, useMemo e regras dos hooks."],
    ["React - Context API", "Compartilha estado sem prop drilling."],
    ["TypeScript - Interfaces", "Contratos de forma para objetos."],
    ["TypeScript - Generics", "Tipos parametrizados e reutilizáveis."],
    ["Node.js - Express", "Middlewares e rotas."],
    ["Node.js - Streams", "Processamento incremental de dados."],
    ["PostgreSQL - CRUD", "INSERT, SELECT, UPDATE e DELETE."],
    ["PostgreSQL - Índices", "Aceleram leituras e custam escritas."],
    ["Next.js - Server Components", "Renderização no servidor por padrão."],
    ["Next.js - Route Handlers", "Endpoints HTTP no App Router."],
    ["Prisma - Relations", "Relações 1:N e N:N no schema."],
    ["Prisma - Migrations", "Evolução versionada do banco."],
  ];

  await prisma.flashcard.createMany({
    data: cards.map(([front, back], index) => ({
      userId,
      front,
      back,
      source: "seed",
      status: "NEW",
      dueDate: new Date(Date.now() - 1000 * 60 * 60 * (index + 1)),
    })),
  });

  // ── Nota de exemplo ─────────────────────────────────────────────────────
  await prisma.note.create({
    data: {
      userId,
      title: "TypeScript — Interfaces e Generics",
      markdown:
        "# Interfaces\n\nDescrevem a forma de um objeto.\n\n# Generics\n\nPermitem reutilizar tipos mantendo a segurança.\n\n```ts\nfunction identity<T>(value: T): T {\n  return value;\n}\n```",
      source: "manual",
    },
  });

  console.log("✅ Dashboard de demonstração populado");

  // ── Biblioteca relacionada ao roadmap Full Stack ─────────────────────────
  await prisma.libraryItem.createMany({
    data: [
      {
        userId,
        itemType: "book",
        itemId: "book-js-definitive",
        title: "JavaScript: O Guia Definitivo",
        author: "David Flanagan",
        status: "reading",
        progress: 30,
        coverUrl: null,
        fileUrl: null,
        fileKey: null,
        mimeType: null,
        fileSize: null,
        totalPages: 1096,
        currentPage: 329,
        durationSec: null,
        rating: null,
        notes: "Referência completa de JavaScript moderno",
        lastAccessedAt: new Date(),
      },
      {
        userId,
        itemType: "book",
        itemId: "book-typescript-essentials",
        title: "TypeScript Essentials",
        author: "Adam Freeman",
        status: "to_read",
        progress: 0,
        coverUrl: null,
        fileUrl: null,
        fileKey: null,
        mimeType: null,
        fileSize: null,
        totalPages: 450,
        currentPage: 0,
        durationSec: null,
        rating: null,
        notes: "Aprender tipagem estática com TypeScript",
        lastAccessedAt: null,
      },
      {
        userId,
        itemType: "book",
        itemId: "book-learning-react",
        title: "Aprendendo React",
        author: "Alex Banks e Eve Porcello",
        status: "reading",
        progress: 45,
        coverUrl: null,
        fileUrl: null,
        fileKey: null,
        mimeType: null,
        fileSize: null,
        totalPages: 400,
        currentPage: 180,
        durationSec: null,
        rating: null,
        notes: "Hooks, Context API e padrões modernos",
        lastAccessedAt: new Date(),
      },
      {
        userId,
        itemType: "book",
        itemId: "book-tailwind-css",
        title: "Tailwind CSS: Construindo Interfaces Modernas",
        author: "Various",
        status: "to_read",
        progress: 0,
        coverUrl: null,
        fileUrl: null,
        fileKey: null,
        mimeType: null,
        fileSize: null,
        totalPages: 320,
        currentPage: 0,
        durationSec: null,
        rating: null,
        notes: "Utilitários CSS e responsividade com Tailwind",
        lastAccessedAt: null,
      },
      {
        userId,
        itemType: "book",
        itemId: "book-node-design-patterns",
        title: "Node.js Design Patterns",
        author: "Mario Casciaro e Luciano Mammino",
        status: "to_read",
        progress: 0,
        coverUrl: null,
        fileUrl: null,
        fileKey: null,
        mimeType: null,
        fileSize: null,
        totalPages: 600,
        currentPage: 0,
        durationSec: null,
        rating: null,
        notes: "Padrões de projeto para aplicações Node.js",
        lastAccessedAt: null,
      },
      {
        userId,
        itemType: "book",
        itemId: "book-ddia",
        title: "Designing Data-Intensive Applications",
        author: "Martin Kleppmann",
        status: "to_read",
        progress: 0,
        coverUrl: null,
        fileUrl: null,
        fileKey: null,
        mimeType: null,
        fileSize: null,
        totalPages: 660,
        currentPage: 0,
        durationSec: null,
        rating: null,
        notes: "Banco de dados, modelagem e sistemas distribuídos",
        lastAccessedAt: null,
      },
      {
        userId,
        itemType: "book",
        itemId: "book-pro-git",
        title: "Pro Git",
        author: "Scott Chacon e Ben Straub",
        status: "completed",
        progress: 100,
        coverUrl: null,
        fileUrl: null,
        fileKey: null,
        mimeType: null,
        fileSize: null,
        totalPages: 450,
        currentPage: 450,
        durationSec: null,
        rating: 5,
        notes: "Controle de versão com Git - leitura completa",
        lastAccessedAt: new Date(),
      },
      {
        userId,
        itemType: "book",
        itemId: "book-docker-deep-dive",
        title: "Docker Deep Dive",
        author: "Nigel Poulton",
        status: "to_read",
        progress: 0,
        coverUrl: null,
        fileUrl: null,
        fileKey: null,
        mimeType: null,
        fileSize: null,
        totalPages: 400,
        currentPage: 0,
        durationSec: null,
        rating: null,
        notes: "Contêineres e Docker para desenvolvimento",
        lastAccessedAt: null,
      },
      {
        userId,
        itemType: "pdf",
        itemId: "pdf-clean-code-summary",
        title: "Clean Code — Resumo de Princípios",
        author: "Robert C. Martin",
        status: "reading",
        progress: 60,
        coverUrl: null,
        fileUrl: null,
        fileKey: null,
        mimeType: "application/pdf",
        fileSize: null,
        totalPages: 50,
        currentPage: 30,
        durationSec: null,
        rating: null,
        notes: "Limpeza de código e boas práticas de programação",
        lastAccessedAt: new Date(),
      },
      {
        userId,
        itemType: "audiobook",
        itemId: "audiobook-pragmatic-programmer",
        title: "The Pragmatic Programmer",
        author: "Andrew Hunt e David Thomas",
        status: "to_read",
        progress: 0,
        coverUrl: null,
        fileUrl: null,
        fileKey: null,
        mimeType: "audio/mpeg",
        fileSize: null,
        totalPages: null,
        currentPage: null,
        durationSec: 39600,
        positionSec: 0,
        rating: null,
        notes: "Jornada de um mestre à excelência em programação",
        lastAccessedAt: null,
      },
    ],
  });

  console.log("✅ Biblioteca de demonstração populada");
}


main()
  .catch((error) => {
    console.error("❌ Erro no seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
