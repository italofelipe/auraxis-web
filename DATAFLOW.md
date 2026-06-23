# Data Flow - auraxis-web

## Credit Card Statement Expense Management

1. `/credit-cards` and `/credit-cards/[id]` load card DTOs and the transaction list window used by `useCreditCardsStatement`.
2. `transaction-billing.ts` enriches transactions that have `credit_card_id`, resolves the bill month through the card cycle and exposes the original `TransactionDto` on each statement row.
3. `credit-card-statement.ts` filters enriched transactions by selected card and bill month. The statement `total`, `itemCount`, category groups and row list are derived from those transactions.
4. User actions on statement rows use the transactions resource:
   - `Ver detalhes / Editar` opens `CreditCardExpenseModal` with the row's source transaction.
   - `Nova despesa` opens the same modal with the current statement card preselected.
   - Saving creates or updates `POST/PATCH /transactions` with `type: "expense"` and `credit_card_id`.
   - Duplicating calls `POST /transactions` with `buildDuplicatePayload`, preserving `credit_card_id` and suffixing the title with ` (cópia)`.
   - Removing confirms that the item leaves both the bill and Transactions, then calls `DELETE /transactions/:id?scope=occurrence`.
5. On success, the page invalidates `credit-cards`, `transactions` and `dashboard` query families and shows the statement-specific toast.

## Credit Card Dashboard

1. `/credit-cards/[id]` loads card list and selects the route card id.
2. It fetches:
   - `GET /credit-cards/:id/bill?month=YYYY-MM`
   - `GET /credit-cards/:id/utilization`
3. `FaturasView` and `AnaliticoView` render statement and analytical data derived from synchronized transactions plus card DTOs.

## Known Data Gap

The bill endpoint does not yet expose structured category/tag labels. The current statement categories are enriched on the client from synchronized transactions and tags. Richer cross-card analytics should eventually be backed by API aggregates or a first-class `GET /transactions?credit_card_id=...` aggregate endpoint.
