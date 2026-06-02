/**
 * Domain model for the Calculadora de Custo de Vida Regional (PROD-09, #556/#557/#558).
 *
 * Public, login-free growth tool. Compares the user's monthly lifestyle cost
 * against regional averages (IBGE/DIEESE reference data), derives the share of
 * income committed, a sustainability score (0–100), and the years-to-retirement
 * estimate via the 4% rule. Supports URL query encoding for viral sharing.
 *
 * Distinct from `custo-estilo-vida.ts`, which models opportunity cost of spending.
 */

import costOfLivingByUf from "../../../shared/data/cost-of-living-by-uf.json";

import { round2 } from "./math-utils";

export const CUSTO_VIDA_REGIONAL_PUBLIC_PATH = "/tools/custo-de-vida-regional";

/** Annual real (inflation-adjusted) return used for the retirement projection. */
export const DEFAULT_REAL_RETURN_PCT = 4;

/** Safe withdrawal multiplier (4% rule): wealth target = annual cost × 25. */
export const SAFE_WITHDRAWAL_MULTIPLIER = 25;

// ─── Regional dataset ──────────────────────────────────────────────────────

interface RegionalEntry {
  name: string;
  avgIncome: number;
  avgCost: number;
}

const REGIONAL_DATA = (costOfLivingByUf as { data: Record<string, RegionalEntry> }).data;

/** Sorted list of valid UF codes from the dataset. */
export const UF_CODES: readonly string[] = Object.keys(REGIONAL_DATA).sort((a, b) =>
  a.localeCompare(b),
);

/**
 * @param uf UF code (e.g. "SP").
 * @returns The regional entry, or null when the UF is unknown.
 */
export function getRegionalEntry(uf: string): RegionalEntry | null {
  return REGIONAL_DATA[uf] ?? null;
}

// ─── Expense categories ──────────────────────────────────────────────────────

export const EXPENSE_CATEGORY_KEYS = [
  "housing",
  "transport",
  "food",
  "leisure",
  "other",
] as const;

export type ExpenseCategoryKey = (typeof EXPENSE_CATEGORY_KEYS)[number];

// ─── Form state ──────────────────────────────────────────────────────────────

export interface RegionalCostFormState extends Record<string, unknown> {
  uf: string;
  monthlyIncome: number;
  housing: number;
  transport: number;
  food: number;
  leisure: number;
  other: number;
}

/**
 * @returns Default form state (São Paulo, zeroed income and expenses).
 */
export function createDefaultRegionalCostFormState(): RegionalCostFormState {
  return {
    uf: "SP",
    monthlyIncome: 0,
    housing: 0,
    transport: 0,
    food: 0,
    leisure: 0,
    other: 0,
  };
}

// ─── Validation ──────────────────────────────────────────────────────────────

export interface RegionalCostValidationError {
  field: string;
  messageKey: string;
}

/**
 * @param form Current form state.
 * @returns Validation errors, if any.
 */
export function validateRegionalCostForm(
  form: RegionalCostFormState,
): RegionalCostValidationError[] {
  const errors: RegionalCostValidationError[] = [];

  if (!getRegionalEntry(form.uf)) {
    errors.push({ field: "uf", messageKey: "errors.ufRequired" });
  }

  if (!Number.isFinite(form.monthlyIncome) || form.monthlyIncome <= 0) {
    errors.push({ field: "monthlyIncome", messageKey: "errors.incomeRequired" });
  }

  const totalExpenses = EXPENSE_CATEGORY_KEYS.reduce((sum, key) => sum + (form[key] || 0), 0);
  if (!Number.isFinite(totalExpenses) || totalExpenses <= 0) {
    errors.push({ field: "expenses", messageKey: "errors.atLeastOneExpenseRequired" });
  }

  return errors;
}

// ─── Result ────────────────────────────────────────────────────────────────

export interface CategoryBreakdown {
  key: ExpenseCategoryKey;
  amount: number;
  pctOfIncome: number;
  pctOfTotal: number;
}

export interface RegionalComparison {
  uf: string;
  name: string;
  avgIncome: number;
  avgCost: number;
  /** User total cost relative to regional average cost, as a +/- percentage. */
  costVsRegionalPct: number;
  /** User income relative to regional average income, as a +/- percentage. */
  incomeVsRegionalPct: number;
}

export interface RegionalCostResult {
  totalMonthlyCost: number;
  totalAnnualCost: number;
  committedPct: number;
  savingsRatePct: number;
  monthlySavings: number;
  categories: CategoryBreakdown[];
  targetWealth: number;
  yearsToRetirement: number | null;
  regional: RegionalComparison;
  sustainabilityScore: number;
}

/**
 * Clamps a value into the inclusive [min, max] range.
 *
 * @param value Raw value.
 * @param min Lower bound.
 * @param max Upper bound.
 * @returns The clamped value.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Estimates years to financial independence using the 4% rule.
 *
 * Solves the future-value-of-annuity equation for the number of months needed
 * to reach `targetWealth` given monthly contributions invested at a real rate.
 *
 * @param monthlySavings Amount invested each month (must be > 0).
 * @param targetWealth Wealth target (annual cost × 25).
 * @param annualRealReturnPct Annual real return percentage.
 * @returns Years to retirement, or null when savings are non-positive.
 */
