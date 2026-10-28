# TechRadar — Hub de Buscas de Tecnologia

Centralize sua busca por vagas, cursos, livros e audiobooks de tecnologia em um só lugar. Receba recomendações cruzadas baseadas nas skills que você precisa.

## Funcionalidades

- **Busca unificada**: Vagas, Cursos, Livros e Audiobooks em um único hub
- **Cruzamento inteligente**: Ao ver uma vaga, receba recomendações de cursos/livros/audiobooks que cobrem as skills exigidas
- **Filtros avançados**: Remoto/presencial, nível, gratuito/pago, idioma, faixa salarial, fonte e skill
- **Favoritos**: Salve itens para acessar rapidamente (requer login)
- **Compartilhamento**: Buscas persistentes via URL (query params)
- **Histórico**: Acompanhe suas buscas e receba recomendações personalizadas
- **Admin**: Gerencie fontes de vagas e edite cursos, livros e audiobooks na página `/admin`

## Admin

A página `/admin` (protegida por autenticação) permite:

- **Fontes de Vagas**: Adicionar sites (ex: Trampos.co, Coadesh) que passam a ser buscáveis no TechRadar via filtro de fonte. Inclui fontes padrão (Remotive, Arbeitnow).
- **Cursos**: Editar cursos (título, provider, URL, preço, nível, duração, gratuito/pago, skills).
- **Livros**: Editar livros (título, autores, URL, editora, páginas, gratuito/pago, skills).
- **Audiobooks**: Editar audiobooks (título, autores, narrador, URL, duração, gratuito/pago, skills).

As rotas de admin utilizam:
- `GET /api/admin/sources` — lista fontes
- `POST /api/admin/sources` — cria fonte
- `PATCH /api/admin/sources/[id]` — atualiza fonte
- `DELETE /api/admin/sources/[id]` — remove fonte
- `GET /api/admin/courses` — lista cursos
- `PUT /api/admin/courses/[id]` — atualiza curso
- `GET /api/admin/books` — lista livros
- `PUT /api/admin/books/[id]` — atualiza livro
- `GET /api/admin/audiobooks` — lista audiobooks
- `PUT /api/admin/audiobooks/[id]` — atualiza audiobook

## Stack Técnica

- **Frontend/Backend**: Next.js 16 (App Router) + TypeScript
- **Estilização**: Tailwind CSS 4 + shadcn/ui
- **Banco de dados**: PostgreSQL + Prisma ORM
- **Autenticação**: NextAuth v5 (Auth.js) com GitHub
- **Testes**: Vitest

## Pré-requisitos

- Node.js 18+
- PostgreSQL (local ou Neon/Supabase)
- Conta GitHub (para OAuth)

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
| `npm run db:seed` | Popula o banco com dados de demonstração |
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
   - **Application name**: TechRadar
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
