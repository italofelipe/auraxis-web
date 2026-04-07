/**
 * Contracts for GET /transactions/due-range
 *
 * Issue: #545 (parent PROD-14), #580
 */

/** Single transaction item returned by the due-range endpoint. */
export interface DueTransactionDto {
  readonly id: string;
  readonly title: string;
  readonly amount: string;
  readonly type: "income" | "expense";
  readonly due_date: string;
  readonly status: "pending" | "paid" | "overdue" | "postponed" | "cancelled";
  readonly tag_id: string | null;
  readonly account_id: string | null;
  readonly credit_card_id: string | null;
  readonly is_recurring: boolean;
}

/** Counts breakdown returned alongside the paginated list. */
export interface DueRangeCountsDto {
  readonly total: number;
  readonly overdue: number;
  readonly pending: number;
}

/** Full response envelope from GET /transactions/due-range. */
export interface DueRangeResponseDto {
  readonly transactions: DueTransactionDto[];
  readonly total: number;
  readonly page: number;
  readonly per_page: number;
  readonly counts: DueRangeCountsDto;
}

/** Query parameters accepted by the client. */
export interface DueRangeFilters {
  /** ISO date string YYYY-MM-DD (defaults to today). */
  readonly start_date?: string;
  /** ISO date string YYYY-MM-DD (defaults to today + 30d). */
  readonly end_date?: string;
  /** Ordering strategy. */
  readonly order_by?: "overdue_first" | "date" | "title";
  readonly page?: number;
  readonly per_page?: number;
}
