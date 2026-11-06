# Relatório de Segurança — DevPath Hub (Etapa 6)

**Escopo:** Auditoria OWASP Top 10 (2021) da aplicação Next.js 16 App Router.
**Status:** Correções aplicadas e validadas (`tsc`, `vitest` 81/81, `build`).
**Data:** 06/11/2026

---

## 1. Metodologia

Foram revisadas:
- Todas as rotas de API (`src/app/api/**/route.ts`) — autenticação, autorização, CSRF, rate limiting.
- Middleware de cabeçalhos de segurança (`src/middleware.ts`, `src/lib/security/headers.ts`).
- Autenticação JWT customizada (`src/lib/auth.ts`, cookies `session` e `csrf_token`).
- Validadores Zod (`src/lib/validations/*`) e sanitização HTML/URL (`src/lib/security/sanitize.ts`).
- Uploads de arquivos (`src/lib/upload.ts`, rotas de upload de biblioteca e documentos).
- Componentes cliente de leitor PDF/áudio (`src/components/study/*`).
- Banco de dados: Prisma ORM (apenas consultas parametrizadas, nenhum SQL cru).

---

## 2. Matriz OWASP Top 10 (2021)

| # | Risco | Status | Comentário |
|---|-------|--------|------------|
| A01 | Broken Access Control | ✅ Corrigido | Todas as rotas de usuário usam `where: { ..., userId: user.id }`; rotas admin exigem `role ADMIN` no banco; rota `/api/seed` protegida por admin. |
| A02 | Cryptographic Failures | ✅ Corrigido | `AUTH_SECRET` sem fallback hardcoded (gera aviso/temporário apenas em dev, obrigatório em prod); cookies `HttpOnly`, `Secure`, `SameSite=Strict`; senhas hasheadas com bcrypt (custo 12). |
| A03 | Injection | ✅ Mitigado | 100% Prisma ORM (consultas parametrizadas), nenhum SQL cru. Zod valida todos os payloads de entrada. |
| A04 | Insecure Design | ✅ Corrigido | Rate limiting em login, registro e upload de documentos; CSRF double-submit em rotas mutantes de usuário e admin. |
| A05 | Security Misconfiguration | ✅ Mitigado | Cabeçalhos de segurança via middleware (CSP, HSTS, nosniff, frame-ancestors, etc.); CSP ainda permite `unsafe-inline` em dev (limitação conhecida do Next.js). |
| A06 | Vulnerable and Outdated Components | ⚠️ Pendente | Não foi possível executar `npm audit` neste ambiente. Verificar dependências antes do deploy. |
| A07 | Identification and Authentication Failures | ✅ Corrigido | JWT próprio com expiração 7d, rate limiting em login/registro/upload, logout invalida cookies. |
| A08 | Software and Data Integrity Failures | ✅ Corrigido | JWT assinado (HS256), CSRF double-submit, validação de magic number em uploads. |
| A09 | Security Logging and Monitoring | ✅ Corrigido | `securityLog` em login (sucesso/falha), registro, upload, acesso negado (401/403) e rate limit excedido. |
| A10 | Server-Side Request Forgery (SSRF) | ✅ Mitigado | Nenhuma rota faz `fetch` de URL fornecida pelo usuário; `sanitizeUrl` restringe a `http(s)` ou caminhos relativos. |

---

## 3. Achados e Correções

### 3.1 Rota `/api/seed` sem autenticação (Crítico — A01)
**Achado:** `GET /api/seed` redefinia senhas do admin e usuário demo sem qualquer autenticação. Qualquer atacante poderia bloquear o admin ou criar credenciais conhecidas.
**Correção:** Adicionado `requireAdminUser()` ao início da rota. Agora apenas usuários com `role = ADMIN` (verificado no banco) podem executar o seed.
**Arquivo:** `src/app/api/seed/route.ts`

### 3.2 `AUTH_SECRET` com fallback hardcoded (Alto — A02)
**Achado:** `auth.ts` usava `"dev-secret-only-change-in-production"` como fallback quando `AUTH_SECRET` não estava definida, expondo um segredo previsível.
**Correção:** Removido o fallback hardcoded. Em produção a variável é obrigatória (já lançava erro). Em desenvolvimento, gera um segredo aleatório temporário por sessão e emite aviso no console.
**Arquivo:** `src/lib/auth.ts`

