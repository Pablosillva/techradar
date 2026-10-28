# TechRadar — Plano da Próxima Fase

> Gerado em: 28/10/2026 · Contexto: deploy em produção concluído (`https://techradar-neon.vercel.app`)

## Objetivo

Implementar **alertas por e-mail para novas vagas** — fase 3 do roadmap — para notificar usuários
(quem salvou favoritos em determinadas skills) quando vagas novas matching entrarem no banco.

## Pré-requisitos

- [ ] Escolher provedor de e-mail: **Resend** (recomendado) ou SendGrid/SMTP.
- [ ] Criar conta/projeto no provedor e obter API key.
- [ ] Variável de ambiente no Vercel: `RESEND_API_KEY` (e opcionalmente `EMAIL_FROM`).

## Escopo (MVP do alerta)

- [ ] Modelo Prisma: `JobAlert` (userId, jobId, sentAt, unique jobId+userId) ou uso de
      `Favorite` + flag de notificação. → *Decidir: criar `Notification` model.*
- [ ] Serviço `src/lib/alerts.ts`: receber jobs novos do sync, cruzar com favoritos
      (skills overlap) e montar lista de alertas para envio.
- [ ] Integração no cron `/api/cron/sync-jobs`: após upsert, detectar jobs novos
      (ex.: `createdAt > última execução` ou diff via `JobAlert`) e disparar e-mails.
- [ ] Provider de e-mail `src/lib/email.ts`: `sendNewJobsEmail(to, jobs)` via Resend API (fetch).
- [ ] UI: preferências de alerta (ativar/desativar por skill/tipo) em `/perfil` ou rota nova `/notificacoes`.
- [ ] Testes unitários para o serviço de alertas.

## Fora de escopo (fase atual)

- Push notifications (Fase 3 restante).
- Resumo semanal (Fase 3).
- Webhooks Slack/Discord (Fase 3).

## Critérios de aceitação

- [ ] Usuário com favorito em skill X recebe e-mail quando job nova com X for sincronizada.
- [ ] Usuário sem preferências/alertas ativos não recebe.
- [ ] Falha no envio não quebra o cron/sync (try/catch + log).
- [ ] `/api/cron/sync-jobs` continua protegido por `CRON_SECRET`.

## Tarefas técnicas sugeridas

1. `prisma/schema.prisma`: adicionar model `JobAlert` (ou `NotificationPreference`).
2. `prisma/migrations` ou `db:push` + `db:seed` se necessário.
3. `src/lib/email.ts` (novo).
4. `src/lib/alerts.ts` (novo) + integração em `src/app/api/cron/sync-jobs/route.ts`.
5. `src/app/api/user/alerts` (ou em `/api/favorites`) para gerenciar preferências.
6. UI em `src/app/perfil` ou nova rota `/notificacoes`.
7. Env: `RESEND_API_KEY` no Vercel.
8. Testes em `src/lib/__tests__/`.

## Riscos / Dependências

- Provedor de e-mail pode exigir verificação de domínio.
- Rate limits do provedor (Resend free: 3/s).
- Horário do cron (03:00 UTC) pode atrasar notificações.

---

## Fases seguintes (posição no roadmap)

| Fase | Item | Prioridade |
|---|---|---|
| 3 | Alertas por e-mail (este plano) | 🔴 Alta |
| 3 | Notificações push / resumo semanal / webhook | 🟡 Média |
| 4 | Novas fontes (Trampos, Coodesh, LinkedIn, etc.) | 🔴 Alta |
| 4 | API Coursera/Udemy/Spotify | 🟡 Média |
| 5 | App mobile (Expo) | 🟢 Baixa |
| 6 | ML embeddings | 🔵 Futura |
| 7/8 | Social / Monetização | 🔵 Futura |

---

*Este plano é gerado a partir do estado atual do repositório e do deploy em produção.*
