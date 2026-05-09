/**
 * Domain model for the Custo do Estilo de Vida calculator (#627).
 *
 * Calculates the opportunity cost of recurring expenses over a
 * given time horizon if invested instead. Supports URL query param
 * encoding for viral sharing.
 */

import { round2 } from "./math-utils";

export const CUSTO_ESTILO_VIDA_PUBLIC_PATH = "/tools/custo-estilo-vida";

// ─── Constants ───────────────────────────────────────────────────────────────

/** Default annual CDI/Selic return rate (%). */
export const DEFAULT_ANNUAL_RETURN_PCT = 12;

/** Default IPCA inflation rate for real-return adjustment (%). */
export const DEFAULT_IPCA_PCT = 4;

// ─── Expense entry ───────────────────────────────────────────────────────────

export interface RecurringExpense {
  name: string;
  monthlyAmount: number;
}

// ─── Form state ──────────────────────────────────────────────────────────────

export interface CustoEstiloVidaFormState extends Record<string, unknown> {
  expenses: RecurringExpense[];
  annualReturnPct: number;
  horizonYears: number;
}

/**
 * @returns A blank expense entry.
 */
export function createDefaultExpense(): RecurringExpense {
  return { name: "", monthlyAmount: 0 };
}

/**
 * @returns Default form state with two blank expenses.
 */
export function createDefaultCustoEstiloVidaFormState(): CustoEstiloVidaFormState {
  return {
    expenses: [createDefaultExpense(), createDefaultExpense()],
    annualReturnPct: DEFAULT_ANNUAL_RETURN_PCT,
    horizonYears: 10,
  };
}

// ─── Validation ──────────────────────────────────────────────────────────────

export interface CustoEstiloVidaValidationError {
  field: string;
  messageKey: string;
}

/**
 * @param form
 * @returns Validation errors, if any.
 */
export function validateCustoEstiloVidaForm(
  form: CustoEstiloVidaFormState,
): CustoEstiloVidaValidationError[] {
  const errors: CustoEstiloVidaValidationError[] = [];

  const hasValidExpense = form.expenses.some((e) => e.monthlyAmount > 0);
  if (!hasValidExpense) {
    errors.push({ field: "expenses", messageKey: "errors.atLeastOneExpenseRequired" });
  }

  if (form.horizonYears < 1) {
    errors.push({ field: "horizonYears", messageKey: "errors.horizonRequired" });
  }

  return errors;
}

// ─── Opportunity cost per single expense ─────────────────────────────────────

export interface OpportunityCostDetail {
  directCost: number;
  investedValue: number;
  realReturn: number;
}

export interface OpportunityCostOptions {
  /** Investment horizon in years. */
  horizon: number;
  /** Annual return rate as a percentage (e.g. 12 for 12%). */
  rate: number;
  /** Annual inflation rate as a percentage. Defaults to DEFAULT_IPCA_PCT. */
  ipcaPct?: number;
}

/**
 * Calculates the opportunity cost for a single recurring expense.
 * @param expense Recurring expense with a monthly amount.
 * @param options Calculation options: horizon, rate, and optional ipcaPct.
 * @returns Direct cost, nominal invested value, and real (inflation-adjusted) return.
 */
export function calculateOpportunityCost(
  expense: RecurringExpense,
  options: OpportunityCostOptions,
): OpportunityCostDetail {
  const { horizon, rate, ipcaPct = DEFAULT_IPCA_PCT } = options;
  const totalMonths = horizon * 12;
  const monthlyRate = Math.pow(1 + rate / 100, 1 / 12) - 1;
  const directCost = round2(expense.monthlyAmount * totalMonths);

  let investedValue: number;
  if (monthlyRate === 0) {
    investedValue = round2(expense.monthlyAmount * totalMonths);
  } else {
    investedValue = round2(expense.monthlyAmount * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate));
  }

  const cumulativeInflation = Math.pow(1 + ipcaPct / 100, horizon);
  const realReturn = round2(investedValue / cumulativeInflation);

  return { directCost, investedValue, realReturn };
}

// ─── Equivalences ────────────────────────────────────────────────────────────

export interface EquivalenceItem {
  label: string;
  quantity: number;
}

/**
 * Generates a set of didactic equivalences for a given invested value.
 * @param investedValue Total nominal future value if invested.
 * @returns List of equivalence items with a label and quantity (filtered to ≥ 1).
 */