export function estimateYearsToRetirement(
  monthlySavings: number,
  targetWealth: number,
  annualRealReturnPct: number = DEFAULT_REAL_RETURN_PCT,
): number | null {
  if (monthlySavings <= 0 || targetWealth <= 0) {
    return null;
  }
  const monthlyRate = Math.pow(1 + annualRealReturnPct / 100, 1 / 12) - 1;
  if (monthlyRate === 0) {
    return round2(targetWealth / monthlySavings / 12);
  }
  const months =
    Math.log(1 + (targetWealth * monthlyRate) / monthlySavings) / Math.log(1 + monthlyRate);
  return round2(months / 12);
}

/**
 * Computes the full regional cost analysis.
 *
 * @param form Validated form state.
 * @returns Cost breakdown, regional comparison, retirement and sustainability metrics.
 */
export function calculateRegionalCost(form: RegionalCostFormState): RegionalCostResult {
  const income = form.monthlyIncome;
  const totalMonthlyCost = round2(
    EXPENSE_CATEGORY_KEYS.reduce((sum, key) => sum + (form[key] || 0), 0),
  );
  const totalAnnualCost = round2(totalMonthlyCost * 12);
  const monthlySavings = round2(income - totalMonthlyCost);
  const committedPct = income > 0 ? round2((totalMonthlyCost / income) * 100) : 0;
  const savingsRatePct = income > 0 ? round2((monthlySavings / income) * 100) : 0;

  const categories: CategoryBreakdown[] = EXPENSE_CATEGORY_KEYS.map((key) => {
    const amount = round2(form[key] || 0);
    return {
      key,
      amount,
      pctOfIncome: income > 0 ? round2((amount / income) * 100) : 0,
      pctOfTotal: totalMonthlyCost > 0 ? round2((amount / totalMonthlyCost) * 100) : 0,
    };
  });

  const targetWealth = round2(totalAnnualCost * SAFE_WITHDRAWAL_MULTIPLIER);
  const yearsToRetirement = estimateYearsToRetirement(monthlySavings, targetWealth);

  const entry = getRegionalEntry(form.uf) ?? { name: form.uf, avgIncome: 0, avgCost: 0 };
  const regional: RegionalComparison = {
    uf: form.uf,
    name: entry.name,
    avgIncome: entry.avgIncome,
    avgCost: entry.avgCost,
    costVsRegionalPct:
      entry.avgCost > 0 ? round2((totalMonthlyCost / entry.avgCost - 1) * 100) : 0,
    incomeVsRegionalPct: entry.avgIncome > 0 ? round2((income / entry.avgIncome - 1) * 100) : 0,
  };

  const sustainabilityScore = computeSustainabilityScore({
    savingsRatePct,
    totalMonthlyCost,
    regionalAvgCost: entry.avgCost,
  });

  return {
    totalMonthlyCost,
    totalAnnualCost,
    committedPct,
    savingsRatePct,
    monthlySavings,
    categories,
    targetWealth,
    yearsToRetirement,
    regional,
    sustainabilityScore,
  };
}

interface SustainabilityInput {
  savingsRatePct: number;
  totalMonthlyCost: number;
  regionalAvgCost: number;
}

/**
 * Blends savings discipline (70%) with regional cost efficiency (30%) into a
 * 0–100 sustainability score. A 20%+ savings rate and spending at or below the
 * regional average both earn full marks on their respective components.
 *
 * @param input Savings rate and regional cost context.
 * @returns Sustainability score in [0, 100].
 */
export function computeSustainabilityScore(input: SustainabilityInput): number {
  const savingsScore = clamp((input.savingsRatePct / 20) * 100, 0, 100);
  const ratio = input.regionalAvgCost > 0 ? input.totalMonthlyCost / input.regionalAvgCost : 1;
  const regionalScore = clamp((2 - ratio) * 100, 0, 100);
  return Math.round(clamp(0.7 * savingsScore + 0.3 * regionalScore, 0, 100));
}

// ─── URL sharing ─────────────────────────────────────────────────────────────

/**
 * @param form Form state to encode.
 * @returns Base64-encoded compact query payload.
 */
export function encodeFormToQuery(form: RegionalCostFormState): string {
  const data = {
    u: form.uf,
    i: form.monthlyIncome,
    h: form.housing,
    t: form.transport,
    f: form.food,
    l: form.leisure,
    o: form.other,
  };
  return btoa(JSON.stringify(data));
}

/**
 * Coerces an unknown value into a finite number, defaulting to zero.
 *
 * @param value Raw value from the decoded payload.
 * @returns The numeric value, or 0 when not a finite number.
 */
function coerceNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

/**
 * @param encoded Base64-encoded payload produced by {@link encodeFormToQuery}.
 * @returns Decoded form state, or null when the payload is malformed.
 */
export function decodeQueryToForm(encoded: string): RegionalCostFormState | null {
  try {
    const data = JSON.parse(atob(encoded)) as Record<string, unknown>;
    if (typeof data.u !== "string") {
      return null;
    }
    return {
      uf: data.u,
      monthlyIncome: coerceNumber(data.i),
      housing: coerceNumber(data.h),
      transport: coerceNumber(data.t),
      food: coerceNumber(data.f),
      leisure: coerceNumber(data.l),
      other: coerceNumber(data.o),
    };
  } catch {
    return null;
  }
}
