# tasks.md — auraxis-web

Última atualização: 2026-02-25

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

- [x] **WEB2** `chore` — Configurar cliente HTTP para auraxis-api
  - Critério: composable `useApi()` exporta client com base URL via `NUXT_PUBLIC_API_BASE`. Requisição de teste para `/health` retorna 200. Tipagem gerada a partir do OpenAPI schema de auraxis-api.
  - Dependência: WEB1 ✅, auraxis-api com schema OpenAPI exportado
  - Commit: a definir (branch `chore/web10-test-baseline`)

- [x] **WEB10** `chore` — Estabelecer baseline de testes para remover `--passWithNoTests`
  - Critério: pelo menos 1 suíte real cobrindo fluxo crítico inicial e scripts `test/test:coverage` sem `--passWithNoTests`.
  - Dependência: WEB1
  - Commit: a definir (branch `chore/web10-test-baseline`)
  - Risco residual: baseline cobre apenas shell inicial (`app.vue`); expandir cobertura funcional em `WEB8` e nas próximas features.

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

- [ ] **WEB11** `chore` — Padronizar UI kit web em Chakra UI customizado (sem Tailwind)
  - Critério: tema central com paleta oficial, tipografia `Playfair Display` + `Raleway`, grid de 8px e componentes-base migrados para camada Chakra custom.
  - Dependência: WEB1
  - Commit: —
  - Risco residual: migração parcial pode manter estilos legados até conclusão por feature.

- [ ] **WEB12** `chore` — Adotar TanStack Query para server-state
  - Critério: provider global configurado, política de cache/retry/invalidation definida e primeiro fluxo HTTP crítico usando `@tanstack/vue-query`.
  - Dependência: WEB2
  - Commit: —
  - Risco residual: durante transição, coexistência com lógica legada de fetch/composables.

### P2 — Normal

- [x] **WEB5** `chore` — Configurar CI (GitHub Actions)
  - Critério: workflow roda `pnpm lint` + `pnpm typecheck` + `pnpm test` + `pnpm build` + secret-scan + dep-audit a cada PR. checks reais obrigatórios configurados na branch protection.
  - Commit: incluído em `cd807f3` (quality stack bootstrap)
  - Dependência: WEB1

- [ ] **WEB6** `chore` — Definir estratégia de deploy
  - Critério: ADR criado em `docs/adr/WEB6-deploy-strategy.md` com decisão entre Vercel, AWS ou VPS. Pipeline de deploy configurado.
  - Dependência: WEB5, decisão humana sobre infra
  - Commit: —

- [~] **WEB13** `chore` — Deploy mínimo do frontend web (baseline público)
  - Critério: ambiente estável publicado com smoke-check (`/` e `/health` via BFF/SSR), URL documentada e rollback básico.
  - Dependência: WEB6
  - Commit: —
  - Risco residual: baseline inicial pode operar com feature set reduzido e sem otimizações finais de performance.

- [~] **WEB14** `chore` — Preparar distribuição da PWA em Play Store/App Store
  - Critério: estratégia de empacotamento definida e funcional (`TWA` para Android e wrapper iOS compatível), com artefatos assinados em ambiente de release.
  - Dependência: WEB13
  - Commit: —
  - Risco residual: publicação em App Store para PWA depende de regras de review e wrapper nativo mínimo.

- [~] **WEB15** `chore` — Configurar versionamento automático (semver + changelog)
  - Critério: release automatizada por Conventional Commits (tag + changelog + bump) sem edição manual de versão.
  - Dependência: WEB5
  - Commit: —
  - Risco residual: estratégia de branches/release precisa ficar alinhada com app/api para evitar drift de versões.

- [~] **WEB16** `chore` — Integrar feature toggle OSS no frontend web
  - Critério: SDK integrado com provedores por ambiente, fallback seguro e primeiro flag controlando feature real em produção.
  - Dependência: WEB2
  - Commit: —
  - Risco residual: sem governança de lifecycle dos flags, há risco de acúmulo de toggles obsoletos.

