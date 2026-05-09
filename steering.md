# steering.md — auraxis-web

Documento canônico de direção técnica do `auraxis-web`.

## Decisões de arquitetura

### ADR-001: Nuxt 4 + Naive UI como stack canônico

Stack: Nuxt 4, Vue 3 Composition API, Naive UI, TanStack Query, Pinia, TypeScript strict.
Não adicionar UI libraries alternativas (Vuetify, PrimeVue, etc.).

### ADR-002: Feature-based architecture

Toda lógica de domínio fica em `app/features/<domain>/`.
Imports laterais entre features são proibidos.
Componentes reutilizáveis vão para `app/shared/`.

### ADR-003: TanStack Query como server state

Nunca sincronize dados da API com `ref()` ou Pinia manualmente.
Use `useQuery`/`useMutation` de `app/features/*/queries/`.

### ADR-004: Locale EN congelado (DEC-186)

`app/i18n/locales/en.json` está congelado durante MVP1.
Para editar: commit com `[en-freeze-bypass]` no subject + update de `.en-frozen.sha256`.

### ADR-005: E2E job faz build local (não artifact download)

O job `e2e` em `ci.yml` deve sempre fazer `pnpm build` localmente.
`download-artifact@v4` falha no mesmo run — não re-introduzir.

## Governança

- Branch: `type/scope-description`
- Quality gate: `pnpm quality-check` antes de todo commit
- Coverage: ≥ 85% (nunca regredir)
- PRs: incluir `Closes #<n>` no body
- Nunca commitar direto em main
- GitHub Projects é a fonte de backlog

## Referências obrigatórias

Antes de qualquer trabalho neste repo, ler:

1. `/Users/italochagas/Desktop/projetos/auraxis-platform/.context/06_context_index.md`
2. `/Users/italochagas/Desktop/projetos/auraxis-platform/.context/07_steering_global.md`
3. `/Users/italochagas/Desktop/projetos/auraxis-platform/.context/08_agent_contract.md`
4. `/Users/italochagas/Desktop/projetos/auraxis-platform/.context/26_frontend_architecture.md`
5. `/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-web/.context/quality_gates.md`
6. `product.md`

Este repositório deve seguir os mesmos conceitos de engenharia frontend do app mobile,
conforme `/Users/italochagas/Desktop/projetos/auraxis-platform/.context/26_frontend_architecture.md`.

## Direção arquitetural

- Organização baseada em **feature** dentro de `app/features/*`
- Infraestrutura não visual em `app/core/*`
- Elementos compartilhados em `app/shared/*`
- Composables raiz apenas como façade/entrypoint, não como acúmulo de regra de negócio
- UI deve usar Naive UI e wrappers internos; evitar HTML cru em fluxos de produto
- Regras de negócio ficam no backend; frontend orquestra, apresenta e valida na fronteira

## Estrutura alvo

```text
app/
  core/
    http/           ← cliente HTTP centralizado (Axios + interceptor)
    session/        ← facade de sessão (re-exporta useSessionStore)
    errors/         ← ApiError e helpers de diagnóstico
    config/         ← wrappers tipados de useRuntimeConfig()
    observability/  ← Sentry thin-wrappers (captureException, addBreadcrumb)
  features/
    auth/           ← login, registro, recuperação (contracts, api, model, queries, components)
    dashboard/      ← visão financeira com períodos
    transactions/   ← lançamentos, importação, reconciliação
    goals/          ← metas financeiras
    wallet/         ← patrimônio e evolução
    tools/          ← ferramentas públicas e autenticadas
  shared/
    components/     ← componentes reutilizáveis entre features
    types/          ← tipos compartilhados (incluindo gerados por openapi)
    validators/     ← validadores puros
    utils/          ← utilitários puros
    feature-flags/  ← resolução de flags por provider
  composables/      ← facades finas (entrypoint de query/mutation por domínio)
  components/       ← componentes globais de UI
  theme/
  types/
```

## Classes vs funções puras

Use **classes** para:

- API clients (ex: `DashboardOverviewClient`)
- Mappers/adapters (ex: `DashboardOverviewMapper`)
- Policies e resolvers com estado ou injeção de dependência
- Serviços de orquestração não visuais

Use **funções puras / composables** para:

- Composables de UI (`useWalletSummaryQuery`, `useDashboardPeriod`)
- Utilitários (`formatCurrency`, `getMonthLabel`)
- Validadores puros
- Componentes Vue (sempre SFC)

> Regra de ouro: **se você precisa de `new`, use classe; se é só entrada → saída, use função.**

## Plano de migração incremental

A migração é **incremental e sem big-bang**:

1. **Novas features nascem** dentro de `app/features/<domain>/`.
2. **Features existentes migram** quando forem tocadas por uma task real — não por refactor isolado.
3. Ordem preferida de migração: `wallet` → `tools` → `auth` → `transactions` → `goals`.
4. `app/composables/*` permanece como facade/entrypoint até que a feature correspondente
   esteja completa em `app/features/*`. Após migração, o composable vira re-export fino ou é removido.
5. `app/utils/*` e `app/types/*` migram para `app/shared/*` gradualmente conforme são tocados.
6. Nunca quebrar testes existentes como consequência de refactor estrutural.

> **Falha em qualquer gate = não commitar.**
> Se o bloqueio é dependência de outro time, registrar no GitHub Projects/issue do
> bloco e deixar o motivo explícito no handoff local.

## Regras operacionais

- GitHub Projects é a fonte de verdade de backlog.
- Não usar `tasks.md`.
- Toda integração de contrato deve ter:
  - tipo DTO
  - mapper/adaptador
  - testes de contrato da fronteira
- Placeholders só são aceitáveis em estado explicitamente transitório; não no fluxo nominal.
- Sessão/autenticação precisa ser resiliente a refresh e navegação.

## Qualidade

- `pnpm quality-check` antes de commit
- `pnpm build` deve permanecer verde
- testes obrigatórios para stores, adapters e contratos
- mudanças de arquitetura devem ser pequenas, reversíveis e por feature
