# tasks.md — auraxis-web

Última atualização: 2026-02-22

## Legenda

| Símbolo | Significado |
|:--------|:------------|
| `[ ]` | Todo |
| `[~]` | In Progress |
| `[!]` | Blocked |
| `[x]` | Done |

**Prioridade:** P0 = bloqueante / P1 = alta / P2 = normal / P3 = baixa

---

## Ciclo A — Bootstrap do projeto Nuxt

> **Status do ciclo:** bloqueado — auraxis-api e auraxis-app têm prioridade no roadmap atual.
> Este ciclo deve ser iniciado após APP4 estar concluído.

### P0 — Sem isso não há desenvolvimento

- [!] **WEB1** `chore` — Inicializar projeto Nuxt 3 com TypeScript + Biome
  - Critério: `nuxi init` executado. `npm run dev` sobe servidor local. `biome check .` passa sem erros no scaffold. `tsconfig.json` com `strict: true`.
  - Dependência: nenhuma técnica — bloqueado por prioridade de roadmap
  - Commit: —
  - Risco residual: Biome pode não ter plugin Nuxt; pode ser necessário ajuste de config.

- [!] **WEB2** `chore` — Configurar cliente HTTP para auraxis-api
  - Critério: composable `useApi()` exporta client com base URL via `NUXT_PUBLIC_API_BASE`. Requisição de teste para `/health` retorna 200. Tipagem gerada a partir do OpenAPI schema de auraxis-api.
  - Dependência: WEB1, auraxis-api com schema OpenAPI exportado
  - Commit: —

### P1 — Alta

- [!] **WEB3** `feat` — Layout base e sistema de autenticação
  - Critério: layout `default.vue` com header e nav. Middleware de autenticação redireciona para `/login` se sem token. Tela de login consome `POST /auth/login`. Token armazenado em cookie HttpOnly via servidor Nuxt.
  - Dependência: WEB2
  - Commit: —
  - Risco residual: SSR com cookies HttpOnly requer configuração de proxy server-side.

- [!] **WEB4** `feat` — Dashboard principal (saldo e transações)
  - Critério: página `/dashboard` exibe saldo atual e últimas 20 transações. SSR: dados pré-carregados no servidor com `useAsyncData`. Loading skeleton implementado.
  - Dependência: WEB3
  - Commit: —

### P2 — Normal

- [!] **WEB5** `chore` — Configurar CI (GitHub Actions)
  - Critério: workflow roda `biome check` + `tsc --noEmit` + testes (Vitest quando houver) a cada PR contra `main`. Build Nuxt (`nuxt build`) validado no CI.
  - Dependência: WEB1
  - Commit: —

- [!] **WEB6** `chore` — Definir estratégia de deploy
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

- [!] **WEB1..WEB8** — Bloqueados por prioridade de roadmap. Ver `auraxis-platform/.context/02_backlog_next.md`.
  - Desbloqueio: decisão humana de iniciar Ciclo A do auraxis-web.

---

## Concluídos

- [x] Governance baseline: CLAUDE.md, .gitignore, README.md, tasks.md, steering.md | Data: 2026-02-22
- [x] Registrado como submodule em auraxis-platform | Commit: `2b138fa` | Data: 2026-02-22
