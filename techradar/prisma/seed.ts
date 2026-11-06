/**
 * Script de seed do TechRadar.
 * Popula o banco com dados de demonstração.
 *
 * Uso: npm run db:seed
 */

import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function seedDemoUsers() {
  console.log("🌱 Criando usuários de demonstração...");

  const adminPassword = await hash("D3vP@th_2026!S3cure_Adm#91", 12);
  const demoPassword = await hash("D3vP@th_2026!Us3r_S3cure#82", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@devpath.com" },
    update: { role: "ADMIN", password: adminPassword, emailVerified: new Date() },
    create: {
      email: "admin@devpath.com",
      name: "DevPath Admin",
      password: adminPassword,
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });

  const pablo = await prisma.user.upsert({
    where: { email: "pablo@devpath.com" },
    update: { name: "Pablo Silva", password: demoPassword },
    create: {
      email: "pablo@devpath.com",
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

  console.log("✅ Admin: admin@devpath.com");
  console.log("✅ Demo:  pablo@devpath.com");

  return { adminId: admin.id, pabloId: pablo.id };
}

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
    prisma.libraryItem.deleteMany({ where: { userId } }),
  ]);

  // ── Roadmap Full Stack Júnior - 42 itens
  const ROADMAP_ITEMS = [
    // Módulo 1: Fundamentos
    { title: "1. Terminal e Linux: comandos e permissões", status: "NOT_STARTED", order: 0, estimatedMinutes: 90 },
    { title: "2. Git e GitHub: commit, branch, merge, pull request", status: "NOT_STARTED", order: 1, estimatedMinutes: 120 },
    { title: "3. Como a web funciona: cliente, servidor, HTTP, DNS", status: "NOT_STARTED", order: 2, estimatedMinutes: 100 },
    { title: "4. HTML semântico, formulários e acessibilidade", status: "NOT_STARTED", order: 3, estimatedMinutes: 120 },
    { title: "5. CSS: seletores, box model, flexbox, grid, responsividade", status: "NOT_STARTED", order: 4, estimatedMinutes: 150 },
    // Módulo 2: JavaScript
    { title: "6. Variáveis, tipos, operadores, if/else e switch", status: "NOT_STARTED", order: 5, estimatedMinutes: 90 },
    { title: "7. Loops e funções (incluindo arrow functions)", status: "NOT_STARTED", order: 6, estimatedMinutes: 90 },
    { title: "8. Arrays e objects, com map, filter, find e reduce", status: "NOT_STARTED", order: 7, estimatedMinutes: 90 },
    { title: "9. Tipos básicos, type vs interface, unions", status: "NOT_STARTED", order: 8, estimatedMinutes: 90 },
    { title: "10. Generics, utility types e tipagem de funções", status: "NOT_STARTED", order: 9, estimatedMinutes: 90 },
    { title: "11. Componentes, JSX e props", status: "NOT_STARTED", order: 10, estimatedMinutes: 90 },
    { title: "12. useState e eventos", status: "NOT_STARTED", order: 11, estimatedMinutes: 90 },
    { title: "13. useEffect e consumo de API", status: "NOT_STARTED", order: 12, estimatedMinutes: 120 },
    { title: "14. Listas, formulários e renderização condicional", status: "NOT_STARTED", order: 13, estimatedMinutes: 90 },
    { title: "15. React Router, Context e custom hooks", status: "NOT_STARTED", order: 14, estimatedMinutes: 90 },
    { title: "16. Formulários validados com React Hook Form + Zod e TanStack Query", status: "NOT_STARTED", order: 15, estimatedMinutes: 120 },
    // Módulo 5: Tailwind CSS
    { title: "17. Layout (flex/grid), responsividade, estados e dark mode", status: "NOT_STARTED", order: 16, estimatedMinutes: 90 },
    // Módulo 6: Node.js + Express
    { title: "18. Node, npm, módulos e variáveis de ambiente", status: "NOT_STARTED", order: 17, estimatedMinutes: 90 },
    { title: "19. Rotas, middlewares e organização de pastas", status: "NOT_STARTED", order: 18, estimatedMinutes: 90 },
    { title: "20. API REST completa: validação, erros e status HTTP", status: "NOT_STARTED", order: 19, estimatedMinutes: 120 },
    // Módulo 7: PostgreSQL
    { title: "21. SQL básico: SELECT, INSERT, UPDATE, DELETE", status: "NOT_STARTED", order: 20, estimatedMinutes: 90 },
    { title: "22. Relacionamentos, JOIN, índices e modelagem de tabelas", status: "NOT_STARTED", order: 21, estimatedMinutes: 120 },
    { title: "23. Conectando o banco ao Express", status: "NOT_STARTED", order: 22, estimatedMinutes: 90 },
    { title: "24. ORM com Prisma: schema, migrations e queries", status: "NOT_STARTED", order: 23, estimatedMinutes: 120 },
    // Módulo 8: Autenticação e segurança
    { title: "25. Hash de senha com bcrypt e autenticação com JWT", status: "NOT_STARTED", order: 24, estimatedMinutes: 120 },
    { title: "26. CORS, validação de entrada, proteção de rotas e segurança", status: "NOT_STARTED", order: 25, estimatedMinutes: 120 },
    // Módulo 9: Testes e qualidade
    { title: "27. Testes unitários com Vitest ou Jest", status: "NOT_STARTED", order: 26, estimatedMinutes: 90 },
    { title: "28. Testes de componentes React e de API com Supertest", status: "NOT_STARTED", order: 27, estimatedMinutes: 120 },
    { title: "29. ESLint, Prettier, code review e boas práticas de commits", status: "NOT_STARTED", order: 28, estimatedMinutes: 60 },
    // Módulo 10: Docker e deploy
    { title: "30. Docker e Docker Compose: rodar API e banco em containers", status: "NOT_STARTED", order: 29, estimatedMinutes: 120 },
    { title: "31. CI/CD com GitHub Actions: rodar testes e lint a cada push", status: "NOT_STARTED", order: 30, estimatedMinutes: 120 },
    { title: "32. Deploy (front, API e banco)", status: "NOT_STARTED", order: 31, estimatedMinutes: 120 },
    // Módulo 11: Juntando tudo
    { title: "33. Integrando front e back", status: "NOT_STARTED", order: 32, estimatedMinutes: 150 },
    { title: "34. Projeto final de portfólio: CRUD completo, login, banco, testes, deploy e README", status: "NOT_STARTED", order: 33, estimatedMinutes: 300 },
    // Módulo 12: Lógica, portfólio e entrevistas
    { title: "35. Lógica e estruturas de dados básicas", status: "NOT_STARTED", order: 34, estimatedMinutes: 120 },
    { title: "36. GitHub, README e LinkedIn: como apresentar seus projetos", status: "NOT_STARTED", order: 35, estimatedMinutes: 60 },
    { title: "37. Currículo e entrevistas técnicas e comportamentais para vaga júnior", status: "NOT_STARTED", order: 36, estimatedMinutes: 60 },
    { title: "38. Inglês técnico: ler documentação e mensagens de erro", status: "NOT_STARTED", order: 37, estimatedMinutes: 60 },
    // Conteúdo extra para completar 42 itens
    { title: "39. JavaScript avançado: closures, prototypes e async/await", status: "NOT_STARTED", order: 38, estimatedMinutes: 120 },
    { title: "40. TypeScript avançado: utility types, mapped types e conditional types", status: "NOT_STARTED", order: 39, estimatedMinutes: 90 },
    { title: "41. React avançado: hooks customizados, performance e patterns", status: "NOT_STARTED", order: 40, estimatedMinutes: 120 },
    { title: "42. Deploy completo com CI/CD e monitoramento", status: "NOT_STARTED", order: 41, estimatedMinutes: 120 },
  ];

  const roadmap = await prisma.roadmap.create({
    data: {
      userId,
      title: "Roadmap Full Stack Júnior",
      description: "12 módulos, 42 aulas: da base da web ao deploy, testes e carreira. Do zero ao primeiro emprego como desenvolvedor Full Stack.",
      goal: "Conquistar a primeira vaga como desenvolvedor Full Stack.",
      level: "beginner",
      color: "#0ea5e9",
      order: 0,
      items: {
        create: ROADMAP_ITEMS.map((item, index) => ({
          userId,
          title: item.title,
          status: item.status,
          order: item.order,
          estimatedMinutes: item.estimatedMinutes,
        })),
      },
    },
    include: { items: true },
  });

  console.log(`✅ ${ROADMAP_ITEMS.length} itens de roadmap criados`);

  // Conteúdo teórico e links oficiais de demonstração (primeiros itens)
  const itemIdByOrder = new Map(roadmap.items.map((item) => [item.order, item.id]));

  await prisma.studyContent.createMany({
    data: [
      {
        userId,
        roadmapItemId: itemIdByOrder.get(0)!,
        title: "Comandos essenciais do terminal",
        type: "NOTE",
        content:
          "pwd — mostra o diretório atual\nls -la — lista arquivos, inclusive ocultos\ncd pasta — entra na pasta\ncd .. — volta um nível\nmkdir nome — cria pasta\ntouch arquivo — cria arquivo vazio\nchmod +x arquivo — dá permissão de execução",
        order: 0,
      },
      {
        userId,
        roadmapItemId: itemIdByOrder.get(0)!,
        title: "Linux Journey — curso gratuito",
        type: "LINK",
        url: "https://linuxjourney.com/",
        order: 1,
      },
      {
        userId,
        roadmapItemId: itemIdByOrder.get(1)!,
        title: "Git — documentação oficial",
        type: "LINK",
        url: "https://git-scm.com/doc",
        order: 0,
      },
      {
        userId,
        roadmapItemId: itemIdByOrder.get(1)!,
        title: "Fluxo básico de branches",
        type: "NOTE",
        content:
          "git switch -c minha-feature — cria e entra na branch\ngit add . && git commit -m \"feat: ...\" — registra a mudança\ngit push -u origin minha-feature — publica a branch\ngit switch main && git pull — atualiza a main antes do merge",
        order: 1,
      },
      {
        userId,
        roadmapItemId: itemIdByOrder.get(2)!,
        title: "MDN — Como a web funciona",
        type: "ARTICLE",
        url: "https://developer.mozilla.org/pt-BR/docs/Learn/Getting_started_with_the_web/How_the_Web_works",
        order: 0,
      },
      {
        userId,
        roadmapItemId: itemIdByOrder.get(21)!,
        title: "Prisma — documentação oficial",
        type: "LINK",
        url: "https://www.prisma.io/docs",
        order: 0,
      },
    ],
  });

  await prisma.roadmapItem.updateMany({
    where: { id: itemIdByOrder.get(1), userId },
    data: { resourceUrl: "https://git-scm.com/doc" },
  });

  // ── Biblioteca relacionada ao roadmap
  const bibliotecaItens = [
    {
      userId,
      itemType: "book",
      itemId: "book-js-definitive",
      title: "JavaScript: O Guia Definitivo",
      author: "David Flanagan",
      status: "to_read",
      progress: 0,
      coverUrl: null,
      fileUrl: null,
      fileKey: null,
      mimeType: null,
      fileSize: null,
      totalPages: 1096,
      currentPage: 0,
      durationSec: null,
      rating: null,
      notes: "Referência completa de JavaScript moderno",
      lastAccessedAt: null,
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
      notes: "Hooks, Context API e padrões modernos",
      lastAccessedAt: null,
    },
    {
      userId,
      itemType: "book",
      itemId: "book-tailwind-css",
      title: "Tailwind CSS: Construindo Interfaces Modernas",
      author: "Vários",
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
      currentPage: 0,
      durationSec: 39600,
      positionSec: 0,
      rating: null,
      notes: "Jornada de um mestre à excelência em programação",
      lastAccessedAt: null,
    },
  ];

  await prisma.libraryItem.createMany({
    data: bibliotecaItens,
  });

  console.log(`✅ ${bibliotecaItens.length} itens de biblioteca criados`);
}

async function main() {
  console.log("🚀 Iniciando seed do DevPath Hub...\n");

  const demo = await seedDemoUsers();
  await seedDemoData(demo.pabloId);

  console.log("\n🎉 Seed concluído!");
}

main()
  .catch((error) => {
    console.error("❌ Erro no seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });