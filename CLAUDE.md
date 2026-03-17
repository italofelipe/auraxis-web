# CLAUDE.md — auraxis-web

## Papel do repositório

Frontend web do Auraxis.

## Ordem de leitura obrigatória

1. `/Users/italochagas/Desktop/projetos/auraxis-platform/.context/06_context_index.md`
2. `/Users/italochagas/Desktop/projetos/auraxis-platform/.context/07_steering_global.md`
3. `/Users/italochagas/Desktop/projetos/auraxis-platform/.context/08_agent_contract.md`
4. `/Users/italochagas/Desktop/projetos/auraxis-platform/.context/26_frontend_architecture.md`
5. `steering.md`
6. `product.md`
7. `.context/quality_gates.md`

## Regras locais

- GitHub Projects é a fonte de backlog e status.
- Não usar `tasks.md`.
- Não commitar direto em `main`.
- Não mascarar erro real de integração com placeholder no fluxo nominal.
- Mudanças de frontend devem priorizar organização por feature.

## Arquitetura-alvo

- `app/features/*` para domínios
- `app/core/*` para infraestrutura não visual
- `app/shared/*` para itens reutilizáveis
- `app/composables/*` como fachada fina quando fizer sentido

## Stack

- Nuxt 4
- TypeScript strict
- Pinia
- Vue Query
- Naive UI
- Vitest / Playwright
- Storybook (manter)

## Quality gates obrigatórios

```bash
pnpm lint
pnpm typecheck
pnpm test:coverage
pnpm policy:check
pnpm contracts:check
pnpm build
```
