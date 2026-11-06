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

// ═══════════════════════════════════════════════════════════════════════════════
// Usuários e dados de demonstração do DevPath Hub
// ═══════════════════════════════════════════════════════════════════════════════

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
    prisma.libraryItem.deleteMany({ where: { userId } }),
  ]);

  // ══════════════════════════════════════════════════════════════════════════════
  // Roadmap Full Stack Júnior - 12 módulos, 42 aulas
  // ══════════════════════════════════════════════════════════════════════════════

  const ROADMAP_ITEMS = [
    // Módulo 1: Fundamentos (5 itens)
    {
      title: "1. Terminal e Linux: navegar, criar e mover arquivos e pastas, permissões",
      status: "NOT_STARTED",
      order: 0,
      estimatedMinutes: 90,
      contents: [
        { title: "Terminal Linux - Comandos Essenciais", type: "NOTE", content: "# Terminal Linux\n\n## Navegação\n- pwd, ls, cd\n- cd .., cd ~\n\n## Criação\n- mkdir, touch\n- rm, rm -r\n- cp, mv\n\n## Permissões\n- ls -l\n- chmod, chown", order: 0 },
        { title: "Tutorial Oficial Linux", type: "LINK", url: "https://linuxjourney.com/lesson/the-basics-of-the-terminal", order: 1 },
      ],
    },
    {
      title: "2. Git e GitHub: commit, branch, merge, pull request e resolução de conflitos",
      status: "NOT_STARTED",
      order: 1,
      estimatedMinutes: 120,
      contents: [
        {
          title: "Git e GitHub - Fluxo Essencial",
          type: "NOTE",
          content: "# Git e GitHub\n\n## Comandos\n- git init, git clone\n- git add, git commit\n- git push, git pull\n- git branch, git merge\n- git status, git log\n\n## Boas práticas\n- Commits pequenos\n- Mensagens descritivas\n- Uma branch por feature\n- Pull request para revisão", order: 0 },
        { title: "GitHub Docs", type: "LINK", url: "https://docs.github.com/pt/get-started/quickstart/contributing-to-projects", order: 1 },
      ],
    },
    {
      title: "3. Como a web funciona: cliente e servidor, HTTP, métodos, status codes, DNS e JSON",
      status: "NOT_STARTED",
      order: 2,
      estimatedMinutes: 100,
      contents: [
        {
          title: "Como a Web Funciona",
          type: "NOTE",
          content: "# Como a Web Funciona\n\n## Cliente-Servidor\nCliente: navegador, apps móveis.\nServidor: armazena dados e processa requisições.\n\n## HTTP\n- GET: recuperar dados\n- POST: criar recurso\n- PUT/PATCH: atualizar\n- DELETE: remover\n\n## Status\n- 200: OK\n- 201: Criado\n- 404: Não encontrado\n- 500: Erro servidor\n\n## DNS\nTraduz nomes de domínio em endereços IP.\n\n## JSON\nFormato padrão para troca de dados.\n```json\n{ \"nome\": \"João\", \"idade\": 25 }\n```", order: 0 },
        { title: "MDN - HTTP Overview", type: "LINK", url: "https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Overview", order: 1 },
      ],
    },
    {
      title: "4. HTML semântico, formulários e acessibilidade básica",
      status: "NOT_STARTED",
      order: 3,
      estimatedMinutes: 120,
      contents: [
        {
          title: "HTML Semântico",
          type: "NOTE",
          content: "# HTML Semântico\n\nUsa tags que descrevem o significado do conteúdo.\n\n## Tags principais\n- header, nav, main, article, section, aside, footer\n- figure, figcaption, time, mark\n\n## Formulários\n<input>, <select>, <textarea>, <button>\n\n## Acessibilidade\n- Alt text em imagens\n- Label em inputs\n- Navegação por teclado\n- ARIA landmarks", order: 0 },
        { title: "MDN HTML Semântico", type: "LINK", url: "https://developer.mozilla.org/pt-BR/docs/Glossary/Semantics", order: 1 },
        { title: "MDN Acessibilidade", type: "LINK", url: "https://developer.mozilla.org/pt-BR/docs/Learn/Accessibility", order: 2 },
      ],
    },
    {
      title: "5. CSS: seletores, box model, flexbox, grid e responsividade",
      status: "NOT_STARTED",
      order: 4,
      estimatedMinutes: 150,
      contents: [
        {
          title: "CSS - Seletores e Box Model",
          type: "NOTE",
          content: "# CSS\n\n## Seletores\n- .classe, #id, elemento, [atributo]\n- :hover, :focus, :active\n\n## Box Model\ncontent + padding + border + margin\n\n## Exemplo\n```css\n.card {\n  border: 1px solid #ddd;\n  border-radius: 8px;\n  padding: 20px;\n  margin: 20px;\n}\n```", order: 0 },
        { title: "MDN Box Model", type: "LINK", url: "https://developer.mozilla.org/pt-BR/docs/Learn/CSS/Box_model", order: 1 },
      ],
    },
    // Módulo 2: JavaScript (7 itens)
    {
      title: "6. Variáveis, tipos, operadores, if/else e switch",
      status: "NOT_STARTED",
      order: 5,
      estimatedMinutes: 90,
      contents: [
        {
          title: "JavaScript - Variáveis e Tipos",
          type: "NOTE",
          content: "# JavaScript\n\n## Variáveis\n- let: escopo de bloco, pode reatribuir\n- const: escopo de bloco, não reatribuir\n- var: evite usar\n\n## Tipos\n- string, number, boolean, null, undefined, symbol, bigint\n- object, array, function\n\n## Operadores\n- == vs === (use sempre ===)\n- &&, ||, !\n- ?? (nullish coalescing)\n\n## Estruturas\n- if/else, switch, ternário\n- for, while, forEach, for...of", order: 0 },
      ],
    },
    {
      title: "7. Loops e funções (incluindo arrow functions)",
      status: "NOT_STARTED",
      order: 6,
      estimatedMinutes: 90,
      contents: [
        {
          title: "Loops e Funções",
          type: "NOTE",
          content: "# Loops e Funções\n\n## Loops\n- for, while, do...while\n- forEach, for...of, for...in\n\n## Funções\n```javascript\nfunction soma(a, b) { return a + b; }\nconst soma = (a, b) => a + b;\n```\n\n## Escopo\n- var: função\n- let/const: bloco\n\n## Hoisting\nvar e function são elevados ao topo.\n\n## Closure\nFunção lembra o escopo onde foi criada.\n```javascript\nfunction contador() {\n  let c = 0;\n  return () => ++c;\n}\n```", order: 0 },
      ],
    },
    {
      title: "8. Arrays e objects, com map, filter, find e reduce",
      status: "NOT_STARTED",
      order: 7,
      estimatedMinutes: 90,
      contents: [
        {
          title: "Arrays e Objetos",
          type: "NOTE",
          content: "# Arrays e Objetos\n\n## Arrays\n```javascript\nconst frutas = ['maçã', 'banana'];\nfrutas.push('uva');\nfrutas.pop();\nfrutas.map(f => f.toUpperCase());\nfrutas.filter(f => f.includes('a'));\nfrutas.find(f => f.startsWith('b'));\n```\n\n## Objetos\n```javascript\nconst pessoa = { nome: 'João', idade: 25 };\nconsole.log(pessoa.nome);\npessoa.profissao = 'Dev';\nconst { nome, idade } = pessoa;\nconst copia = { ...pessoa };\n```", order: 0 },
      ],
    },
    // Módulo 3: TypeScript (2 itens)
    {
      title: "9. Tipos básicos, type vs interface, unions",
      status: "NOT_STARTED",
      order: 8,
      estimatedMinutes: 90,
      contents: [
        {
          title: "TypeScript - Tipos",
          type: "NOTE",
          content: "# TypeScript\n\n## Tipos básicos\nstring, number, boolean, null, undefined, any, unknown\n\n## Interfaces e Types\n```typescript\ninterface Usuario {\n  nome: string;\n  idade: number;\n  email?: string;\n}\n\ntype Status = 'ativo' | 'inativo' | 'pendente';\n```\n\n## Generics\n```typescript\nfunction identidade<T>(valor: T): T {\n  return valor;\n}\n```", order: 0 },
      ],
    },
    {
      title: "10. Generics, utility types e tipagem de funções",
      status: "NOT_STARTED",
      order: 9,
      estimatedMinutes: 90,
      contents: [
        {
          title: "TypeScript Avançado",
          type: "NOTE",
          content: "# TypeScript Avançado\n\n## Utility Types\n- Partial<T>: todas opcionais\n- Required<T>: todas obrigatórias\n- Readonly<T>: todas só leitura\n- Pick<T, K>: escolhe algumas chaves\n- Omit<T, K>: remove algumas chaves\n\n## Generics\n```typescript\nfunction resposta<T>(dados: T) {\n  return { sucesso: true, dados };\n}\n```\n\n## Tipagem de funções\n```typescript\nfunction somar(a: number, b: number): number {\n  return a + b;\n}\n\nconst operacao: (a: number, b: number) => number = somar;\n```", order: 0 },
      ],
    },
    // Módulo 4: React (6 itens)
    {
      title: "11. Componentes, JSX e props",
      status: "NOT_STARTED",
      order: 10,
      estimatedMinutes: 90,
      contents: [
        {
          title: "React - Componentes e JSX",
          type: "NOTE",
          content: "# React\n\n## Componentes\nFunções que retornam JSX.\n\n```javascript\nfunction MeuComponente() {\n  return <h1>Olá, Mundo!</h1>;\n}\n```\n\n## Props\nDados passados de pai para filho.\n\n```javascript\nfunction Saudacao({ nome }) {\n  return <h1>Olá, {nome}!</h1>;\n}\n\n<Saudacao nome=\"Maria\" />\n```\n\n## Regras\n- Componentes começam com letra maiúscula\n- Retornam um único elemento\n- São funções puras (não modificam entrada)", order: 0 },
      ],
    },
    {
      title: "12. useState e eventos",
      status: "NOT_STARTED",
      order: 11,
      estimatedMinutes: 90,
      contents: [
        {
          title: "React - useState e Eventos",
          type: "NOTE",
          content: "# React - useState\n\n## useState\n```javascript\nimport { useState } from 'react';\n\nfunction Contador() {\n  const [contagem, setContagem] = useState(0);\n  \n  return (\n    <div>\n      <p>Contagem: {contagem}</p>\n      <button onClick={() => setContagem(contagem + 1)}>Incrementar</button>\n    </div>\n  );\n}\n```\n\n## Eventos\n- onClick, onChange, onSubmit, onBlur\n- Sempre use camelCase em React\n- Passe a função, não chame ela: onClick={clicar} não onClick={clicar()}", order: 0 },
      ],
    },
    {
      title: "13. useEffect e consumo de API",
      status: "NOT_STARTED",
      order: 12,
      estimatedMinutes: 120,
      contents: [
        {
          title: "useEffect e API",
          type: "NOTE",
          content: "# useEffect\n\n## useEffect\nExecuta efeitos colaterais em componentes.\n\n```javascript\nuseEffect(() => {\n  // código que roda após renderizar\n  return () => {\n    // limpeza (desinscrever listeners)\n  };\n}, [dependencias]);\n```\n\n## Consumo de API\n```javascript\nuseEffect(() => {\n  fetch('https://api.exemplo.com/dados')\n    .then(res => res.json())\n    .then(dados => setDados(dados));\n}, []); // [] = roda apenas uma vez (montagem)\n```", order: 0 },
      ],
    },
    {
      title: "14. Listas, formulários e renderização condicional",
      status: "NOT_STARTED",
      order: 13,
      estimatedMinutes: 90,
      contents: [
        {
          title: "Listas e Formulários",
          type: "NOTE",
          content: "# Listas e Formulários\n\n## Listas\nSempre use chave (key) única.\n```javascript\nconst lista = itens.map(item => (\n  <li key={item.id}>{item.nome}</li>\n));\n```\n\n## Formulários\nComponentes controlados:\n```javascript\nconst [valor, setValor] = useState('');\n\n<input\n  value={valor}\n  onChange={e => setValor(e.target.value)}\n/>\n```\n\n## Renderização Condicional\n```javascript\n{condicao && <Elemento />}\n{condicao ? <A /> : <B />}\n```", order: 0 },
      ],
    },
    {
      title: "15. React Router, Context e custom hooks",
      status: "NOT_STARTED",
      order: 14,
      estimatedMinutes: 90,
      contents: [
        {
          title: "React Router e Context",
          type: "NOTE",
          content: "# React Router e Context\n\n## React Router\n```javascript\n<BrowserRouter>\n  <Routes>\n    <Route path=\"/\" element={<Home />} />\n    <Route path=\"/sobre\" element={<Sobre />} />\n  </Routes>\n</BrowserRouter>\n```\n\n## Context\n```javascript\nconst Contexto = createContext();\n\nfunction Provedor({ filhos }) {\n  const [valor, setValor] = useState('inicial');\n  return (\n    <Contexto.Provider valor={{ valor, setValor }}>\n      {filhos}\n    </Contexto.Provider>\n  );\n}\n```\n\n## Custom Hooks\n```javascript\nfunction useContador(inicial = 0) {\n  const [contagem, setContagem] = useState(inicial);\n  const incrementar = () => setContagem(c => c + 1);\n  return { contagem, incrementar };\n}\n```", order: 0 },
      ],
    },
    {
      title: "16. Formulários validados com React Hook Form + Zod e cache de dados com TanStack Query",
      status: "NOT_STARTED",
      order: 15,
      estimatedMinutes: 120,
      contents: [
        {
          title: "React Hook Form + Zod",
          type: "NOTE",
          content: "# Formulários\n\n## React Hook Form\n```javascript\nimport { useForm } from 'react-hook-form';\n\nfunction Formulario() {\n  const { registrar, manipularEnvio, erros } = useForm();\n  \n  return (\n    <form onSubmit={manipularEnvio(dados => console.log(dados))}>\n      <input {...registrar('nome', { obrigatorio: true })} />\n      {erros.nome && <span>Nome é obrigatório</span>}\n      <button type=\"submit\">Enviar</button>\n    </form>\n  );\n}\n```\n\n## Zod\n```javascript\nconst schema = z.object({\n  email: z.string().email(),\n  idade: z.number().min(18)\n});\n```", order: 0 },
      ],
    },
    // Módulo 5: Tailwind CSS (1 item)
    {
      title: "17. Layout (flex/grid), responsividade, estados e dark mode",
      status: "NOT_STARTED",
      order: 16,
      estimatedMinutes: 90,
      contents: [
        {
          title: "Tailwind CSS",
          type: "NOTE",
          content: "# Tailwind CSS\n\n## Classes Utilitárias\n```html\n<div class=\"flex items-center justify-between p-4 bg-white rounded shadow\">\n  <h1 class=\"text-xl font-bold\">Título</h1>\n  <button class=\"bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600\">\n    Ação\n  </button>\n</div>\n```\n\n## Responsividade\n- sm: 640px+\n- md: 768px+\n- lg: 1024px+\n- xl: 1280px+\n\n```html\n<div class=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4\">\n  <!-- cards -->\n</div>\n```\n\n## Estados\n- hover:, focus:, active:, disabled:\n\n## Dark Mode\n```html\n<div class=\"bg-white text-black dark:bg-black dark:text-white\">\n  Conteúdo\n</div>\n```", order: 0 },
      ],
    },
    // Módulo 6: Node.js + Express (3 itens)
    {
      title: "18. Node, npm, módulos e variáveis de ambiente",
      status: "NOT_STARTED",
      order: 17,
      estimatedMinutes: 90,
      contents: [
        {
          title: "Node.js - Fundamentos",
          type: "NOTE",
          content: "# Node.js\n\n## O que é\nAmbiente de execução JavaScript no lado do servidor.\n\n## npm\n- npm init -y: inicializa projeto\n- npm install pacote: instala dependência\n- npm install -D pacote: dependência de desenvolvimento\n- package.json: gerencia dependências e scripts\n\n## Módulos\n```javascript\n// CommonJS\nconst modulo = require('./modulo');\nmodule.exports = { funcao };\n\n// ES Modules (ESM)\nimport modulo from './modulo.js';\nexport default funcao;\n```\n\n## Variáveis de Ambiente\n```javascript\n// .env\nPORT=3000\nDATABASE_URL=postgres://...\n\n// Código\nconst porta = process.env.PORT || 3000;\nconst url = process.env.DATABASE_URL;\n```", order: 0 },
      ],
    },
    {
      title: "19. Rotas, middlewares e organização de pastas",
      status: "NOT_STARTED",
      order: 18,
      estimatedMinutes: 90,
      contents: [
        {
          title: "Rotas e Middlewares",
          type: "NOTE",
          content: "# Node.js - Rotas e Middlewares\n\n## Rotas com Express\n```javascript\nconst express = require('express');\nconst app = express();\n\napp.get('/usuarios', (req, res) => {\n  res.json([{ id: 1, nome: 'João' }]);\n});\n\napp.post('/usuarios', (req, res) => {\n  const novo = req.body;\n  res.status(201).json(novo);\n});\n\napp.listen(3000);\n```\n\n## Middlewares\n```javascript\n// Middleware próprio\nfunction logger(req, res, next) {\n  console.log(\`${req.method} ${req.url}\`);\n  next();\n}\n\napp.use(logger);\n\n// Middleware de JSON\napp.use(express.json());\n```\n\n## Estrutura de Pastas\n```\nprojeto/\n  src/\n    routes/\n    controllers/\n    models/\n    middlewares/\n    app.js\n    server.js\n  .env\n  package.json\n```", order: 0 },
      ],
    },
    {
      title: "20. API REST completa: validação, erros e status HTTP",
      status: "NOT_STARTED",
      order: 19,
      estimatedMinutes: 120,
      contents: [
        {
          title: "API REST com Express",
          type: "NOTE",
          content: "# API REST com Express\n\n## CRUD Completo\n```javascript\napp.get('/produtos', listarProdutos);\napp.post('/produtos', criarProduto);\napp.get('/produtos/:id', obterProduto);\napp.put('/produtos/:id', atualizarProduto);\napp.delete('/produtos/:id', deletarProduto);\n```\n\n## Validação com Zod\n```javascript\nconst schema = z.object({\n  nome: z.string().min(3),\n  preco: z.number().positive()\n});\n\napp.post('/produtos', (req, res) => {\n  const resultado = schema.safeParse(req.body);\n  if (!resultado.success) {\n    return res.status(400).json(resultado.error);\n  }\n  // processar...\n});\n```\n\n## Tratamento de Erros\n```javascript\napp.use((erro, req, res, next) => {\n  console.error(erro);\n  res.status(500).json({ erro: 'Erro interno' });\n});\n```", order: 0 },
      ],
    },
    // Módulo 7: PostgreSQL (4 itens)
    {
      title: "21. SQL básico: SELECT, INSERT, UPDATE, DELETE",
      status: "NOT_STARTED",
      order: 20,
      estimatedMinutes: 90,
      contents: [
        {
          title: "SQL Básico",
          type: "NOTE",
          content: "# SQL Básico\n\n## SELECT\n```sql\nSELECT * FROM usuarios;\nSELECT nome, email FROM usuarios WHERE ativo = true;\nSELECT * FROM produtos WHERE preco > 100 ORDER BY preco DESC;\n```\n\n## INSERT\n```sql\nINSERT INTO usuarios (nome, email) VALUES ('João', 'joao@email.com');\n```\n\n## UPDATE\n```sql\nUPDATE usuarios SET nome = 'Maria' WHERE id = 1;\n```\n\n## DELETE\n```sql\nDELETE FROM usuarios WHERE id = 1;\n```\n\n## JOIN\n```sql\nSELECT u.nome, p.titulo\nFROM usuarios u\nJOIN posts p ON u.id = p.usuario_id;\n```", order: 0 },
      ],
    },
    {
      title: "22. Relacionamentos, JOIN, índices e modelagem de tabelas",
      status: "NOT_STARTED",
      order: 21,
      estimatedMinutes: 120,
      contents: [
        {
          title: "Modelagem de Banco de Dados",
          type: "NOTE",
          content: "# Modelagem de Dados\n\n## Tipos de Relacionamento\n- 1:1: Um usuário tem um perfil\n- 1:N: Um usuário tem muitos posts\n- N:N: Muitos usuários curtem muitos posts\n\n## Exemplo de Schema\n```sql\nCREATE TABLE usuarios (\n  id SERIAL PRIMARY KEY,\n  nome VARCHAR(100) NOT NULL,\n  email VARCHAR(255) UNIQUE NOT NULL,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE TABLE posts (\n  id SERIAL PRIMARY KEY,\n  titulo VARCHAR(200) NOT NULL,\n  conteudo TEXT,\n  usuario_id INTEGER REFERENCES usuarios(id),\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n```\n\n## Índices\n```sql\nCREATE INDEX idx_usuarios_email ON usuarios(email);\nCREATE INDEX idx_posts_usuario_id ON posts(usuario_id);\n```", order: 0 },
      ],
    },
    {
      title: "23. Conectando o banco ao Express",
      status: "NOT_STARTED",
      order: 22,
      estimatedMinutes: 90,
      contents: [
        {
          title: "Conectando Banco ao Express",
          type: "NOTE",
          content: "# Conectando Banco ao Express\n\n## com pg (cliente PostgreSQL)\n```javascript\nconst { Pool } = require('pg');\n\nconst pool = new Pool({\n  host: process.env.DB_HOST,\n  port: process.env.DB_PORT,\n  database: process.env.DB_NAME,\n  user: process.env.DB_USER,\n  password: process.env.DB_PASSWORD\n});\n\napp.get('/usuarios', async (req, res) => {\n  const resultado = await pool.query('SELECT * FROM usuarios');\n  res.json(resultado.rows);\n});\n```\n\n## com Prisma (recomendado)\n```javascript\nconst { PrismaClient } = require('@prisma/client');\nconst prisma = new PrismaClient();\n\napp.get('/usuarios', async (req, res) => {\n  const usuarios = await prisma.usuario.findMany();\n  res.json(usuarios);\n});\n```", order: 0 },
      ],
    },
    {
      title: "24. ORM com Prisma: schema, migrations e queries",
      status: "NOT_STARTED",
      order: 23,
      estimatedMinutes: 120,
      contents: [
        {
          title: "Prisma ORM",
          type: "NOTE",
          content: "# Prisma ORM\n\n## Schema\n```prisma\n// prisma/schema.prisma\nmodel Usuario {\n  id        Int      @id @default(autoincrement())\n  nome      String\n  email     String   @unique\n  senha     String\n  posts     Post[]\n  criadoEm  DateTime @default(now())\n}\n\nmodel Post {\n  id        Int      @id @default(autoincrement())\n  titulo    String   @db.VarChar(200)\n  conteudo  String?\n  publicado Boolean  @default(false)\n  autor     Usuario  @relation(fields: [autorId], references: [id])\n  autorId   Int\n  criadoEm  DateTime @default(now())\n}\n```\n\n## Migrações\n```bash\nnpx prisma migrate dev --nome_inicial\nnpx prisma migrate deploy  # produção\n```\n\n## Queries\n```javascript\n// Criar\nconst usuario = await prisma.usuario.create({\n  data: { nome: 'João', email: 'joao@email.com' }\n});\n\n// Listar\nconst usuarios = await prisma.usuario.findMany({\n  where: { publicado: true },\n  include: { posts: true }\n});\n\n// Atualizar\nconst atualizado = await prisma.usuario.update({\n  where: { id: 1 },\n  data: { nome: 'Maria' }\n});\n\n// Deletar\nawait prisma.usuario.delete({\n  where: { id: 1 }\n});\n```", order: 0 },
      ],
    },
    // Módulo 8: Autenticação e segurança (2 itens)
    {
      title: "25. Hash de senha com bcrypt e autenticação com JWT",
      status: "NOT_STARTED",
      order: 22,
      estimatedMinutes: 120,
      contents: [
        {
          title: "Autenticação com bcrypt e JWT",
          type: "NOTE",
          content: "# Autenticação\n\n## Hash de Senhas com bcrypt\n```javascript\nconst bcrypt = require('bcryptjs');\n\n// Criptografar senha\nconst senhaHash = await bcrypt.hash('minhaSenha123', 10);\n\n// Verificar senha\nconst valido = await bcrypt.compare('minhaSenha123', senhaHash);\n```\n\n## JWT (JSON Web Token)\n```javascript\nconst jwt = require('jsonwebtoken');\n\n// Gerar token\nconst token = jwt.sign(\n  { usuarioId: usuario.id, email: usuario.email },\n  process.env.JWT_SECRET,\n  { expiresIn: '7d' }\n);\n\n// Verificar token\nconst decodificado = jwt.verify(token, process.env.JWT_SECRET);\n```\n\n## Middleware de Autenticação\n```javascript\nfunction autenticar(req, res, next) {\n  const token = req.headers.authorization?.split(' ')[1];\n  \n  if (!token) return res.status(401).json({ erro: 'Não autenticado' });\n  \n  try {\n    const decodificado = jwt.verify(token, process.env.JWT_SECRET);\n    req.usuarioId = decodificado.usuarioId;\n    next();\n  } catch (erro) {\n    return res.status(401).json({ erro: 'Token inválido' });\n  }\n}\n\napp.get('/perfil', autenticar, (req, res) => {\n  res.json({ usuarioId: req.usuarioId });\n});\n```", order: 0 },
      ],
    },
    {
      title: "26. CORS, validação de entrada, proteção de rotas e os erros de segurança mais comuns",
      status: "NOT_STARTED",
      order: 23,
      estimatedMinutes: 120,
      contents: [
        {
          title: "Segurança em APIs",
          type: "NOTE",
          content: "# Segurança em APIs\n\n## CORS\n```javascript\nconst cors = require('cors');\n\napp.use(cors({\n  origem: process.env.FRONTEND_URL,\n  credenciais: true\n}));\n```\n\n## Helmet\n```javascript\nconst helmet = require('helmet');\napp.use(helmet());\n```\n\n## Rate Limiting\n```javascript\nconst rateLimit = require('express-rate-limit');\n\nconst limitador = rateLimit({\n  janelaMs: 15 * 60 * 1000, // 15 minutos\n  maximo: 100 // máximo 100 requisições por janela\n});\n\napp.use('/api/', limitador);\n```\n\n## Validação de Entrada\nSempre valide dados de entrada com Zod ou similar:\n```javascript\nconst schema = z.object({\n  email: z.string().email(),\n  senha: z.string().min(8)\n});\n```\n\n## Erros de Segurança Comuns\n\n### SQL Injection\n- NÃO concatene strings em queries SQL\n- USE parâmetros ou ORM (Prisma)\n\n### XSS\n- Nunca renderize HTML de usuário sem sanitizar\n- Use sanitize-html ou similar\n\n### Senhas expostas\n- Nunca armazene senhas em texto simples\n- Use bcrypt com custo alto (10+)\n\n### Chaves expostas\n- Nunca commite chaves no Git\n- Use variáveis de ambiente (.env)\n- Adicione .env ao .gitignore", order: 0 },
      ],
    },
    // Módulo 9: Testes (3 itens)
    {
      title: "27. Testes unitários com Vitest ou Jest",
      status: "NOT_STARTED",
      order: 24,
      estimatedMinutes: 90,
      contents: [
        {
          title: "Testes Unitários com Vitest",
          type: "NOTE",
          content: "# Testes Unitários\n\n## Vitest\n```bash\nnpm install -D vitest\n```\n\n```javascript\n// somar.test.js\nimport { describe, it, expect } from 'vitest';\nimport { somar } from './somar';\n\ndescribe('somar', () => {\n  it('deve somar dois números', () => {\n    expect(somar(2, 3)).toBe(5);\n  });\n  \n  it('deve lidar com números negativos', () => {\n    expect(somar(-1, -1)).toBe(-2);\n  });\n});\n```\n\n## Jest\n```javascript\n// jest.config.js\nmodule.exports = {\n  testEnvironment: 'node',\n  testMatch: ['**/*.test.js']\n};\n```\n\n## Boas Práticas\n- Teste unidades isoladas\n- Use nomes descritivos para testes\n- Teste casos de borda (edge cases)\n- Mantenha testes rápidos e independentes", order: 0 },
      ],
    },
    {
      title: "28. Testes de componentes React (Testing Library) e de API (Supertest)",
      status: "NOT_STARTED",
      order: 25,
      estimatedMinutes: 120,
      contents: [
        {
          title: "Testes de Componentes React",
          type: "NOTE",
          content: "# Testes de Componentes\n\n## React Testing Library\n```bash\nnpm install -D @testing-library/react @testing-library/jest-dom\n```\n\n```javascript\nimport { render, screen, fireEvent } from '@testing-library/react';\nimport { Botao } from './Botao';\n\ndescribe('Botao', () => {\n  it('deve exibir texto clicável', () => {\n    render(<Botao texto=\"Clique\" />);\n    const botao = screen.getByText('Clique');\n    expect(botao).toBeInTheDocument();\n    \n    fireEvent.click(botao);\n    expect(screen.getByText('Clicado!')).toBeInTheDocument();\n  });\n});\n```\n\n## Supertest (API)\n```bash\nnpm install -D supertest\n```\n\n```javascript\nconst request = require('supertest');\nconst app = require('./app');\n\ndescribe('API de Usuários', () => {\n  it('deve listar usuários', async () => {\n    const resposta = await request(app).get('/usuarios');\n    expect(resposta.status).toBe(200);\n    expect(resposta.body).toHaveLength(2);\n  });\n});\n```", order: 0 },
      ],
    },
    {
      title: "29. ESLint, Prettier, code review e boas práticas de commits",
      status: "NOT_STARTED",
      order: 26,
      estimatedMinutes: 60,
      contents: [
        {
          title: "ESLint e Prettier",
          type: "NOTE",
          content: "# ESLint e Prettier\n\n## ESLint\nAnalisa código para encontrar erros e más práticas.\n\n```bash\nnpm install -D eslint\nnpx eslint --init\n```\n\n```javascript\n// .eslintrc.json\n{\n  \"extends\": [\"eslint:recommended\"],\n  \"rules\": {\n    \"semi\": [\"error\", \"always\"],\n    \"no-console\": \"warn\"\n  }\n}\n```\n\n## Prettier\nFormatação automática de código.\n\n```bash\nnpm install -D prettier\n```\n\n```json\n// .prettierrc\n{\n  \"semi\": true,\n  \"singleQuote\": true,\n  \"tabWidth\": 2,\n  \"printWidth\": 80\n}\n```\n\n## Husky + lint-staged\nExecuta lint e format antes de commitar.\n```bash\nnpm install -D husky lint-staged\nnpx husky init\nnpm pkg set scripts.prepare=\"husky install\"\n```\n\n```json\n// .lintstagedrc.json\n{\n  \"*.{js,jsx,ts,tsx}\": [\"eslint --fix\", \"prettier --write\"]\n}\n```\n\n## Boas Práticas de Commits\n- Use mensagens descritivas\n- Formato: tipo: descrição\n- Tipos: feat, fix, docs, style, refactor, test, chore\n- Exemplo: feat: adiciona autenticação com JWT", order: 0 },
      ],
    },
    // Módulo 10: Docker e Deploy (3 itens)
    {
      title: "30. Docker e Docker Compose: rodar API e banco em containers",
      status: "NOT_STARTED",
      order: 26,
      estimatedMinutes: 120,
      contents: [
        {
          title: "Docker e Docker Compose",
          type: "NOTE",
          content: "# Docker\n\n## Dockerfile\n```dockerfile\nFROM node:18-alpine\n\nWORKDIR /app\n\nCOPY package*.json ./\\\nRUN npm install\n\nCOPY . .\n\nEXPOSE 3000\n\nCMD [\"node\", \"server.js\"]\n```\n\n## .dockerignore\n```\nnode_modules\nnpm-debug.log\n.env\n.git\n.gitignore\nREADME.md\n```\n\n## Docker Compose\n```yaml\nversion: '3.8'\n\nservices:\n  app:\n    build: .\n    ports:\n      - \"3000:3000\"\n    environment:\n      - DATABASE_URL=postgres://usuario:senha@db:5432/banco\n    depends_on:\n      - db\n\n  db:\n    image: postgres:15-alpine\n    environment:\n      POSTGRES_USER: usuario\n      POSTGRES_PASSWORD: senha\n      POSTGRES_DB: banco\n    volumes:\n      - dados_postgres:/var/lib/postgresql/data\n\nvolumes:\n  dados_postgres:\n```\n\n## Comandos Úteis\n```bash\ndocker build -t minha-app .\ndocker run -p 3000:3000 minha-app\n\ndocker-compose up --build\ndocker-compose down\ndocker-compose logs -f\n```", order: 0 },
      ],
    },
    {
      title: "27. CI/CD com GitHub Actions: rodar testes e lint a cada push",
      status: "NOT_STARTED",
      order: 27,
      estimatedMinutes: 120,
      contents: [
        {
          title: "CI/CD com GitHub Actions",
          type: "NOTE",
          content: "# CI/CD com GitHub Actions\n\n## Workflow Básico\n```yaml\n# .github/workflows/ci.yml\nname: CI\n\non:\n  push:\n    branches: [main]\n  pull_request:\n    branches: [main]\n\njobs:\n  test:\n    runs-on: ubuntu-latest\n    \n    steps:\n      - uses: actions/checkout@v3\n      - \n        name: Setup Node.js\n        uses: actions/setup-node@v3\n        with:\n          node-version: '18'\n          cache: 'npm'\n      - \n        name: Instalar dependências\n        run: npm ci\n      - \n        name: Executar lint\n        run: npm run lint\n      - \n        name: Executar testes\n        run: npm test\n      - \n        name: Build\n        run: npm run build\n```\n\n## Deploy Automático\n```yaml\n- name: Deploy\n  if: github.ref == 'refs/heads/main'\n  run: |\n    echo \"Fazendo deploy...\"\n    # comandos de deploy aqui\n```\n\n## Melhores Práticas\n- Execute testes em todo PR\n- Bloqueie merge se testes falharem\n- Use variáveis de ambiente secrets no GitHub\n- Não commite segredos no código", order: 0 },
      ],
    },
    {
      title: "28. Deploy (front, API e banco)",
      status: "NOT_STARTED",
      order: 26,
      estimatedMinutes: 120,
      contents: [
        {
          title: "Deploy de Aplicação Full Stack",
          type: "NOTE",
          content: "# Deploy\n\n## Frontend (Vercel / Netlify)\n```bash\n# Conectar repositório GitHub\n# Configurar variáveis de ambiente\n# Deploy automático a cada push\n```\n\n## Backend (Render / Railway / Heroku)\n```bash\n# Conectar repositório GitHub\n# Configurar variáveis de ambiente (DATABASE_URL, JWT_SECRET, etc.)\n# Definir comando de start: npm start ou node server.js\n```\n\n## Banco de Dados (Neon / Supabase / Railway)\n```bash\n# Criar banco PostgreSQL\n# Obter connection string\n# Configurar DATABASE_URL no backend\n```\n\n## Variáveis de Ambiente Necessárias\n- DATABASE_URL\n- JWT_SECRET\n- FRONTEND_URL\n- NODE_ENV=production\n- PORTA=3000\n\n## Checklist de Deploy\n- [ ] Código no GitHub\n- [ ] Variáveis de ambiente configuradas\n- [ ] Banco de dados provisionado\n- [ ] Migrações executadas\n- [ ] Build bem-sucedido\n- [ ] Testes passando em produção\n- [ ] Monitoramento de erros configurado", order: 0 },
      ],
    },
    // Módulo 11: Juntando tudo (2 itens)
    {
      title: "29. Integrando front e back",
      status: "NOT_STARTED",
      order: 28,
      estimatedMinutes: 150,
      contents: [
        {
          title: "Integração Frontend-Backend",
          type: "NOTE",
          content: "# Integração Frontend-Backend\n\n## Conexão Frontend-Backend\n```javascript\n// Frontend (React)\nimport axios from 'axios';\n\nconst api = axios.create({\n  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001',\n  headers: {\n    'Content-Type': 'application/json'\n  }\n});\n\n// Adicionar token em todas as requisições\napi.interceptors.request.use(config => {\n  const token = localStorage.getItem('token');\n  if (token) {\n    config.headers.Authorization = `Bearer ${token}`;\n  }\n  return config;\n});\n\n// Usar no componente\nconst resposta = await api.get('/produtos');\nconsole.log(resposta.data);\n```\n\n## CORS no Backend\n```javascript\nconst cors = require('cors');\napp.use(cors({\n  origem: process.env.FRONTEND_URL,\n  credenciais: true\n}));\n```\n\n## Gerenciamento de Estado\n```javascript\n// Usando React Query\nimport { useQuery } from '@tanstack/react-query';\n\nfunction ListaProdutos() {\n  const { dados, estaCarregando, erro } = useQuery({\n    chaveConsulta: ['produtos'],\n    funcaoConsulta: () => api.get('/produtos').then(res => res.data)\n  });\n  \n  if (estaCarregando) return <div>Carregando...</div>;\n  if (erro) return <div>Erro: {erro.mensagem}</div>;\n  \n  return (\n    <ul>\n      {dados.map(produto => (\n        <li key={produto.id}>{produto.nome}</li>\n      ))}\n    </ul>\n  );\n}\n```", order: 0 },
      ],
    },
    {
      title: "30. Projeto final de portfólio: CRUD completo, login, banco, testes, deploy e README bem escrito",
      status: "NOT_STARTED",
      order: 29,
      estimatedMinutes: 300,
      contents: [
        {
          title: "Projeto Final de Portfólio",
          type: "NOTE",
          content: "# Projeto Final\n\n## Estrutura do Projeto\n```\nmeu-projeto/\n├── frontend/          # React + Tailwind\n├── backend/           # Node + Express + Prisma\n├── docker-compose.yml\n├── README.md\n└── .env.example\n```\n\n## Funcionalidades Obrigatórias\n- [ ] Autenticação (login/cadastro)\n- [ ] CRUD completo de pelo menos um recurso\n- [ ] Banco de dados PostgreSQL\n- [ ] Testes (unitários + integração)\n- [ ] Deploy funcionando\n- [ ] README detalhado\n\n## README.md Estrutura\n```markdown\n# Nome do Projeto\n\n## Descrição\nBreve descrição do projeto.\n\n## Tecnologias\n- React, Node.js, PostgreSQL, Docker\n\n## Como Executar\n```bash\n# Backend\ncd backend\nnpm install\ncp .env.example .env\n# Configure DATABASE_URL e JWT_SECRET\nnpm run dev\n\n# Frontend\ncd frontend\nnpm install\nnpm start\n```\n\n## Endpoints da API\nListe os principais endpoints.\n\n## Deploy\nLink para aplicação em produção.\n```\n\n## Checklist Final\n- [ ] Código limpo e documentado\n- [ ] Variáveis de ambiente configuradas\n- [ ] Testes passando\n- [ ] Deploy funcionando\n- [ ] README completo\n- [ ] LinkedIn atualizado com link do projeto", order: 0 },
      ],
    },
    // Módulo 12: Lógica, portfólio e entrevistas (4 itens)
    {
      title: "31. Lógica e estruturas de dados básicas: arrays, objetos, pilhas, filas, recursão e noção de Big O",
      status: "NOT_STARTED",
      order: 30,
      estimatedMinutes: 120,
      contents: [
        {
          title: "Lógica e Estruturas de Dados",
          type: "NOTE",
          content: "# Estruturas de Dados\n\n## Arrays\n- Acesso por índice: O(1)\n- Inserção/remoção no final: O(1)\n- Inserção/remoção no início: O(n)\n- Busca: O(n)\n\n## Pilha (Stack)\n- LIFO (Last In, First Out)\n- Operações: push, pop, peek\n- Caso de uso: desfazer ações, navegação\n\n```javascript\nclass Pilha {\n  constructor() {\n    this.itens = [];\n  }\n  \n  push(item) {\n    this.itens.push(item);\n  }\n  \n  pop() {\n    return this.itens.pop();\n  }\n  \n  peek() {\n    return this.itens[this.itens.length - 1];\n  }\n}\n```\n\n## Fila (Queue)\n- FIFO (First In, First Out)\n- Operações: enfileirar, desenfileirar, frente\n- Caso de uso: impressão, atendimento\n\n```javascript\nclass Fila {\n  constructor() {\n    this.itens = [];\n  }\n  \n  enfileirar(item) {\n    this.itens.push(item);\n  }\n  \n  desenfileirar() {\n    return this.itens.shift();\n  }\n  \n  frente() {\n    return this.itens[0];\n  }\n}\n```\n\n## Big O Notation\n| Operação | Complexidade |\n|----------|--------------|\n| Acesso por índice | O(1) |\n| Busca linear | O(n) |\n| Busca binária | O(log n) |\n| Ordenação simples | O(n²) |\n| Ordenação eficiente | O(n log n) |", order: 0 },
      ],
    },
    {
      title: "32. GitHub, README e LinkedIn: como apresentar seus projetos",
      status: "NOT_STARTED",
      order: 31,
      estimatedMinutes: 60,
      contents: [
        {
          title: "GitHub e Portfólio",
          type: "NOTE",
          content: "# GitHub e Portfólio\n\n## README.md Bom\n```markdown\n# Nome do Projeto\n\n## Descrição\nUma linha descrevendo o que o projeto faz.\n\n## Demonstração\n[Link para deploy ao vivo]\n\n## Tecnologias\n- React, Node.js, PostgreSQL, Tailwind CSS\n\n## Como Executar Localmente\n```bash\n# Clone o repositório\ngit clone https://github.com/seu-usuario/projeto.git\ncd projeto\n\n# Instale dependências\nnpm install\n\n# Configure variáveis de ambiente\ncp .env.example .env\n# Edite o .env com suas credenciais\n\n# Execute o projeto\nnpm run dev\n```\n\n## Funcionalidades\n- [x] Autenticação de usuários\n- [ ] CRUD de produtos\n- [ ] Painel administrativo\n- [ ] Busca e filtros\n\n## Capturas de Tela\nAdicione screenshots da aplicação.\n\n## Autor\nSeu Nome - [LinkedIn](https://linkedin.com/in/seu-usuario) - [GitHub](https://github.com/seu-usuario)\n```\n\n## LinkedIn\n- Mantenha perfil atualizado\n- Adicione projetos na seção de destaque\n- Escreva descrições claras de cada projeto\n- Compartilhe seus aprendizados regularmente", order: 0 },
      ],
    },
    {
      title: "33. Currículo e entrevistas técnicas e comportamentais para vaga júnior",
      status: "NOT_STARTED",
      order: 32,
      estimatedMinutes: 60,
      contents: [
        {
          title: "Currículo e Entrevistas",
          type: "NOTE",
          content: "# Currículo e Entrevistas\n\n## Currículo\n- Mantenha em uma página\n- Foque em resultados, não apenas tarefas\n- Inclua links para GitHub e LinkedIn\n- Liste tecnologias que realmente sabe usar\n- Inclua projetos pessoais com links\n\n## Entrevista Técnica\n- Explique seu raciocínio em voz alta\n- Não tenha medo de dizer \"não sei\"\n- Pergunte como o entrevistador resolveria\n- Teste sua solução com exemplos simples\n\n## Perguntas Comuns\n- \"Conte-me sobre você\"\n- \"Por que quer trabalhar aqui?\"\n- \"Conte sobre um desafio que enfrentou\"\n- \"Onde você se da em 5 anos?\"\n- \"Quais são seus pontos fortes e fracos?\"\n\n## Dicas\n- Seja honesto sobre seu nível\n- Mostre disposição para aprender\n- Demonstre paixão por programação\n- Tenha projetos para mostrar", order: 0 },
      ],
    },
    {
      title: "34. Inglês técnico: ler documentação e mensagens de erro",
      status: "NOT_STARTED",
      order: 33,
      estimatedMinutes: 60,
      contents: [
        {
          title: "Inglês Técnico",
          type: "NOTE",
          content: "# Inglês Técnico\n\n## Termos Comuns\n- Bug: erro no código\n- Feature: funcionalidade\n- Bug report: relatório de erro\n- Pull request: solicitação de mesclagem\n- Code review: revisão de código\n- Deployment: deploy\n- Legacy code: código legado\n- Refactoring: refatoração\n\n## Ler Documentação\n- Comece pela seção \"Getting Started\"\n- Use exemplos de código como base\n- Leia os exemplos antes da teoria teórica\n- Use tradutor apenas quando necessário\n\n## Ler Mensagens de Erro\n```\nError: Cannot find module './modulo'\n  at require (internal/modules/cjs/helpers.js)\n```\n\n1. Leia a última linha primeiro (geralmente é o erro real)\n2. Identifique o tipo de erro (SyntaxError, ReferenceError, etc.)\n3. Leia o caminho do arquivo e número da linha\n4. Procure a mensagem no Google/Stack Overflow\n\n## Recursos para Aprender Inglês Técnico\n- Documentação oficial em inglês\n- Stack Overflow em inglês\n- Tutoriais em inglês no YouTube\n- Documentação de bibliotecas populares", order: 0 },
      ],
    },
    // Módulo 12 continua - item 42
    {
      title: "35. Projeto Final Completo e Publicação",
      status: "NOT_STARTED",
      order: 34,
      estimatedMinutes: 300,
      contents: [
        {
          title: "Projeto Final Completo",
          type: "NOTE",
          content: "# Projeto Final Completo\n\n## Checklist Final\n- [ ] Autenticação funcionando\n- [ ] CRUD completo implementado\n- [ ] Banco de dados conectado\n- [ ] Testes passando\n- [ ] Deploy em produção\n- [ ] README completo\n- [ ] Código limpo e documentado\n- [ ] Link no LinkedIn\n\n## Próximos Passos Após o Roadmap\n1. Escolha uma especialização (front, back ou full stack)\n2. Construa 2-3 projetos reais\n3. Contribua em projetos open source\n4. Comece a se candidatar a vagas\n5. Mantenha aprendendo constantemente\n\n## Recursos para Continuar Aprendendo\n- Documentação oficial das tecnologias\n- Cursos online gratuitos (freeCodeCamp, The Odin Project)\n- Comunidades no Discord/Slack\n- Conferências e meetups locais\n- Blogs de desenvolvedores\n\n## Lembrete Importante\nA aprendizagem é contínua. Não tente aprender tudo de uma vez. Foque em um coisa por vez e construa projetos reais para consolidar o conhecimento.\n\n**Boa jornada no desenvolvimento Full Stack! 🚀**", order: 0 },
      ],
    }
  ];

  const roadmap = await prisma.roadmap.create({
    data: {
      userId,
      title: 'Roadmap Full Stack Júnior',
      description:
        '12 módulos, 42 aulas: da base da web ao deploy, testes e carreira. Do zero ao primeiro emprego como desenvolvedor Full Stack.',
      goal: 'Conquistar a primeira vaga como desenvolvedor Full Stack.',
      level: 'beginner',
      color: '#0ea5e9',
      order: 0,
      items: {
        create: ROADMAP_ITEMS,
      },
    },
    include: { items: true },
  });

  console.log(`✅ ${ROADMAP_ITEMS.length} itens de roadmap criados`);

  // Criar biblioteca relacionada ao roadmap
  const bibliotecaItens = [
    {
      userId,
      itemType: 'book',
      itemId: 'book-js-definitive',
      title: 'JavaScript: O Guia Definitivo',
      author: 'David Flanagan',
      status: 'to_read',
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
      notes: 'Referência completa de JavaScript moderno',
      lastAccessedAt: null,
    },
    {
      userId,
      itemType: 'book',
      itemId: 'book-typescript-essentials',
      title: 'TypeScript Essentials',
      author: 'Adam Freeman',
      status: 'to_read',
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
      notes: 'Aprender tipagem estática com TypeScript',
      lastAccessedAt: null,
    },
    {
      userId,
      itemType: 'book',
      itemId: 'book-learning-react',
      title: 'Aprendendo React',
      author: 'Alex Banks e Eve Porcello',
      status: 'to_read',
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
      notes: 'Hooks, Context API e padrões modernos',
      lastAccessedAt: null,
    },
    {
      userId,
      itemType: 'book',
      itemId: 'book-tailwind-css',
      title: 'Tailwind CSS: Construindo Interfaces Modernas',
      author: 'Vários',
      status: 'to_read',
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
      notes: 'Utilitários CSS e responsividade com Tailwind',
      lastAccessedAt: null,
    },
    {
      userId,
      itemType: 'book',
      itemId: 'book-node-design-patterns',
      title: 'Node.js Design Patterns',
      author: 'Mario Casciaro e Luciano Mammino',
      status: 'to_read',
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
      notes: 'Padrões de projeto para aplicações Node.js',
      lastAccessedAt: null,
    },
    {
      userId,
      itemType: 'book',
      itemId: 'book-ddia',
      title: 'Designing Data-Intensive Applications',
      author: 'Martin Kleppmann',
      status: 'to_read',
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
      notes: 'Banco de dados, modelagem e sistemas distribuídos',
      lastAccessedAt: null,
    },
    {
      userId,
      itemType: 'book',
      itemId: 'book-pro-git',
      title: 'Pro Git',
      author: 'Scott Chacon e Ben Straub',
      status: 'completed',
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
      notes: 'Controle de versão com Git - leitura completa',
      lastAccessedAt: new Date(),
    },
    {
      userId,
      itemType: 'book',
      itemId: 'book-docker-deep-dive',
      title: 'Docker Deep Dive',
      author: 'Nigel Poulton',
      status: 'to_read',
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
      notes: 'Contêineres e Docker para desenvolvimento',
      lastAccessedAt: null,
    },
    {
      userId,
      itemType: 'pdf',
      itemId: 'pdf-clean-code-summary',
      title: 'Clean Code — Resumo de Princípios',
      author: 'Robert C. Martin',
      status: 'reading',
      progress: 60,
      coverUrl: null,
      fileUrl: null,
      fileKey: null,
      mimeType: 'application/pdf',
      fileSize: null,
      totalPages: 50,
      currentPage: 30,
      durationSec: null,
      rating: null,
      notes: 'Limpeza de código e boas práticas de programação',
      lastAccessedAt: new Date(),
    },
    {
      userId,
      itemType: 'audiobook',
      itemId: 'audiobook-pragmatic-programmer',
      title: 'The Pragmatic Programmer',
      author: 'Andrew Hunt e David Thomas',
      status: 'to_read',
      progress: 0,
      coverUrl: null,
      fileUrl: null,
      fileKey: null,
      mimeType: 'audio/mpeg',
      fileSize: null,
      totalPages: null,
      currentPage: null,
      durationSec: 39600,
      positionSec: 0,
      rating: null,
      notes: 'Jornada de um mestre à excelência em programação',
      lastAccessedAt: null,
    },
  ];

  await prisma.libraryItem.createMany({
    data: bibliotecaItens,
  });

  console.log(`✅ ${bibliotecaItens.length} itens de biblioteca criados`);