### 3.3 Rate limiting insuficiente (Médio — A04 / A07)
**Achado:** Rate limiting existia apenas em `search-log` e `signIn`. Registro e upload de documentos não estavam protegidos contra abuso.
**Correção:**
- `registerAction`: rate limit de 5 requisições por email por minuto.
- `documents/upload`: rate limit de 30 requisições por usuário por minuto.
- `signIn`: mantido (10 tentativas por email por minuto).
**Arquivos:** `src/actions/auth.ts`, `src/app/api/documents/upload/route.ts`

### 3.4 CSRF apenas em rotas admin (Médio — A04 / A08)
**Achado:** O token double-submit (`X-CSRF-Token`) era exigido apenas nas rotas admin. Rotas de usuário dependiam exclusivamente do `SameSite=Strict` do cookie de sessão.
**Correção:** Adicionada validação CSRF às rotas mutantes de usuário sensíveis: `PATCH /api/settings` e `POST /api/documents/upload`. O cookie de sessão permanece `SameSite=Strict`, mitigando CSRF cross-site por padrão.
**Arquivos:** `src/app/api/settings/route.ts`, `src/app/api/documents/upload/route.ts`

### 3.5 Logging de segurança ausente (Médio — A09)
**Achado:** Não havia registro de eventos de segurança (login falho, acesso negado, upload).
**Correção:** Criado `src/lib/security/security-log.ts` com eventos estruturados (login sucesso/falha, registro, upload, acesso negado 401/403, rate limit excedido). Integrado ao `signIn`, `registerAction`, upload de documentos e `handleRoute` (centraliza 401/403).
**Arquivos:** `src/lib/security/security-log.ts`, `src/lib/auth.ts`, `src/app/api/documents/upload/route.ts`, `src/lib/api/response.ts`

### 3.6 Sanitização XSS (Médio — A03 / A05)
**Achado:** `sanitizeHtml` e `sanitizeUrl` já existiam e são usados em `notas/[id]` e `vaga/[id]` (via `dangerouslySetInnerHTML`).
**Status:** Mantido e documentado. Conteúdo de estudo (`StudyContent`) é renderizado como texto puro, não HTML.
**Arquivos:** `src/lib/security/sanitize.ts`

---

## 4. Limitações Conhecidas

1. **CSP `unsafe-inline` (dev):** O Content Security Policy permite `script-src 'unsafe-inline'` e `style-src 'unsafe-inline'` para compatibilidade com o modo de desenvolvimento do Next.js App Router (hidratação). Em produção, recomenda-se migrar para nonce-based CSP assim que o Next.js permitir sem quebrar a hidratação.
2. **`npm audit` não executado:** Não foi possível verificar vulnerabilidades de dependências neste ambiente. Executar antes do deploy de produção.
3. **Logging em console:** Os eventos de segurança são emitidos no console. Em produção, devem ser encaminhados para um sistema de observabilidade/SIEM externo.
4. **Rate limiting in-memory:** O rate limiter armazena em memória (`Map`). Em implantação com múltiplas instâncias (Vercel Serverless), o rate limiting é por instância. Para produção com múltiplas instâncias, usar um store distribuído (Redis).
5. **`AUTH_SECRET` em dev:** Em desenvolvimento, sem `AUTH_SECRET` o app usa um segredo temporário por sessão (login invalida sessões anteriores). Definir `AUTH_SECRET` em `.env` para estabilidade em dev.

---

## 5. Recomendações para Produção

1. Definir `AUTH_SECRET` (mínimo 32 bytes aleatórios) no Vercel.
2. Remover a rota `/api/seed` ou torná-la inacessível em produção (apenas admin já está imposto, mas considere desabilitá-la totalmente).
3. Configurar `VERCEL_ENV=production` para que os cookies recebam `Secure`.
4. Executar `npm audit` e corrigir dependências vulneráveis antes do deploy.
5. Implementar rate limiting distribuído (Redis) se houver múltiplas instâncias.
6. Enviar eventos `securityLog` para um SIEM/logging externo em produção.
7. Rotacionar as senhas de demo (`admin@devpath.com` e `pablo@devpath.com`) antes do deploy.

---

## 6. Validação Realizada

- `npx tsc --noEmit` — passou
- `npx vitest run` — 81/81 testes passando
- `npm run build` — passou (produção)
- Smoke tests no navegador (Etapa 4 e 5): login admin/pablo, admin 403 para não-admin, CRUD de trilhas/biblioteca, upload seguro (magic number), leitor PDF/áudio, acesso restrito a arquivos (200/206 para dono/admin, 401 anônimo), CSRF 403 em mutações sem token.