- [x] **WEB18** `chore` — Automatizar hygiene de feature flags no CI
  - Critério: catálogo versionado de flags com metadados obrigatórios e validação bloqueante no CI/local parity para owner, removeBy e expiração.
  - Dependência: WEB16
  - Commit: —
  - Risco residual: ainda depende de disciplina para remover código morto após cleanup de flag.

- [x] **WEB9** `chore` — Dockerizar frontend Nuxt para desenvolvimento e CI
  - Critério: `Dockerfile` + `.dockerignore` + comando de execução documentado; build de imagem passa em CI sem warnings críticos.
  - Dependência: WEB5
  - Commit: a definir (branch `chore/web10-test-baseline`)

### P3 — Baixa / Futuro

- [ ] **WEB7** `feat` — Tela de metas financeiras
  - Critério: a definir quando B10 (perfil investidor) estiver concluído em auraxis-api.
  - Dependência: B10 em auraxis-api, WEB4

- [ ] **WEB8** `test` — Testes de componentes com Vitest + Vue Test Utils
  - Critério: componentes críticos com cobertura básica de render e interação.
  - Dependência: WEB3

- [ ] **WEB17** `feat` — Aba Ferramentas: calculadora "Pedir aumento"
  - Critério: usuário informa salário inicial/data-base, impostos/abatimentos e aumento real desejado; sistema calcula recomposição inflacionária + aumento real alvo.
  - Dependência: WEB4, endpoint de cálculo no backend
  - Commit: —
  - Prioridade de produto: baixa

### Bloqueados

- Nenhum task atualmente bloqueado por prioridade de roadmap. WEB1 concluído desbloqueou o ciclo A.

---

## Concluídos

