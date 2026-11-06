# DevPath Hub — Seu hub de estudos e tecnologia

Centralize sua busca por vagas, cursos, livros e audiobooks de tecnologia em um só lugar. Receba recomendações cruzadas baseadas nas skills que você precisa.

## Funcionalidades

- **Dashboard real**: métricas, sequência, metas, revisões, gráfico de 30 dias, progresso por tecnologia, tarefas, projetos e calendário — tudo calculado a partir do banco
- **Busca unificada**: Vagas, Cursos, Livros e Audiobooks em um único hub
- **Cruzamento inteligente**: Ao ver uma vaga, receba recomendações de cursos/livros/audiobooks que cobrem as skills exigidas
- **Filtros avançados**: Remoto/presencial, nível, gratuito/pago, idioma, faixa salarial, fonte e skill
- **Favoritos**: Salve itens para acessar rapidamente (requer login)
- **Compartilhamento**: Buscas persistentes via URL (query params)
- **Histórico**: Acompanhe suas buscas e receba recomendações personalizadas
- **Admin**: Gerencie fontes de vagas e edite cursos, livros e audiobooks na página `/admin`

## Admin (Etapa 4)

A página `/admin` é restrita a usuários com `role = ADMIN` (verificada no banco no
server component e em todas as rotas de API). Ela permite:

- **Trilhas**: CRUD completo de qualquer trilha, com seleção do usuário dono na criação.
- **Itens**: CRUD por trilha, incluindo status, tempo estimado, descrição e link oficial.
- **Conteúdos teóricos**: CRUD inline por item (notas, links, vídeos, artigos e PDFs).
- **Biblioteca**: upload e CRUD de PDFs/audiobooks de qualquer usuário, com edição de
  metadados, progresso de leitura/escuta e exclusão do registro + arquivo físico.
- **Uploads seguros**: o tipo real é detectado por *magic number* (não pela extensão),
  com limites de 100 MB para PDF e 300 MB para áudio. Os arquivos ficam em `uploads/lib`
  (fora de `public/`) e só são servidos por rota autenticada ao dono ou a um admin.
- **CSRF**: todas as mutações administrativas exigem o header `X-CSRF-Token`, lido do
  cookie `csrf_token` pelo helper `src/lib/api-client.ts`.
- **Range requests**: `/api/library-files/[key]` suporta `Range` (206) para permitir
  seek em audiobooks, além de `nosniff`, `Cross-Origin-Resource-Policy` e cache privado.

Rotas principais:
- `GET/POST /api/admin/roadmaps`
- `GET/PATCH/DELETE /api/admin/roadmaps/[id]`
- `POST /api/admin/roadmaps/[id]/items`
- `GET/PATCH/DELETE /api/admin/roadmap-items/[id]`
- `POST /api/admin/roadmap-items/[id]/contents`
- `PATCH/DELETE /api/admin/study-contents/[id]`
- `GET /api/admin/library`, `PATCH/DELETE /api/admin/library/[id]`
- `POST /api/admin/library/upload`
- `GET /api/library-files/[key]`

## Roadmap (Etapa 3)

A rota `/roadmap` é totalmente orientada pelos dados do usuário:

- **Trilhas**: CRUD completo (criar, editar e excluir) com nível, objetivo, cor e ordem.
- **Itens de estudo**: CRUD, quatro status (`Não iniciado`, `Em andamento`, `Concluído`,
  `Precisa revisar`), tempo estimado e link oficial (somente `http/https`).
- **Conteúdo teórico**: CRUD inline por item — notas, links, vídeos, artigos e PDFs.
  O texto é renderizado como texto puro (sem HTML), evitando XSS.
- **Progresso**: barra por trilha e resumo geral calculados a partir dos status reais.
- **Página `/conteudo`**: visão consolidada de todo o conteúdo teórico e links oficiais,
  agrupada por trilha.

As rotas usadas estão em `/api/roadmaps`, `/api/roadmap-items` e `/api/study-contents`,
sempre com validação Zod e escopo por `userId`.

## Dashboard (Etapa 2)

A rota `/` agora usa o shell dark do DevPath Hub (sidebar colapsável, topbar com busca
global, notificações e perfil) e monta todos os cartões com dados reais do Prisma:

- **Horas hoje / Sequência / Metas / Revisões pendentes**: sessões de estudo, metas de
  `UserSettings` e flashcards vencidos.
- **Evolução dos estudos**: série contínua dos últimos 30 dias (inclui dias sem estudo).
- **Progresso por tecnologia**: derivado dos títulos e status dos itens do roadmap.
- **Recomendação do dia**: prioriza a revisão mais atrasada e, na ausência dela, o
  próximo item do roadmap.
- **Tarefas, projetos, calendário e última atividade**: registros reais do usuário.

Os cálculos puros ficam em `src/lib/dashboard/helpers.ts` (com testes) e as consultas em
`src/lib/dashboard.ts`. O tema usa as variáveis de `src/app/globals.css` e o `class="dark"`
no `<html>`.

