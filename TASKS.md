# TASKS.md — auraxis-web

Última atualização: 2026-03-27

## Legenda

| Símbolo | Significado |
| :------ | :---------- |
| `[ ]`   | Todo        |
| `[~]`   | In Progress |
| `[!]`   | Blocked     |
| `[x]`   | Done        |

**Prioridade:** P0 = bloqueante / P1 = alta / P2 = normal / P3 = baixa

---

## Ciclo WF — Foundation Layer (base reutilizável)

> Construir a infraestrutura de código compartilhada antes dos módulos de negócio.
> Toda task WI (integração) depende das WF correspondentes.

### P1

- [ ] **WF1** `feat` — Interceptors HTTP globais e tipos base (ApiResponse, PaginatedResponse)
  - Critério: interceptor 401→logout, 403→toast de permissão, 500→toast genérico; tipos `ApiResponse<T>` e `PaginatedResponse<T>` exportados de `app/core/api/`; zero duplicação com `createHttpClient` existente.
  - Dependência: nenhuma
  - Risco residual: baixo — extensão aditiva do client existente

- [ ] **WF2** `feat` — Factories createApiQuery e createApiMutation
  - Critério: `createApiQuery(key, fetcher, opts?)` retorna `useQuery` configurado com skeleton automático, retry em 500, e error normalization; `createApiMutation(fn, opts?)` retorna `useMutation` com toast de sucesso/erro built-in e invalidação declarativa; ambos com 100% de cobertura de testes; exportados de `app/core/query/`.
  - Dependência: WF1
  - Risco residual: baixo

- [ ] **WF3** `feat` — Utils globais: date, number, string, validators pt-BR
  - Critério: `formatDate`, `formatRelativeTime`, `formatDateRange` em `app/utils/date.ts`; `formatPercentage`, `formatDecimal`, `clamp` em `app/utils/number.ts`; `truncate`, `capitalize` em `app/utils/string.ts`; `isCPF`, `isCNPJ`, `isPhone` em `app/utils/validators.ts`; todos com unit tests.
  - Dependência: nenhuma
  - Risco residual: baixo

- [ ] **WF4** `feat` — Zod schemas reutilizáveis (CPF, CNPJ, telefone, moeda, data, paginação)
  - Critério: `cpfSchema`, `cnpjSchema`, `phoneSchema`, `currencySchema`, `dateSchema`, `paginationParamsSchema` exportados de `app/core/validation/schemas/`; unit tests para cada schema; prontos para importação em formulários VeeValidate.
  - Dependência: WF3
  - Risco residual: baixo

- [ ] **WF5** `feat` — Stores Pinia: ui.ts (sidebar, theme, modal stack) e filters.ts (filtros globais reativos)
  - Critério: `useUiStore` gerencia `sidebarCollapsed`, `activeTheme`, `modalStack` com `pushModal`/`popModal`; `useFiltersStore` expõe filtros reativos com `debounce` e `syncWithQueryString`; ambos com `persist: true` onde aplicável; testes unitários cobrindo actions e getters.
  - Dependência: nenhuma
  - Risco residual: baixo

### P2

- [ ] **WF6** `feat` — Composables de infraestrutura: useToast, usePagination, useFilters, useConfirm, useErrorBoundary
  - Critério: `useToast` wrappa `$message` do NaiveUI com API padronizada `(type, message, duration?)`; `usePagination` gerencia `page/limit/total` reativos com `nextPage`, `prevPage`, `reset`; `useFilters` gerencia estado + debounce + sync com query string; `useConfirm` retorna dialog de confirmação reutilizável via `$dialog` NaiveUI; `useErrorBoundary` normaliza `ApiError` → mensagem amigável pt-BR; todos com testes.
  - Dependência: WF1, WF5
  - Risco residual: baixo