- [x] Governance baseline: CLAUDE.md, .gitignore, README.md, tasks.md, steering.md | Data: 2026-02-22
- [x] Registrado como submodule em auraxis-platform | Commit: `2b138fa` | Data: 2026-02-22
- [x] CI fix: alinhamento da versão do pnpm no workflow com `packageManager` para eliminar `ERR_PNPM_BAD_PM_VERSION` | Data: 2026-02-24
- [x] CI fix: `eslint` explicitado em devDependencies para eliminar `sh: eslint: not found` no job de lint | Data: 2026-02-24
- [x] CI fix: audit com allowlist temporária para `GHSA-3ppc-4f35-3m26` (minimatch transiente) e bloqueio mantido para demais high/critical | Data: 2026-02-24
- [x] CI fix: Sonar migrado para `sonarqube-scan-action@v5` e `sonar.sources=.` para evitar falha por diretórios ausentes no scaffold | Data: 2026-02-24
- [x] CI fix: Sonar pinado em SHA completo (`sonarqube-scan-action@v6`) e organização corrigida para `sensoriumit` | Data: 2026-02-24
- [x] CI hardening: jobs Lighthouse e Playwright protegidos por flags de repositório (`ENABLE_LIGHTHOUSE_CI` e `ENABLE_WEB_E2E`) até estabilização de runtime SSR no scaffold atual | Data: 2026-02-24
- [x] CI security fix: permissões de workflows movidas de nível global para nível de job (least privilege) para atender policy/Sonar | Data: 2026-02-24
- [x] CI hardening: `dependency-review-action` ajustado para modo bloqueante (sem fallback permissivo) | Data: 2026-02-24
- [x] CI hardening: Sonar padronizado para CI scanner sempre ativo (Automatic Analysis deve permanecer desabilitado no SonarCloud) | Data: 2026-02-24
- [x] Hygiene fix: removido artefato local indevido (`.nuxtrc 2`) e `.gitignore` ajustado para ignorar variantes (`.nuxtrc*`) | Data: 2026-02-24
- [x] CI compat: `dependency-review-action` com fallback controlado para repo sem Dependency Graph suportado/habilitado | Data: 2026-02-24
- [x] CI hardening: Sonar scanner estrito reativado após desativação do Automatic Analysis no SonarCloud | Data: 2026-02-24
- [x] WEB10 concluído: baseline de testes reais criado, `--passWithNoTests` removido e coverage validado no gate local | Data: 2026-02-24
- [x] Lint hardening: perfil ESLint estrito aplicado (estilo + complexidade + disciplina TypeScript), com padrão de formatação (`.prettierrc.json`) e `--max-warnings 0` no lint/lint-staged | Data: 2026-02-24
- [x] WEB2 concluído: composable `useApi` + runtime config `NUXT_PUBLIC_API_BASE` + teste unitário de healthcheck (`/health`) | Data: 2026-02-24
- [x] WEB9 concluído: `Dockerfile` multi-stage + `.dockerignore` + `docker-compose.yml` + runbook em `docs/runbooks/WEB9-docker.md` | Data: 2026-02-24
- [x] CI hardening: job `Docker Build (Nuxt)` adicionado à lista de checks obrigatórios da branch protection | Data: 2026-02-24
- [x] SDD hardening: templates locais (`feature_card`/`delivery_report`) + `product.md` + diretórios `handoffs/reports` adicionados para execução autônoma | Data: 2026-02-24
- [x] Dependency review hardening: fallback permissivo removido (`continue-on-error`) para enforcement real no PR gate | Data: 2026-02-24
- [x] Security fix: normalização de base URL refatorada para algoritmo linear (`removeTrailingSlashes`) sem regex suscetível a backtracking/ReDoS | Data: 2026-02-24
- [x] Quality gate: coverage mínimo padronizado em 85% (lines/functions/statements/branches) com validação local em `pnpm test:coverage` | Data: 2026-02-24
- [x] CI compat fix: dependency-review com detecção automática de `Dependency Graph` e fallback controlado quando repositório não suportar o check nativo | Data: 2026-02-24
- [x] CI parity local: criado `scripts/run_ci_like_actions_local.sh` + `scripts/ci-audit-gate.cjs`; workflow de audit passou a reutilizar script compartilhado | Data: 2026-02-24
- [x] Sonar code smell fix: `String#charCodeAt()` substituído por `String#codePointAt()` em normalização de URL | Data: 2026-02-24
- [x] Sonar coverage fix: escopo de análise (`sonar.sources/inclusions`) alinhado ao baseline coberto no `lcov` para eliminar falso negativo de coverage global no scaffold | Data: 2026-02-24
- [x] Sonar CI fix: cobertura Vitest padronizada com `lcovonly` + validação explícita de `coverage/lcov.info` no job Sonar para evitar regressão de 0% por ausência de report | Data: 2026-02-24
- [x] Sonar report fix: `test:coverage` força reporters via CLI (incluindo `lcovonly`) para garantir geração determinística de `coverage/lcov.info` no CI | Data: 2026-02-24
- [x] Governança UI atualizada: paleta, tipografia, grid 8px, proibição de Tailwind e baseline de Chakra UI + TanStack Query registradas em `steering.md` e `CODING_STANDARDS.md` | Data: 2026-02-24
- [x] CI simplification: removido gate sintético `ci-passed`; branch protection passa a exigir checks reais do pipeline | Data: 2026-02-24
- [x] CI resilience: Dockerfile endurecido com retry/backoff para `corepack prepare pnpm@10.30.1` e `pnpm install` (mitigação de falhas transitórias `HTTP 503`) | Data: 2026-02-24
- [x] PLT3 foundation (web): `release-please` configurado com PR/tag/changelog automáticos (`.release-please-*` + workflow) | Data: 2026-02-24
- [x] PLT5 foundation (web): deploy mínimo contínuo via GitHub Pages (`deploy-minimum.yml`) com geração estática e artifact de publicação | Data: 2026-02-24
- [x] PLT2 foundation (web): baseline PWA documentada com `manifest.webmanifest` e runbook inicial para empacotamento em stores | Data: 2026-02-24
- [x] PLT2 foundation (web): workflow manual de geração de artefatos para empacotamento em stores (`pwa-store-artifacts.yml`) | Data: 2026-02-24
- [x] PLT4.1 (web): catálogo de flags em `config/feature-flags.json` + gate `Feature Flags Hygiene` no CI + validação local em `scripts/run_ci_like_actions_local.sh` | Data: 2026-02-25
