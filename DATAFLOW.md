# Data Flow - auraxis-web

## Credit Card Launch

1. User opens `CreditCardExpenseDrawer` from `/credit-cards` or `/credit-cards/[id]`.
2. Drawer collects `Data da compra`, amount, card, category/account, installments and `impact_policy`.
3. `billing-cycle.ts` computes the local preview:
   - `Cai na fatura de ...`
   - closing date
   - due date
   - cycle start/end
4. Drawer submits `POST /transactions` with:
   - `type: "expense"`
   - `due_date` = purchase date
   - `credit_card_id`
   - `impact_policy`
   - optional installment fields.
5. On success, the page invalidates `credit-cards`, `transactions` and `dashboard` query families.

## Credit Card Dashboard

1. `/credit-cards/[id]` loads card list and selects the route card id.
2. It fetches:
   - `GET /credit-cards/:id/bill?month=YYYY-MM`
   - `GET /credit-cards/:id/utilization`
3. `CreditCardDashboard` renders:
   - KPIs from bill/utilization/card DTO.
   - charts from bill totals and impact buckets.
   - analytical blocks for real free limit, post-closing purchases and budget risk.

## Known Data Gap

The bill endpoint does not yet expose structured category/tag labels. The current categories tab starts with operational buckets by impact policy. Rich category analytics should be backed by API aggregates or `GET /transactions?credit_card_id=...` enrichment.
