# auraxis-web

Aplicação web do Auraxis construída com Nuxt 4, TypeScript estrito e Vue 3 — voltada para controle financeiro pessoal com foco em clareza, confiança e visão consolidada da vida financeira.

## Papel do repositório

- experiência web autenticada do produto
- superfícies públicas do Web (institucional e ferramentas públicas, conforme roadmap)
- integração tipada com `auraxis-api`
- base de UI/design system da experiência Web

## Fontes de verdade

- Execução e priorização: GitHub Projects / issues do repositório
- Governança global: `/Users/italochagas/Desktop/projetos/auraxis-platform/.context/06_context_index.md`, `/Users/italochagas/Desktop/projetos/auraxis-platform/.context/07_steering_global.md`, `/Users/italochagas/Desktop/projetos/auraxis-platform/.context/08_agent_contract.md`
- Arquitetura frontend transversal: `/Users/italochagas/Desktop/projetos/auraxis-platform/.context/26_frontend_architecture.md`
- Regras locais do repo: `steering.md`
- Regras de código: `CODING_STANDARDS.md`
- Quality gates locais: `.context/quality_gates.md`

## Stack

- Nuxt 4
- Vue 3
- TypeScript strict
- Pinia
- TanStack Vue Query
- Naive UI
- ESLint (`@nuxt/eslint`) + Prettier
- Vitest / Playwright
- Storybook (mantido para evolução do design system)
- Chromatic (trilha oficial de visual review do design system)

## Arquitetura-alvo

Este repo está migrando para uma organização **feature-based** dentro de `app/`.

Estrutura-alvo:

```text
app/
  core/          # config, sessão, http, erro, bootstrap
  features/      # auth, dashboard, transactions, goals, wallet, tools
  shared/        # componentes compartilhados, tipos, validadores, utils
  composables/   # façade/composables transversais do app
  components/    # wrappers e composição de UI compartilhada
  utils/         # funções puras genéricas
  theme/         # tokens e tema visual
  types/         # aliases/exports compartilhados quando necessário
```

## Comandos principais

```bash
pnpm install
pnpm dev
pnpm storybook
pnpm storybook:build
pnpm lint
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm quality-check
pnpm build
```

## Notas importantes

- Não usar `tasks.md`; o backlog é mantido no GitHub Projects.
- Não commitar diretamente em `main`/`master`.
- Toda mudança de contrato com backend deve refletir os tipos e adapters do frontend.
- Placeholders não devem mascarar falhas do fluxo nominal.

## Visual review oficial

- workflow: `.github/workflows/chromatic.yml`
- secret esperado: `CHROMATIC_PROJECT_TOKEN`
- domínio alvo: `https://v1.design-system.auraxis.com.br`
- fallback operacional: URL nativa do Chromatic em cada build

Referência operacional:

- [Chromatic e Storybook](./docs/chromatic.md)
