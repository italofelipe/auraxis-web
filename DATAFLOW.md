# Data Flow - auraxis-web

## Unified User Backoffice

1. The `/admin` middleware restores the normal authenticated session when necessary and
   validates the operator with `GET /v2/admin/session`.
2. `/admin/users` requests a federated page from `GET /v2/admin/users` using filters and an
   opaque cursor; no numeric page state is synthesized by the browser.
3. Selecting a row loads `GET /v2/admin/users/{source}/{user_id}`, including all safely
   linked identities, subscription/override state and recent audit actions.
4. When `web.admin.user-mutations` is enabled, each confirmation submits an 8–500 character
   reason, an optional future premium expiry and a unique `Idempotency-Key`.
5. A `200` action is immediately applied. A `202` action remains `pending` or `partial`; the
   UI shows that durable state and reloads the detail/audit data without claiming completion.
6. A 401 from v2 triggers one refresh through the v1 httpOnly-cookie endpoint, then retries
   with the new in-memory bearer token. A failed refresh returns the operator to login.

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

## Statement Import (PDF)

1. The user picks a destination account. This comes first because a statement
   reconciles against one account, and the duplicate check compares each line
   against what already exists in it.
2. `POST /v2/bank-import/statements/upload` (multipart: file + `account_id`)
   returns the full preview. Nothing is created.
3. The preview is rendered as-is: totals with transfers reported apart from
   income and expense, filters by duplicate status and nature, and one row per
   line showing what the bank wrote, what the system concluded and why.
4. Each row's action can be toggled, or resolved through the duplicate modal
   (use the existing transaction, import anyway, ignore).
5. Confirmation is disabled while any conflict is undecided.
6. `POST /v2/bank-import/statements/{token}/confirm` sends one decision per
   line. Lines with no action are omitted — silence is not consent.
7. The result reports created, linked and ignored, plus any line the ledger
   refused; those keep no fingerprint and stay re-importable.

## Account Loading in the Import Flow

`useAccountsQuery` is consumed directly from `features/accounts`, following
the precedent already set by `credit-cards` and `transactions`. The picker
guards the payload with `Array.isArray`: a `.map` over an unexpected shape
throws and takes the whole screen with it, leaving the user with no picker, no
upload and no explanation.