## Backend de estudos (Etapa 1)

O domínio de estudos foi modelado no Prisma, com isolamento por `userId` em **todas** as entidades:

`User`, `UserSettings`, `Roadmap`, `RoadmapItem`, `StudyContent`, `LibraryItem`, `LearningPath`, `Subject`, `Topic`, `Note`, `StudySession`, `Project`, `JobApplication`.

### Segurança das rotas

- Toda rota de API usa `requireUser()` (`src/lib/api/auth.ts`), que valida o JWT do cookie
  `session` e recarrega o usuário no banco (a role nunca vem do token).
- Toda mutação valida o payload com **Zod** (`src/lib/validations/*`).
- `src/lib/api/response.ts` centraliza erros: 400 (JSON inválido), 401, 403, 404,
  409 (duplicado), 422 (validação) e 500 (sem vazar detalhes internos).
- Updates e deletes usam `where: { id, userId }` (`updateMany`/`deleteMany`),
  impedindo que um usuário altere registros de outro (IDOR).

> **Nota de arquitetura:** o projeto usa o modelo full-stack do **Next.js App Router**
> (Route Handlers + Server Actions) no lugar de um servidor Express separado. A
> separação de responsabilidades é mantida em `src/lib/api`, `src/lib/validations`
> e `src/app/api/**`.

### Rotas principais

| Rota | Métodos |
|---|---|
| `/api/roadmaps` | `GET`, `POST` |
| `/api/roadmaps/[id]` | `GET`, `PATCH`, `DELETE` |
| `/api/roadmaps/[id]/items` | `POST` |
| `/api/roadmap-items/[id]` | `GET`, `PATCH`, `DELETE` |
| `/api/roadmap-items/[id]/contents` | `POST` |
| `/api/study-contents/[id]` | `PATCH`, `DELETE` |
| `/api/learning-paths` | `GET`, `POST` |
| `/api/learning-paths/[id]` | `GET`, `PATCH`, `DELETE` |
| `/api/learning-paths/[id]/subjects` | `POST` |
| `/api/subjects/[id]` | `PATCH`, `DELETE` |
| `/api/subjects/[id]/topics` | `POST` |
| `/api/topics/[id]` | `PATCH`, `DELETE` |
| `/api/study-sessions` | `GET`, `POST` |
| `/api/study-sessions/[id]` | `PATCH`, `DELETE` |
| `/api/projects` | `GET`, `POST` |
| `/api/projects/[id]` | `GET`, `PATCH`, `DELETE` |
| `/api/job-applications` | `GET`, `POST` |
| `/api/job-applications/[id]` | `GET`, `PATCH`, `DELETE` |
| `/api/settings` | `GET`, `PATCH` |
| `/api/profile` | `PATCH` |
| `/api/library` | `GET`, `POST` |
| `/api/library/[id]` | `GET`, `PUT`, `PATCH`, `DELETE` |

### Usuários de demonstração (seed)

| E-mail | Senha | Role |
|---|---|---|
| `admin@devpath.com` | `DevPath@2026!Admin` | `ADMIN` |
| `pablo@devpath.com` | `DevPath@2026!User` | `USER` |

O seed é idempotente para a conta demo: recria apenas os dados de domínio do
usuário `pablo@devpath.com` (trilha, projetos, candidaturas, sessões, revisões).
Conteúdo externo (vagas/livros/audiobooks) é opcional via `npm run db:seed:content`.

## Stack Técnica

- **Frontend/Backend**: Next.js 16 (App Router) + TypeScript
- **Estilização**: Tailwind CSS 4 + shadcn/ui
- **Banco de dados**: PostgreSQL + Prisma ORM
- **Autenticação**: JWT em cookie `httpOnly` + bcrypt (implementação própria em `src/lib/auth.ts`)
- **Testes**: Vitest

## Pré-requisitos

- Node.js 18+
- PostgreSQL (local ou Neon/Supabase)

## Instalação

```bash
# Entre na pasta do projeto
cd techradar

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais

# Gere o cliente Prisma
npm run db:generate

# Crie as tabelas no banco
npm run db:push

# Popule o banco com dados de demonstração
npm run db:seed

# Inicie o servidor de desenvolvimento
npm run dev
```

Acesse http://localhost:3000

## Variáveis de Ambiente

| Variável | Descrição | Obrigatória |
|---|---|---|
| `DATABASE_URL` | String de conexão do PostgreSQL | Sim |
| `AUTH_SECRET` | Secret do NextAuth (gere com `openssl rand -base64 32`) | Sim |
| `AUTH_URL` | URL base do app (ex: `http://localhost:3000`) | Sim |
| `AUTH_GITHUB_ID` | Client ID do GitHub OAuth | Sim |
| `AUTH_GITHUB_SECRET` | Client Secret do GitHub OAuth | Sim |
| `CRON_SECRET` | Segredo para o endpoint `/api/cron/sync-jobs` | Sim |
| `GOOGLE_BOOKS_API_KEY` | API Key do Google Books (opcional) | Não |

