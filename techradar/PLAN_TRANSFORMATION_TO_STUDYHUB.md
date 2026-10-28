# TechRadar → StudyHub — Plano de Transformação

> Gerado em: 28/10/2026 · Contexto: deploy em produção concluído; pivô de produto proposto pelo usuário.

## Nova visão

> **StudyHub** — hub de estudos feito com a própria stack que está sendo ensinada:
> React, TypeScript, Node/Express, PostgreSQL, autenticação, storage de arquivos e IA.

## Módulos (em ordem sugerida)

### Módulo 1 — Revisão com IA e progressão (Flashcards)
- [ ] Flashcards com repetição espaçada (SM-2 / FSRS).
- [ ] IA gera cards/quizzes a partir de notas.
- [ ] Adaptação de frequência por dificuldade.
- [ ] Modo "explique com suas palavras" (IA avalia).
- [ ] Painel de progresso (dominados × em dificuldade, sequência de dias, horas).

### Módulo 2 — Treino de código
- [ ] Editor no navegador (Monaco) com exercícios + testes automáticos.
- [ ] Modo "digitar do zero" (enunciado → solução oculta → compare).
- [ ] Revisão de código por IA (feedback de melhoria).
- [ ] Diário de erros (problema → solução → alimenta flashcards).

### Módulo 3 — Notas
- [ ] Markdown com tags/links (estilo Obsidian).
- [ ] Notas → flashcards → mapa mental.

### Módulo 4 — Mapas mentais
- [ ] Canvas arrastável (React Flow).
- [ ] IA gera rascunho a partir de nota; nó → nota/card.

### Módulo 5 — Biblioteca
- [ ] Upload PDF/EPUB (Cloudflare R2 ou Supabase Storage).
- [ ] Leitor (pdf.js / epub.js), progresso, highlights → notas → flashcards.

### Módulo 6 — Audiobook
- [ ] TTS (síntese do navegador ou API com custo).

### Melhorias transversais
- Modo entrevista com IA (perguntas de vaga júnior).
- Plano semanal automático + pomodoro/tempo.
- Mapa de habilidades (ex.: Express 70%).
- Exportar tudo em Markdown.
- PWA/offline.

## Impacto no codebase atual (TechRadar)

| Área | Reutilizável | A substituir/adicionar |
|---|---|---|
| Front (`src/components`, Tailwind/shadcn) | ✅ UI base, cards, busca | novos componentes (editor, canvas, reader) |
| Auth/Prisma (`User`, `Favorite`) | ✅ JWT + bcrypt + User/Favorite | estender com `Flashcard`, `StudyNote`, `Progress`, `CodeExercise`, `Highlight` |
| Skills (`src/lib/skills`) | ✅ dictionary/extract/score | progressão por skill |
| Busca (`fulltext.ts`) | ✅ full-text infra | adaptar para notas/cards |
| Deploy/Infra | ✅ Vercel + Neon configurados | storage de arquivos (R2/Supabase) |
| Cron/sync | ✅ cron pattern | alertas/notificações de estudo |

## Stack sugerida (já validada pelo usuário)

- Front: React + TS + Tailwind + shadcn.
- API: Node + Express + Zod — ⚠️ o TechRadar atual usa Route Handlers do Next; para StudyHub valer a pena extrair API (ou usar Route Handlers). *Decisão pendente.*
- Banco: PostgreSQL + Prisma/Drizzle.
- Auth: JWT + bcrypt (hoje usa NextAuth credentials — manter ou migrar).
- Files: Cloudflare R2 ou Supabase Storage.
- IA: Anthropic API (cards, quizzes, feedback, explicação).
- Editor/mapa: Monaco / React Flow.
- Reader: pdf.js / epub.js.

## Fases da transformação (recomendadas)

1. **F1**: Módulo 1 (flashcards IA + progressão) — reutiliza auth/skills; menor atrito.
2. **F2**: Módulo 2 (treino de código) + diário de erros.
3. **F3**: Módulo 3/4 (notas + mapas mentais).
4. **F4**: Módulo 5 (biblioteca/leitor) + Módulo 6 (audiobook/TTS).
5. **F5**: Modos transversais (entrevista, plano semanal, pomodoro, mapa de habilidades, export, PWA).

## Critérios de sucesso da transformação

- [ ] O "StudyHub" roda no mesmo deploy/Vercel com o banco atual.
- [ ] Módulo 1 funcional end-to-end (IA + flashcards + progresso).
- [ ] Stack nova (Express etc.) documentada no README.

---

*Este plano descreve a transformação do TechRadar em StudyHub conforme especificação do usuário.*
