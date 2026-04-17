/**
 * Domain model for the Orçamento 50/30/20 calculator (#624).
 *
 * Distributes net income into Needs (50%), Wants (30%), Investments (20%).
 * Supports simple mode (just income) and detailed mode (income + actual expenses).
 */

import { round2 } from "./math-utils";

export const ORCAMENTO_PUBLIC_PATH = "/tools/orcamento-50-30-20";

// ─── Categories ──────────────────────────────────────────────────────────────

export type BudgetCategory = "needs" | "wants" | "investments";

export const BUDGET_RULES: Record<BudgetCategory, number> = {
  needs: 0.50,
  wants: 0.30,
  investments: 0.20,
};

// ─── Form state ──────────────────────────────────────────────────────────────

export type OrcamentoMode = "simple" | "detailed";

export interface OrcamentoFormState extends Record<string, unknown> {
  netIncome: number | null;
  mode: OrcamentoMode;
  actualNeeds: number;
  actualWants: number;
  actualInvestments: number;
}

/**
 * @returns Default budget form state.
 */
export function createDefaultOrcamentoFormState(): OrcamentoFormState {
  return {
    netIncome: null,
    mode: "simple",
    actualNeeds: 0,
    actualWants: 0,
    actualInvestments: 0,
  };
}

// ─── Validation ──────────────────────────────────────────────────────────────

export interface OrcamentoValidationError {
  field: keyof OrcamentoFormState;
  messageKey: string;
}

/**
 * @param form
 * @returns Validation errors, if any.
 */
export function validateOrcamentoForm(
  form: OrcamentoFormState,
): OrcamentoValidationError[] {
  const errors: OrcamentoValidationError[] = [];

  if (form.netIncome === null || form.netIncome <= 0) {
    errors.push({ field: "netIncome", messageKey: "errors.incomeRequired" });
  }

  return errors;
}

// ─── Result ──────────────────────────────────────────────────────────────────

export interface BudgetSlice {
  category: BudgetCategory;
  idealAmount: number;
  idealPct: number;
  actualAmount: number | null;
  actualPct: number | null;
  deviationPct: number | null;
  alert: boolean;
}

export interface OrcamentoResult {
  netIncome: number;
  slices: BudgetSlice[];
  totalActual: number | null;
  surplus: number | null;
}

// ─── Calculation ─────────────────────────────────────────────────────────────

const ALERT_THRESHOLD = 10;

/**
 * @param form
 * @returns Budget breakdown result.
 */
export function calculateOrcamento(form: OrcamentoFormState): OrcamentoResult {
  const income = form.netIncome ?? 0;
  const isDetailed = form.mode === "detailed";

  const categories: BudgetCategory[] = ["needs", "wants", "investments"];

  const actuals: Record<BudgetCategory, number> = {
    needs: form.actualNeeds,
    wants: form.actualWants,
    investments: form.actualInvestments,
  };

  const slices: BudgetSlice[] = categories.map((cat) => {
    const idealPct = BUDGET_RULES[cat] * 100;
    const idealAmount = round2(income * BUDGET_RULES[cat]);
    const actualAmount = isDetailed ? round2(actuals[cat]) : null;
    const actualPct = isDetailed && income > 0
      ? round2((actuals[cat] / income) * 100)
      : null;
    const deviationPct = actualPct !== null ? round2(actualPct - idealPct) : null;
    const alert = deviationPct !== null && Math.abs(deviationPct) > ALERT_THRESHOLD;

    return { category: cat, idealAmount, idealPct, actualAmount, actualPct, deviationPct, alert };
  });

  const totalActual = isDetailed
    ? round2(form.actualNeeds + form.actualWants + form.actualInvestments)
    : null;
  const surplus = totalActual !== null ? round2(income - totalActual) : null;

  return { netIncome: income, slices, totalActual, surplus };
}
