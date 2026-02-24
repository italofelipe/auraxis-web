# tasks.md — auraxis-web

Última atualização: 2026-02-24

## Legenda

| Símbolo | Significado |
| :------ | :---------- |
| `[ ]`   | Todo        |
| `[~]`   | In Progress |
| `[!]`   | Blocked     |
| `[x]`   | Done        |

**Prioridade:** P0 = bloqueante / P1 = alta / P2 = normal / P3 = baixa

---

## Ciclo A — Bootstrap do projeto Nuxt

> **Status do ciclo:** WEB1 concluído (2026-02-23). Próximas tasks desbloqueadas.

### P0 — Sem isso não há desenvolvimento

- [x] **WEB1** `chore` — Inicializar projeto Nuxt 4 com TypeScript + @nuxt/eslint + quality stack
  - Critério: `nuxi init` executado. `pnpm dev` sobe servidor local. `pnpm lint` + `pnpm typecheck` passam. `tsconfig.json` com `strict: true`.
  - Commit: `cd807f3` — feat(web): initialize Nuxt 4 project with pnpm and full quality stack
  - Nota: Biome substituído por @nuxt/eslint (linter oficial Nuxt). Nuxt 4.3.1 com pnpm@10.30.1.

- [ ] **WEB2** `chore` — Configurar cliente HTTP para auraxis-api
  - Critério: composable `useApi()` exporta client com base URL via `NUXT_PUBLIC_API_BASE`. Requisição de teste para `/health` retorna 200. Tipagem gerada a partir do OpenAPI schema de auraxis-api.
  - Dependência: WEB1 ✅, auraxis-api com schema OpenAPI exportado
  - Commit: —

### P1 — Alta

- [ ] **WEB3** `feat` — Layout base e sistema de autenticação
  - Critério: layout `default.vue` com header e nav. Middleware de autenticação redireciona para `/login` se sem token. Tela de login consome `POST /auth/login`. Token armazenado em cookie HttpOnly via servidor Nuxt.
  - Dependência: WEB2
  - Commit: —
  - Risco residual: SSR com cookies HttpOnly requer configuração de proxy server-side.

- [ ] **WEB4** `feat` — Dashboard principal (saldo e transações)
  - Critério: página `/dashboard` exibe saldo atual e últimas 20 transações. SSR: dados pré-carregados no servidor com `useAsyncData`. Loading skeleton implementado.
  - Dependência: WEB3
  - Commit: —

### P2 — Normal

- [x] **WEB5** `chore` — Configurar CI (GitHub Actions)
  - Critério: workflow roda `pnpm lint` + `pnpm typecheck` + `pnpm test` + `pnpm build` + secret-scan + dep-audit a cada PR. ci-passed gate obrigatório.
  - Commit: incluído em `cd807f3` (quality stack bootstrap)
  - Dependência: WEB1

- [ ] **WEB6** `chore` — Definir estratégia de deploy
  - Critério: ADR criado em `docs/adr/WEB6-deploy-strategy.md` com decisão entre Vercel, AWS ou VPS. Pipeline de deploy configurado.
  - Dependência: WEB5, decisão humana sobre infra
  - Commit: —

### P3 — Baixa / Futuro

- [ ] **WEB7** `feat` — Tela de metas financeiras
  - Critério: a definir quando B10 (perfil investidor) estiver concluído em auraxis-api.
  - Dependência: B10 em auraxis-api, WEB4

- [ ] **WEB8** `test` — Testes de componentes com Vitest + Vue Test Utils
  - Critério: componentes críticos com cobertura básica de render e interação.
  - Dependência: WEB3

### Bloqueados

- Nenhum task atualmente bloqueado por prioridade de roadmap. WEB1 concluído desbloqueou o ciclo A.

---

## Concluídos

- [x] Governance baseline: CLAUDE.md, .gitignore, README.md, tasks.md, steering.md | Data: 2026-02-22
- [x] Registrado como submodule em auraxis-platform | Commit: `2b138fa` | Data: 2026-02-22
- [x] CI fix: alinhamento da versão do pnpm no workflow com `packageManager` para eliminar `ERR_PNPM_BAD_PM_VERSION` | Data: 2026-02-24
