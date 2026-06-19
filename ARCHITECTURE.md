# Architecture - auraxis-web

## Credit Cards Hybrid Experience

The credit-card area is implemented as a hybrid workspace:

- `/credit-cards` is the operational list. It defaults to a table-like view, with optional detailed cards and an analytical summary mode.
- `/credit-cards/[id]` is the card dashboard. It uses a less dense layout, larger charts, and tabs for `Visão geral`, `Fatura`, `Categorias`, `Parcelamentos`, `Benefícios` and `Analítico`.
- `CreditCardExpenseDrawer` is the card-specific transaction launcher. It replaces the dense modal for card launches and can be opened globally without requiring a pre-selected card.

Core components:

- `app/features/credit-cards/components/CreditCardsTable.vue`
- `app/features/credit-cards/components/CreditCardDashboard.vue`
- `app/features/credit-cards/components/CreditCardExpenseDrawer.vue`
- `app/features/credit-cards/utils/billing-cycle.ts`

Transactions remain the canonical source of truth. Card screens consume card DTOs, bill/utilization endpoints and transaction creation APIs; they do not create a separate "card expense" model in the frontend.

## Impact Policy Contract

Card launches send `impact_policy` through `CreateTransactionPayload`:

- `full`: reflects in cards, transactions, dashboard and budgets.
- `cards_only`: reflects in cards/bill/utilization, but is ignored by budget and dashboard aggregates.
- `planned_until_bill`: kept as a planning policy for bill-aware workflows.

The web client supports `credit_card_id` in transaction list filters so card-specific dashboards can evolve toward richer analytics without changing the canonical transaction contract.
