# CLAUDE.md — auraxis-web

## Identidade

Repositório da aplicação web do Auraxis.
Stack: Nuxt 4 + TypeScript + @nuxt/eslint.

Este repo é um **submodule** de `auraxis-platform`.
Sempre trabalhe a partir da raiz da platform quando possível.

## Session Bootstrap (MANDATORY — execute em ordem)

Antes de qualquer ação, leia a partir da platform:

1. `auraxis-platform/.context/06_context_index.md` — índice de contexto
2. `auraxis-platform/.context/07_steering_global.md` — governança global
3. `auraxis-platform/.context/08_agent_contract.md` — contrato de agente
4. `auraxis-platform/.context/01_status_atual.md` — status atual
5. `auraxis-platform/.context/02_backlog_next.md` — prioridades
6. `auraxis-platform/.context/25_quality_security_playbook.md` — playbook de qualidade e segurança (OBRIGATÓRIO antes de qualquer código)
7. Este arquivo — diretiva do repo web

## Estrutura alvo do repo

```
auraxis-web/
  app/
    pages/         # Páginas (Nuxt file-based routing)
    components/    # Componentes reutilizáveis
    composables/   # Composables Vue (estado, lógica)
    layouts/       # Layouts base
  assets/          # Estilos globais, imagens
  public/          # Arquivos estáticos públicos
  server/          # API routes server-side (opcional)
  tests/           # Testes unitários (Vitest, co-localized preferred)
  e2e/             # Testes E2E (Playwright)
  nuxt.config.ts   # Configuração principal do Nuxt
```

## Stack e ferramentas

| Camada           | Tecnologia                       |
| :--------------- | :------------------------------- |
| Framework        | Nuxt 4.3.1                       |
| Linguagem        | TypeScript strict                |
| Linter/Formatter | @nuxt/eslint + Prettier          |
| Estado           | Pinia + @pinia/colada-nuxt       |
| Testes unitários | Vitest + @nuxt/test-utils        |
| Testes E2E       | Playwright                       |
| Segurança        | Gitleaks, TruffleHog, dep-review |
| Qualidade        | SonarCloud, Lighthouse CI        |
| Bundler          | Vite (via Nuxt)                  |

## Operação local

```bash
# Instalar dependências
pnpm install

# Dev server
pnpm dev

# Build
pnpm build

# Preview
pnpm preview

# Lint
pnpm lint

# Typecheck
pnpm typecheck

# Testes unitários
pnpm test

# Testes E2E (requer servidor rodando)
pnpm test:e2e

# Quality check completo (OBRIGATÓRIO antes de commit)
pnpm quality-check
```

## Quality gates (OBRIGATÓRIO antes de todo commit)

```bash
pnpm lint          # @nuxt/eslint
pnpm typecheck     # nuxi typecheck
pnpm test          # Vitest
pnpm build         # Nuxt build
```

Thresholds:

- Cobertura: ≥ 85% (não pode regredir)
- TypeScript: zero erros
- Build: deve passar sem warnings críticos

Ver `.context/quality_gates.md` (local) e `auraxis-platform/.context/25_quality_security_playbook.md` para referência completa.

## Convenções

- **Commits**: Conventional Commits (`feat`, `fix`, `chore`, `docs`, `test`, `refactor`)
- **Branch**: `type/scope-descricao` (ex: `feat/auth-login-page`)
- **Nunca** commitar direto em `master`
- **Nunca** expor tokens ou segredos em código
- **Sempre** rodar `pnpm quality-check` antes de commitar

## Limites operacionais

### Pode fazer autonomamente

- Ler qualquer arquivo do repo
- Criar/editar páginas, componentes, composables
- Atualizar documentação local
- Criar branches de feature
- Rodar quality gates

### Deve perguntar antes

- Mudanças em `nuxt.config.ts` com impacto em build
- Adição de módulos Nuxt com configuração externa
- Alterações em contratos com `auraxis-api`
- Mudanças em `steering.md` ou arquivos de `.context/`

### Nunca fazer

- Commitar direto em `master`
- Expor secrets ou chaves de API em código
- Commitar sem rodar quality gates
- Usar `git add .` (sempre staged seletivamente)

## Integração com platform

Este repo é orchestrado por `auraxis-platform`.
Handoffs e decisões de arquitetura ficam em `auraxis-platform/.context/`.
Contratos de API são definidos e versionados em `auraxis-api`.
