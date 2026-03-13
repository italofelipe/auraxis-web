# auraxis-web

Aplicação web do Auraxis construída com Nuxt 4, TypeScript estrito e Vue 3.

## Papel do repositório

- experiência web autenticada do produto
- superfícies públicas do Web (institucional e ferramentas públicas, conforme roadmap)
- integração tipada com `auraxis-api`
- base de UI/design system da experiência Web

## Fontes de verdade

- Execução e priorização: GitHub Projects / issues do repositório
- Governança global: `/Users/italochagas/Desktop/projetos/auraxis-platform/.context/06_context_index.md`, `/Users/italochagas/Desktop/projetos/auraxis-platform/.context/07_steering_global.md`, `/Users/italochagas/Desktop/projetos/auraxis-platform/.context/08_agent_contract.md`
- Arquitetura frontend transversal: `/Users/italochagas/Desktop/projetos/auraxis-platform/.context/26_frontend_architecture.md`
- Regras locais do repo: `/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-web/steering.md`
- Quality gates locais: `/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-web/.context/quality_gates.md`

## Stack

- Nuxt 4
- Vue 3
- TypeScript strict
- Pinia
- TanStack Vue Query
- Naive UI
- ESLint + Prettier
- Vitest + Playwright
- Storybook (mantido para evolução do design system)

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
pnpm lint
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm quality-check
pnpm build
```

## Notas importantes

- Não usar `tasks.md`; o backlog é mantido no GitHub Projects.
- Não commitar diretamente em `main`.
- Toda mudança de contrato com backend deve refletir os tipos e adapters do frontend.
- Placeholders não devem mascarar falhas do fluxo nominal.