- [ ] **WF7** `feat` — Shared UI Kit: UiConfirmDialog, UiFilterBar, UiPagination, UiStatusBadge, UiCurrencyDisplay
  - Critério: `UiConfirmDialog` encapsula NModal de confirmação (title, message, onConfirm, loading); `UiFilterBar` combina NInput + NSelect + NDatePicker com props padronizadas; `UiPagination` wrappa NPagination com page/pageSize/total; `UiStatusBadge` mapeia status strings para NTag com cores semânticas; `UiCurrencyDisplay` usa `formatCurrency` com cor condicional (positivo/negativo); todos com stories Storybook e unit tests.
  - Dependência: WF3, WF6
  - Risco residual: baixo

---

## Ciclo WI — Integração mock → API real

> Substituir dados mockados por queries e mutations reais em cada página.
> Todas dependem de WF1 e WF2 concluídos.

### P1

- [ ] **WI1** `feat` — Integração goals.vue → GET /goals
  - Critério: `app/features/goals/api/goals-api.ts` com `getGoals()`; `use-goals-query.ts` via `createApiQuery`; página `goals.vue` sem referência a `MOCK_GOALS`; skeleton visível durante loading; empty state com mensagem correta.
  - Dependência: WF1, WF2
  - Risco residual: médio — endpoint ainda não validado em staging

- [ ] **WI2** `feat` — Integração portfolio.vue → GET /wallet
  - Critério: `portfolio-api.ts` com `getPortfolio()`; `use-portfolio-query.ts`; `PortfolioSummaryBar` e `PortfolioTable` exibem dados reais; skeleton no loading; empty state se carteira vazia.
  - Dependência: WF1, WF2
  - Risco residual: médio

- [ ] **WI3** `feat` — Integração alerts.vue → GET /alerts + PATCH /alerts/:id/read + DELETE /alerts/:id
  - Critério: `alerts-api.ts` com `getAlerts`, `markAsRead`, `markAllAsRead`, `deleteAlert`; mutations com optimistic update (sem re-fetch completo ao marcar lido); `queryClient.invalidateQueries(['alerts'])` no delete; testes para cada mutation.
  - Dependência: WF1, WF2, WF6 (useConfirm para delete)
  - Risco residual: médio — optimistic update requer rollback em falha

- [ ] **WI4** `feat` — Integração simulations.vue → GET /simulations + DELETE /simulations/:id
  - Critério: `simulations-api.ts`; `use-simulations-query.ts` + `use-delete-simulation-mutation.ts`; dialog de confirmação antes do delete via `useConfirm`; invalidação automática após delete.
  - Dependência: WF1, WF2, WF6
  - Risco residual: baixo

### P2

- [ ] **WI5** `feat` — Integração shared-entries.vue → GET /shared-entries + DELETE /shared-entries/:id (revoke)
  - Critério: `shared-entries-api.ts` com `getSharedByMe`, `getSharedWithMe`, `revokeSharedEntry`; 2 queries separadas (1 por aba); mutation de revoke com confirmação; invalidação de ambas as queries no sucesso.
  - Dependência: WF1, WF2, WF6
  - Risco residual: baixo

- [ ] **WI6** `feat` — Integração subscription.vue → GET /subscriptions/me + GET /subscriptions/plans + POST /subscriptions/checkout
  - Critério: `subscription-api.ts` com os 3 endpoints; `use-subscription-query.ts` + `use-plans-query.ts` + `use-checkout-mutation.ts`; `onSuccess` do checkout redireciona para URL de pagamento retornada pela API; trata estados `active`, `trialing`, `past_due`, `canceled` com NAlert semântico.
  - Dependência: WF1, WF2
  - Risco residual: alto — fluxo de pagamento externo (Stripe/Iugu), URL de checkout variável por ambiente

---

## Ciclo WB — Bug Fixes e Completude de UI

### P0

- [ ] **WB1** `fix` — Corrigir plans.vue (referência quebrada) e implementar tools.vue (hub NaiveUI)
  - Critério: `plans.vue` removido ou redirecionado para `subscription.vue` (sem referência ao caminho antigo de PlanCard); `tools.vue` implementado com NGrid de NCards clicáveis para sub-ferramentas (installment-vs-cash existente + placeholders para futuras); zero elementos HTML puros (`<h1>`, `<input>`, etc.); responsivo em 375px, 768px, 1280px.
  - Dependência: nenhuma
  - Risco residual: baixo
