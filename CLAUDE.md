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

**Canonical CI-parity command** (mirrors GitHub Actions ci.yml exactly):

```bash
pnpm quality-check
```

This runs in order: flags:check → lint → typecheck → test:coverage → policy:check →
contracts:check → build.

**Full CI parity** (includes audit gate, optional lighthouse/e2e/sonar):

```bash
bash scripts/run_ci_like_actions_local.sh --local
# Add --with-e2e --with-lighthouse for complete CI match
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

## SDD (obrigatório para features)

- Antes de codar: garantir que a task/issue no GitHub Projects tenha critérios de aceite
  claros e, se necessário, registrar contexto adicional em `.context/reports/`.
- Ao finalizar bloco: registrar Delivery Report em `.context/reports/`.
- Se interromper sessão: registrar handoff em `.context/handoffs/`.
