/** Status values accepted by the backend for a transaction. */
export type TransactionStatusDto =
  | "pending"
  | "paid"
  | "cancelled"
  | "postponed"
  | "overdue";

/** Transaction type discriminator. */
export type TransactionTypeDto = "income" | "expense";

/**
 * Payload sent to POST /transactions.
 *
 * `amount` is serialised as a decimal string because the backend uses
 * `fields.Decimal(as_string=True)` in TransactionSchema.
 */
export interface CreateTransactionPayload {
  /** Short title for the transaction. */
  readonly title: string;

  /** Positive monetary value as a decimal string (e.g. "150.50"). */
  readonly amount: string;

  /** Whether this represents revenue or an expenditure. */
  readonly type: TransactionTypeDto;

  /** Due date in ISO 8601 format (YYYY-MM-DD). */
  readonly due_date: string;

  /** Optional long-form description. */
  readonly description?: string;

  /** Optional free-text observation / note. */
  readonly observation?: string;

  /** Whether this transaction repeats periodically. Mutually exclusive with installment. */
  readonly is_recurring?: boolean;

  /** Whether this transaction is split into installments. */
  readonly is_installment?: boolean;

  /** Number of installments (1–60). Required when is_installment is true. */
  readonly installment_count?: number;

  /** ISO 4217 currency code. Defaults to "BRL" on the backend. */
  readonly currency?: string;

  /** Current lifecycle status. Defaults to "pending" when omitted. */
  readonly status?: TransactionStatusDto;

  /** Start date for recurring transactions (YYYY-MM-DD). */
  readonly start_date?: string;

  /** End date for recurring transactions (YYYY-MM-DD). */
  readonly end_date?: string;

  /** UUID of the tag/category associated with this transaction. */
  readonly tag_id?: string | null;

  /** UUID of the bank account associated with this transaction. */
  readonly account_id?: string | null;

  /** UUID of the credit card associated with this transaction. */
  readonly credit_card_id?: string | null;
}

/**
 * Single transaction item returned by POST /transactions.
 *
 * The backend wraps the response in `data: { transactions: [...] }` for
 * installment transactions and `data: { transaction: [...] }` for single ones.
 * The service layer normalises both into `TransactionDto[]`.
 */
export interface TransactionDto {
  readonly id: string;
  readonly title: string;
  readonly amount: string;
  readonly type: string;
  readonly due_date: string;
  readonly description: string | null;
  readonly observation: string | null;
  readonly is_recurring: boolean;
  readonly is_installment: boolean;
  readonly installment_count: number | null;
  readonly currency: string;
  readonly status: string;
  readonly start_date: string | null;
  readonly end_date: string | null;
  readonly tag_id: string | null;
  readonly account_id: string | null;
  readonly credit_card_id: string | null;
  readonly installment_group_id: string | null;
  readonly paid_at: string | null;
  readonly created_at: string | null;
  readonly updated_at: string | null;
}
