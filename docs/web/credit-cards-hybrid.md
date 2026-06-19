# Credit Cards Hybrid UI

## Decision

Credit cards are now a first-class private workspace. The web implementation follows the approved hybrid proposal:

- table-first operational list;
- optional detailed card grid;
- analytical summary mode;
- less dense single-card dashboard;
- wide card expense drawer.

## UX Rules

- The card list defaults to `Tabela`.
- The user can launch a card expense globally; selecting a card first is helpful, not required.
- The card-specific launch flow labels the date as `Data da compra`, not due date.
- The drawer must show the predicted bill cycle before submit when the selected card has closing and due days.
- The dashboard should avoid packing all metrics into one viewport. KPIs, charts and analytics are split into large sections/tabs.

## Task Breakdown

Completed in this implementation:

- Add frontend billing-cycle helper and tests.
- Add transaction `impact_policy` and `credit_card_id` filter typing.
- Add `CreditCardExpenseDrawer`.
- Add `CreditCardsTable`.
- Add `CreditCardDashboard`.
- Replace `/credit-cards` grid default with hybrid workspace.
- Replace `/credit-cards/[id]` simple bill view with tabbed dashboard.

Follow-up tasks:

- Add API-backed card analytics endpoint for category/time-series data.
- Add full authenticated Playwright flow for global launch, card launch, installments and impact-policy switching.
- Enrich bill transaction payload with tag/category names.
- Add empty-state actions for users without cards.