## Scripts Disponíveis

| Script | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera build de produção |
| `npm run start` | Inicia o servidor de produção |
| `npm run lint` | Executa o ESLint |
| `npm run db:generate` | Gera o cliente Prisma |
| `npm run db:push` | Cria/atualiza tabelas no banco |
| `npm run db:migrate` | Cria migrações do Prisma |
| `npm run db:seed` | Popula usuários demo e dados do dashboard |
| `npm run db:seed:content` | Popula também vagas/livros/audiobooks externos |
| `npm run db:studio` | Abre o Prisma Studio |
| `npm test` | Executa os testes |

## Estrutura do Projeto

```
techradar/
├── prisma/
│   ├── schema.prisma          # Modelo de dados
│   └── seed.ts                # Script de seed
├── src/
│   ├── app/                   # Rotas (App Router)
│   │   ├── page.tsx           # Home
│   │   ├── busca/             # Resultados
│   │   ├── vaga/[id]/         # Detalhe da vaga
│   │   ├── curso/[id]/        # Detalhe do curso
│   │   ├── livro/[id]/        # Detalhe do livro
│   │   ├── audiobook/[id]/    # Detalhe do audiobook
│   │   ├── favoritos/         # Lista de favoritos
│   │   ├── perfil/            # Perfil do usuário
│   │   ├── entrar/            # Login
│   │   └── api/               # Route Handlers
│   ├── components/            # Componentes React
│   │   ├── ui/                # Componentes base (shadcn-style)
│   │   ├── layout/            # Header, Footer
│   │   ├── search/            # Busca, filtros, tabs
│   │   ├── cards/             # Cards de conteúdo
│   │   └── recommendations/   # Painéis de recomendação
│   ├── lib/                   # Lógica e utilitários
│   │   ├── prisma.ts          # Cliente Prisma
│   │   ├── auth.ts            # Config NextAuth
│   │   ├── skills/            # Dicionário, normalização, score
│   │   ├── search/            # Full-text search
│   │   └── sources/           # Integrações com APIs
│   └── types/                 # Tipos TypeScript
└── ...
```

## APIs Utilizadas

| Fonte | API | Dados |
|---|---|---|
| Remotive | `https://remotive.com/api/remote-jobs` | Vagas remotas |
| Arbeitnow | `https://www.arbeitnow.com/api/job-board-api` | Vagas remotas |
| Open Library | `https://openlibrary.org/search.json` | Livros |
| LibriVox | `https://librivox.org/api/feed/audiobooks/` | Audiobooks |

## Deploy

### 1. Banco de Dados (Neon)

1. Acesse https://console.neon.tech
2. Crie um novo projeto
3. Copie a connection string (formato: `postgresql://user:pass@host/db`)
4. Use como valor de `DATABASE_URL`

### 2. GitHub OAuth

1. Acesse https://github.com/settings/developers
2. Crie um novo OAuth App
3. Configure:
   - **Application name**: DevPath Hub
   - **Homepage URL**: `http://localhost:3000` (dev) ou URL de produção
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Copie o **Client ID** e **Client Secret**

### 3. Vercel (App)

1. Conecte o repositório à Vercel
2. Configure as variáveis de ambiente:
   ```
   DATABASE_URL=postgresql://...
   AUTH_SECRET=gere com: openssl rand -base64 32
   AUTH_URL=https://sua-url.vercel.app
   AUTH_GITHUB_ID=seu-client-id
   AUTH_GITHUB_SECRET=seu-client-secret
   CRON_SECRET=<seu-segredo>
   ```
3. Deploy automático a cada push na main

### 4. Seed em Produção

```bash
# Localmente, apontando para o banco de produção
DATABASE_URL="postgresql://..." npm run db:push
DATABASE_URL="postgresql://..." npm run db:seed
```

### 5. Cron Job (Sincronização de Vagas)

Configure um cron job na Vercel (ou externo) para chamar periodicamente:

```
POST https://sua-url.vercel.app/api/sync/jobs
```

Recomendado: a cada 6 horas (0 */6 * * *)

## Evolução (Fase 2)

- [ ] Alertas por email para novas vagas
- [ ] Scraping de mais fontes (Trampos.co, Coodesh)
- [ ] App mobile (React Native / Expo)
- [ ] Cache com Redis (Upstash)
- [ ] Rate limiting
- [ ] Recomendações com ML (embeddings)
- [ ] Dashboard de analytics

## Licença

MIT
#   f i x :   f o r � a   r e b u i l d   d o   r o a d m a p - c o l u m n s . t s x  
 #   f i x :   f o r � a   r e b u i l d   c o m p l e t o   d o   r o a d m a p - c o l u m n s . t s x  
 