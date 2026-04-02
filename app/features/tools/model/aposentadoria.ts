/**
 * Domain model for the Simulador de Aposentadoria.
 *
 * Uses the "Rule of 25x" (4% Safe Withdrawal Rate) to determine the
 * required patrimony and monthly contribution to retire at a target age
 * with a desired monthly income in today's Reais.
 *
 * PMT formula (FV):
 *   FV - PV*(1+r)^n = PMT * ((1+r)^n - 1) / r
 *   PMT = (FV - PV*(1+r)^n) * r / ((1+r)^n - 1)
 */

// ─── Constants ────────────────────────────────────────────────────────────────

/** Year of this model's regulatory basis. */
export const APOSENTADORIA_TABLE_YEAR = 2025;

// ─── Types ────────────────────────────────────────────────────────────────────

/** A single data point in the patrimony evolution chart. */
export interface AposentadoriaChartPoint {
  /** Age at this data point. */
  age: number;
  /** Projected patrimony at this age (nominal BRL). */
  patrimony: number;
}

/** Complete calculation result for the Aposentadoria simulator. */
export interface AposentadoriaResult {
  /** Required patrimony at retirement (Rule of 25x). */
  requiredPatrimony: number;
  /** Number of months until retirement. */
  monthsToRetirement: number;
  /** Monthly contribution needed to reach requiredPatrimony. */
  requiredMonthlyContribution: number;
  /** Projected patrimony if contributing the required amount (should match required). */
  projectedPatrimony: number;
  /** Whether the current trajectory reaches the required patrimony. */
  isOnTrack: boolean;
  /** Year-by-year patrimony growth chart data. */
  chartData: AposentadoriaChartPoint[];
  /** Required contribution if retiring 5 years later (sensitivity +20%). */
  sensitivityMinus20pct: number;
  /** Required contribution if retiring 5 years earlier (sensitivity -20%). */
  sensitivityPlus20pct: number;
  /** Real annual return after inflation (Fisher formula, as %). */
  realReturnPct: number;
}

// ─── Form state ───────────────────────────────────────────────────────────────

/** Form state for the Aposentadoria simulator. */
export interface AposentadoriaFormState extends Record<string, unknown> {
  /** Current age in years (default 30). */
  currentAge: number;
  /** Target retirement age in years (default 65). */
  retirementAge: number;
  /** Desired monthly income in today's Reais (null until user fills in). */
  desiredMonthlyIncome: number | null;
  /** Current patrimony / savings in BRL (default 0). */
  currentPatrimony: number;
  /** Expected nominal annual return in % (default 8.0). */
  expectedReturnPct: number;
  /** IPCA annual rate in % (default 4.5). */
  ipcaPct: number;
  /** Life expectancy in years (default 90). */
  lifeExpectancy: number;
}

/**
 * Returns the default initial form state for the Aposentadoria simulator.
 *
 * @returns Default AposentadoriaFormState.
 */
export function createDefaultAposentadoriaFormState(): AposentadoriaFormState {
  return {
    currentAge: 30,
    retirementAge: 65,
    desiredMonthlyIncome: null,
    currentPatrimony: 0,
    expectedReturnPct: 8.0,
    ipcaPct: 4.5,
    lifeExpectancy: 90,
  };
}

// ─── Validation ───────────────────────────────────────────────────────────────

/** Validation error shape for the Aposentadoria form. */
export interface AposentadoriaValidationError {
  field: keyof AposentadoriaFormState;
  messageKey: string;
}

/**
 * Validates the Aposentadoria form state before calculating.
 *
 * @param form Current form state.
 * @returns Array of validation errors. Empty array means valid.
 */
export function validateAposentadoriaForm(
  form: AposentadoriaFormState,
): AposentadoriaValidationError[] {
  const errors: AposentadoriaValidationError[] = [];

  if (form.retirementAge <= form.currentAge) {
    errors.push({ field: "retirementAge", messageKey: "errors.retirementAgeAfterCurrent" });
  }

  if (form.desiredMonthlyIncome === null || form.desiredMonthlyIncome <= 0) {
    errors.push({ field: "desiredMonthlyIncome", messageKey: "errors.incomeRequired" });
  }

  if (form.expectedReturnPct <= 0) {
    errors.push({ field: "expectedReturnPct", messageKey: "errors.returnRequired" });
  }

  if (form.lifeExpectancy <= form.retirementAge) {
    errors.push({ field: "lifeExpectancy", messageKey: "errors.lifeExpectancyAfterRetirement" });
  }

  return errors;
}

// ─── Calculation helpers ──────────────────────────────────────────────────────

