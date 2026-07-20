# Architecture - auraxis-web

## Unified User Backoffice

`/admin/users` is an operational control-plane UI backed exclusively by the FastAPI v2
admin contract. Route authorization is not inferred from JWT roles: the asynchronous
middleware calls `GET /v2/admin/session`, and the backend validates the token, JTI and
configured administrator allowlist.

The dedicated client in `app/features/admin/shared/admin-http.ts` targets
`NUXT_PUBLIC_API_V2_BASE`, attaches the current bearer token and, for legacy v1 sessions,
uses the existing v1 refresh-cookie flow after a 401. The list is cursor-based and each
mutation receives a fresh `Idempotency-Key`. `web.admin.user-mutations` controls only the
visibility of mutation controls; server-side authorization is always authoritative.

See `docs/web/unified-user-backoffice.md` for the contract, rollout and operational checks.

## Credit Cards Hybrid Experience

The credit-card area is implemented as a hybrid workspace:

- `/credit-cards` is the operational card workspace. It defaults to `Faturas`, with a rail for card selection, a statement panel and an analytical summary mode.
- `/credit-cards/[id]` is the single-card dashboard. It reuses the statement/analytics views scoped to the route card id.
- `CreditCardExpenseModal` is the canonical card-expense editor/launcher for statement rows. It follows the existing `EditTransactionModal` form pattern and always persists through the transactions resource.

Core components:

- `app/features/credit-cards/components/FaturasView.vue`
- `app/features/credit-cards/components/AnaliticoView.vue`
- `app/features/credit-cards/components/CreditCardExpenseModal.vue`
- `app/features/credit-cards/model/credit-card-statement.ts`
- `app/features/credit-cards/utils/transaction-billing.ts`
- `app/features/credit-cards/utils/billing-cycle.ts`

Transactions remain the canonical source of truth. A card expense is a `TransactionDto` with `credit_card_id` filled. Card statements list enriched transactions filtered by `credit_card_id` plus bill month; create, edit, duplicate and delete actions call the same transaction mutations used by the Transactions surface. The statement total and item count are derived from those transaction rows, not from a separate card-expense entity.

## Impact Policy Contract

Card launches send `impact_policy` through `CreateTransactionPayload`:

- `full`: reflects in cards, transactions, dashboard and budgets.
- `cards_only`: reflects in cards/bill/utilization, but is ignored by budget and dashboard aggregates.
- `planned_until_bill`: kept as a planning policy for bill-aware workflows.

The web client supports `credit_card_id` in transaction list filters so card-specific dashboards can evolve toward richer analytics without changing the canonical transaction contract.