export function calculateEquivalences(investedValue: number): EquivalenceItem[] {
  return [
    { label: "viagens internacionais (R$ 8.000 cada)", quantity: Math.floor(investedValue / 8000) },
    { label: "meses sem trabalhar (salário R$ 5.000)", quantity: Math.floor(investedValue / 5000) },
    { label: "anos de ensino universitário (R$ 25.000/ano)", quantity: Math.floor(investedValue / 25000) },
    { label: "cafezinhos (R$ 6 cada)", quantity: Math.floor(investedValue / 6) },
  ].filter((e) => e.quantity >= 1);
}

// ─── Result ──────────────────────────────────────────────────────────────────

export interface ExpenseOpportunityCost {
  name: string;
  monthlyAmount: number;
  annualCost: number;
  opportunityCost: number;
  /** Nominal future value if invested. */
  investedValue: number;
  /** Inflation-adjusted (real) return. */
  realReturn: number;
}

export interface CustoEstiloVidaResult {
  totalMonthlyCost: number;
  totalAnnualCost: number;
  totalOpportunityCost: number;
  expenses: ExpenseOpportunityCost[];
  horizonYears: number;
  /** Equivalence cards for a viral/didactic display. */
  equivalences: EquivalenceItem[];
}

// ─── Calculation ─────────────────────────────────────────────────────────────

/**
 * @param monthlyPayment
 * @param monthlyRate
 * @param months
 * @returns Future value of the annuity.
 */
function futureValueOfAnnuity(monthlyPayment: number, monthlyRate: number, months: number): number {
  if (monthlyRate === 0) { return monthlyPayment * months; }
  return monthlyPayment * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
}

/**
 * @param form
 * @returns Opportunity cost result.
 */
export function calculateCustoEstiloVida(
  form: CustoEstiloVidaFormState,
): CustoEstiloVidaResult {
  const monthlyRate = Math.pow(1 + form.annualReturnPct / 100, 1 / 12) - 1;
  const totalMonths = form.horizonYears * 12;
  const cumulativeInflation = Math.pow(1 + DEFAULT_IPCA_PCT / 100, form.horizonYears);

  const validExpenses = form.expenses.filter((e) => e.monthlyAmount > 0);

  const expenses: ExpenseOpportunityCost[] = validExpenses.map((e) => {
    const annualCost = round2(e.monthlyAmount * 12);
    const investedValue = round2(futureValueOfAnnuity(e.monthlyAmount, monthlyRate, totalMonths));
    const opportunityCost = investedValue;
    const realReturn = round2(investedValue / cumulativeInflation);
    return {
      name: e.name || "Sem nome",
      monthlyAmount: round2(e.monthlyAmount),
      annualCost,
      opportunityCost,
      investedValue,
      realReturn,
    };
  });

  const totalMonthlyCost = round2(expenses.reduce((s, e) => s + e.monthlyAmount, 0));
  const totalAnnualCost = round2(totalMonthlyCost * 12);
  const totalOpportunityCost = round2(expenses.reduce((s, e) => s + e.opportunityCost, 0));
  const equivalences = calculateEquivalences(totalOpportunityCost);

  return {
    totalMonthlyCost,
    totalAnnualCost,
    totalOpportunityCost,
    expenses,
    horizonYears: form.horizonYears,
    equivalences,
  };
}

// ─── URL sharing ─────────────────────────────────────────────────────────────

/**
 * @param form
 * @returns Base64-encoded query string.
 */
export function encodeFormToQuery(form: CustoEstiloVidaFormState): string {
  const data = {
    e: form.expenses.filter((e) => e.monthlyAmount > 0).map((e) => ({
      n: e.name,
      v: e.monthlyAmount,
    })),
    r: form.annualReturnPct,
    h: form.horizonYears,
  };
  return btoa(JSON.stringify(data));
}

/**
 * @param encoded
 * @returns Decoded form state or null if invalid.
 */
export function decodeQueryToForm(encoded: string): Partial<CustoEstiloVidaFormState> | null {
  try {
    const data = JSON.parse(atob(encoded)) as {
      e?: Array<{ n: string; v: number }>;
      r?: number;
      h?: number;
    };
    if (!data.e || !Array.isArray(data.e)) { return null; }
    return {
      expenses: data.e.map((e) => ({ name: e.n, monthlyAmount: e.v })),
      annualReturnPct: data.r ?? DEFAULT_ANNUAL_RETURN_PCT,
      horizonYears: data.h ?? 10,
    };
  } catch {
    return null;
  }
}