/** Options for monthly PMT calculation. */
interface PmtOptions {
  /** Target future value. */
  fv: number;
  /** Present value (current patrimony). */
  pv: number;
  /** Monthly rate (decimal). */
  r: number;
  /** Number of months. */
  n: number;
}

/**
 * Calculates the monthly PMT needed to reach a future value.
 *
 * PMT = (FV - PV*(1+r)^n) * r / ((1+r)^n - 1)
 * Returns 0 if n <= 0 or the patrimony already exceeds the target.
 *
 * @param opts PMT calculation options.
 * @returns Monthly PMT amount in BRL (0 if no contribution needed).
 */
function calcPmt(opts: PmtOptions): number {
  if (opts.n <= 0) { return 0; }
  const growth = Math.pow(1 + opts.r, opts.n);
  const pvGrown = opts.pv * growth;
  if (pvGrown >= opts.fv) { return 0; }
  return round2((opts.fv - pvGrown) * opts.r / (growth - 1));
}

/** Options for year-by-year chart data generation. */
interface ChartDataOptions {
  /** Current patrimony in BRL. */
  pv: number;
  /** Monthly contribution in BRL. */
  monthlyPmt: number;
  /** Monthly rate (decimal). */
  monthlyRate: number;
  /** Current age in years. */
  currentAge: number;
  /** Retirement age in years. */
  retirementAge: number;
}

/**
 * Builds a year-by-year chart of patrimony accumulation.
 *
 * @param opts Chart data options.
 * @returns Array of AposentadoriaChartPoints.
 */
function buildChartData(opts: ChartDataOptions): AposentadoriaChartPoint[] {
  const chartData: AposentadoriaChartPoint[] = [];
  let patrimony = opts.pv;

  for (let age = opts.currentAge; age <= opts.retirementAge; age++) {
    chartData.push({ age, patrimony: round2(patrimony) });
    for (let m = 0; m < 12; m++) {
      patrimony = patrimony * (1 + opts.monthlyRate) + opts.monthlyPmt;
    }
  }

  return chartData;
}

// ─── Main calculation ─────────────────────────────────────────────────────────

/**
 * Calculates the Aposentadoria simulation.
 *
 * @param form Validated form state.
 * @returns Complete AposentadoriaResult.
 */
export function calculateAposentadoria(form: AposentadoriaFormState): AposentadoriaResult {
  const nominalAnnual = form.expectedReturnPct / 100;
  const inflationAnnual = form.ipcaPct / 100;
  const realAnnual = (1 + nominalAnnual) / (1 + inflationAnnual) - 1;
  const monthlyRate = Math.pow(1 + nominalAnnual, 1 / 12) - 1;
  const monthsToRetirement = (form.retirementAge - form.currentAge) * 12;
  const desiredIncome = form.desiredMonthlyIncome ?? 0;

  // Rule of 25x: annual expenses / 0.04
  const requiredPatrimony = round2(desiredIncome * 12 / 0.04);

  const pv = form.currentPatrimony;

  const requiredMonthlyContribution = calcPmt({
    fv: requiredPatrimony,
    pv,
    r: monthlyRate,
    n: monthsToRetirement,
  });

  const projectedPatrimony = round2(
    pv * Math.pow(1 + monthlyRate, monthsToRetirement) +
    requiredMonthlyContribution * (Math.pow(1 + monthlyRate, monthsToRetirement) - 1) / monthlyRate,
  );

  const isOnTrack = projectedPatrimony >= requiredPatrimony;

  const chartData = buildChartData({
    pv,
    monthlyPmt: requiredMonthlyContribution,
    monthlyRate,
    currentAge: form.currentAge,
    retirementAge: form.retirementAge,
  });

  // Sensitivity: PMT if retiring 5 years later or earlier
  const monthsLater = (form.retirementAge + 5 - form.currentAge) * 12;
  const monthsEarlier = Math.max((form.retirementAge - 5 - form.currentAge) * 12, 1);

  const sensitivityMinus20pct = calcPmt({ fv: requiredPatrimony, pv, r: monthlyRate, n: monthsLater });
  const sensitivityPlus20pct = calcPmt({ fv: requiredPatrimony, pv, r: monthlyRate, n: monthsEarlier });

  return {
    requiredPatrimony,
    monthsToRetirement,
    requiredMonthlyContribution,
    projectedPatrimony,
    isOnTrack,
    chartData,
    sensitivityMinus20pct,
    sensitivityPlus20pct,
    realReturnPct: round4(realAnnual * 100),
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Rounds a number to 2 decimal places (currency precision).
 *
 * @param value Number to round.
 * @returns Rounded value.
 */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Rounds a number to 4 decimal places.
 *
 * @param value Number to round.
 * @returns Rounded value.
 */
function round4(value: number): number {
  return Math.round(value * 10000) / 10000;
}
