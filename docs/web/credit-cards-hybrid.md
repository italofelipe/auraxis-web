# Credit Cards Hybrid UI

## Decision

Credit cards are now a first-class private workspace. The web implementation follows the approved hybrid proposal:

- table-first operational list;
- optional detailed card grid;
- analytical summary mode;
- less dense single-card dashboard;
- statement rows managed through the canonical transaction modal.

## UX Rules

- The card workspace defaults to `Faturas`.
- The user can launch a card expense globally; the current statement card is preselected when available.
- A card expense is not a separate frontend entity. It is a transaction with `credit_card_id`.
- Statement rows expose edit, duplicate and remove actions. Clicking the row title opens the same modal as the edit icon.
- Removing a statement row must warn that the transaction disappears from both the bill and Transactions.
- Statement total and item count are derived from synchronized transaction rows.
- The dashboard should avoid packing all metrics into one viewport. KPIs, charts and analytics are split into large sections/tabs.

## Task Breakdown

Completed in this implementation:

- Add frontend billing-cycle helper and tests.
- Add transaction `impact_policy` and `credit_card_id` filter typing.
- Add `CreditCardExpenseModal` for new/edit statement expenses.
- Add `CreditCardsTable`.
- Add `CreditCardDashboard`.
- Replace `/credit-cards` grid default with hybrid workspace.
- Replace `/credit-cards/[id]` simple bill view with tabbed dashboard.
- Make statement rows actionable and route create/edit/duplicate/delete through transaction mutations.

Follow-up tasks:

- Add API-backed card analytics endpoint for category/time-series data.
- Add full authenticated Playwright flow for global launch, card launch, installments and impact-policy switching.
- Move category/time-series card analytics to backend aggregates once the API exposes them.
- Add empty-state actions for users without cards.
