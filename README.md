# TechLab

Portal de tecnologia, inteligência artificial e programação — com artigos, tutoriais
e uma coleção de ferramentas online gratuitas que rodam inteiramente no navegador.

## Stack

| Item | Escolha |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| Linguagem | TypeScript (strict) |
| Estilo | Tailwind CSS v4 |
| Conteúdo | MDX com frontmatter YAML |
| Deploy | Qualquer host Node — Vercel é o caminho mais simples |

## Comandos

```bash
npm run dev     # servidor de desenvolvimento
npm run build   # build de produção (gera o sitemap e as OG images)
npm start       # serve o build de produção
npm run lint    # ESLint
npx tsc --noEmit  # checagem de tipos
```

## Por que `cacheComponents` está desligado

O `create-next-app` do Next 16 liga `cacheComponents: true` por padrão. Esse modo
**quebra** tudo que este site usa: ele lança erro em `dynamicParams`, em
`new Date()` durante o prerender e em `generateStaticParams` vazio. Um site de
conteúdo + ferramentas precisa do contrário — páginas 100% estáticas. Por isso
`cacheComponents` e `partialPrefetching` foram removidos de `next.config.ts`.

Sem eles, páginas que não usam APIs de request (`cookies`, `headers`,
`searchParams`, `draftMode`) são prerenderizadas automaticamente, que é
exatamente o comportamento desejado.

## Estrutura

```
src/
├── app/                        # Rotas
│   ├── page.tsx                # Homepage
│   ├── artigos/                # Lista + [slug] (+ opengraph-image por artigo)
│   ├── categorias/[slug]/      # Categorias editoriais (ia, programacao, software)
│   ├── ferramentas/            # Índice, uma rota por ferramenta, categoria/[slug]
│   ├── api/                    # newsletter, contato
│   ├── sitemap.ts robots.ts icon.tsx opengraph-image.tsx
├── components/
│   ├── home/                   # Blocos da homepage
│   ├── tools/                  # UI compartilhada + shell de SEO das ferramentas
│   ├── articles/               # Lista com busca no cliente
│   ├── ui/                     # Card, Button, Badge, ToolCard, ícones sociais
│   └── *.tsx                   # Header, Footer, formulários
├── content/posts/*.mdx         # Artigos
├── tools/*.tsx                 # Implementação de cada ferramenta (client)
├── lib/
│   ├── tools.ts                # Registro de ferramentas + conteúdo de SEO
│   ├── posts.ts                # Carregamento dos MDX
│   ├── site.ts                 # Config do site, navegação, categorias
│   └── utils.ts news.ts
└── mdx-components.tsx          # Estilo global do conteúdo
```

## Adicionando uma ferramenta

1. Crie `src/tools/<slug>.tsx` exportando um componente client com `export default`.
2. Registre em `src/lib/tools.ts`: `slug`, `name`, `tagline`, `description`
   (140–160 caracteres), `category`, `icon`, `keywords`, `steps` e `faq`.
3. Crie a rota `src/app/ferramentas/<slug>/page.tsx`:

   ```tsx
   import type { Metadata } from "next";
   import { ToolPageShell } from "@/components/tools/tool-page-shell";
   import { buildToolMetadata } from "@/lib/tools-metadata";
   import MinhaFerramenta from "@/tools/meu-slug";

   export function generateMetadata(): Metadata {
     return buildToolMetadata("meu-slug");
   }

   export default function Page() {
     return (
       <ToolPageShell slug="meu-slug">
         <MinhaFerramenta />
       </ToolPageShell>
     );
   }
   ```

O sitemap, a busca, os filtros e a navegação atualizam sozinhos.

> **Por que uma rota por ferramenta, e não um `[slug]` dinâmico com `import()`?**
> Com `next/dynamic` e `React.lazy` o Suspense nunca resolvia neste projeto
> (Next 16.4 + Turbopack): o chunk não era sequer solicitado e a página ficava
> presa no fallback. Importação estática por rota dá o mesmo resultado de bundle
> — um chunk por ferramenta — sem depender do import dinâmico. O shell
> compartilhado em `tool-page-shell.tsx` mantém o SEO em um lugar só.

## Adicionando um artigo

Crie `src/content/posts/<slug>.mdx`:

```mdx
---
title: "Título"
description: "Meta description de 140–160 caracteres."
date: "2026-10-08"
category: "programacao"   # ia | programacao | software
tags: ["React", "Guia"]
featured: false
views: 0
---

Primeiro parágrafo. Não repita o título como `# H1` — a página já faz isso.

## Uma seção
```

O frontmatter vira o export `frontmatter` do módulo MDX via `remark-mdx-frontmatter`
(configurado em `next.config.ts`). `readingTime` é calculado automaticamente.

## SEO

- Metadata por rota via `generateMetadata`, com canonical e OG/Twitter completos.
  Atenção: `openGraph` e `twitter` fazem merge **raso** com o layout raiz — se a
  rota filha define qualquer chave, as do pai são descartadas. Por isso os campos
  são repetidos em cada página.
- JSON-LD: `WebSite` + `Organization` (layout), `SoftwareApplication` +
  `FAQPage` (ferramentas), `BlogPosting` + `BreadcrumbList` (artigos),
  `CollectionPage` (listagens).
- `sitemap.xml` gerado do mesmo registry que renderiza as páginas.
- OG images geradas em build com `ImageResponse` (site e por artigo).
- O FAQ usa `<details>`/`<summary>`, então o texto fica no DOM sem JavaScript.

## O que ainda não está conectado

Estes pontos aceitam input e respondem, mas não persistem nada — precisam ser
ligados a um serviço real antes de ír para produção:

- `src/app/api/newsletter/route.ts` → encaminhar para um ESP (Resend, Buttondown).
- `src/app/api/contato/route.ts` → encaminhar para um serviço de e-mail
  transacional. O rate limit é em memória e não sobrevive a cold start.
- `src/components/auth-form.tsx` → sem back-end de autenticação; `/entrar` e
  `/cadastrar` são shells.

Antes do deploy, defina `NEXT_PUBLIC_SITE_URL` — é a origem canônica usada no
sitemap, robots e nos metadados. Sem isso o padrão `https://techlab.com.br` é
usado.
