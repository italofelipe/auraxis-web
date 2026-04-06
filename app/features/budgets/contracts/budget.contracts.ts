export type BudgetPeriod = "monthly" | "weekly" | "custom";

export type BudgetDto = {
  readonly id: string;
  readonly name: string;
  readonly amount: string; // Decimal as string from API
  readonly spent: string;
  readonly remaining: string;
  readonly percentage_used: number;
  readonly period: BudgetPeriod;
  readonly start_date: string | null;
  readonly end_date: string | null;
  readonly tag_id: string | null;
  readonly tag_name: string | null;
  readonly tag_color: string | null;
  readonly is_active: boolean;
  readonly is_over_budget: boolean;
  readonly created_at: string;
  readonly updated_at: string;
};

export type BudgetSummaryDto = {
  readonly total_budgeted: string;
  readonly total_spent: string;
  readonly total_remaining: string;
  readonly percentage_used: number;
  readonly budget_count: number;
};

export type CreateBudgetPayload = {
  readonly name: string;
  readonly amount: string;
  readonly period?: BudgetPeriod;
  readonly tag_id?: string | null;
  readonly start_date?: string | null; // YYYY-MM-DD
  readonly end_date?: string | null; // YYYY-MM-DD
};

export type UpdateBudgetPayload = Partial<CreateBudgetPayload> & {
  readonly is_active?: boolean;
};
