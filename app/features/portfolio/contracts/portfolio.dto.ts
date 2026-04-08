export type WalletEntryDto = {
  readonly id: string;
  readonly name: string;
  readonly ticker: string | null;
  readonly quantity: number | null;
  readonly current_value: number;
  readonly cost_basis: number | null;
  readonly register_date: string;
  readonly change_percent: number | null;
  readonly asset_type: "stock" | "fii" | "crypto" | "fixed_income" | "other";
  /**
   * True when the entry has a ticker but change_percent could not be retrieved
   * from the quote provider (BRAPI). Derived field — not stored on the backend.
   */
  readonly stale_quote?: boolean;
};

export type PortfolioSummaryDto = {
  readonly total_value: number;
  readonly total_cost: number;
  readonly day_change_percent: number | null;
  readonly total_return_percent: number | null;
  readonly asset_count: number;
};
