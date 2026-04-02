/**
 * Domain model for the CDB/LCI/LCA vs Poupança calculator.
 *
 * Compares the net return of CDB (with regressive IR), LCI, LCA (both IR-exempt),
 * and Poupança. All rates are based on CDI percentage, except Poupança which uses
 * 70% of SELIC when SELIC > 8.5% a.a.
 *
 * Regulatory basis: ICVM 592, 2025 IR table.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

/** Year of the IR bracket table used in this model. */
export const CDB_TABLE_YEAR = 2025;

/**
 * Regressive IR brackets for fixed income (CDB).
 * LCI and LCA are IR-exempt.
 * maxDays uses 99999 as a proxy for Infinity.
 */
export const CDB_IR_BRACKETS: ReadonlyArray<{ readonly maxDays: number; readonly rate: number }> = [
  { maxDays: 180, rate: 0.225 },
  { maxDays: 360, rate: 0.20 },
  { maxDays: 720, rate: 0.175 },
  { maxDays: 99999, rate: 0.15 },
];

// ─── Types ────────────────────────────────────────────────────────────────────

/** An individual investment result with gross and net figures. */
export interface CdbInvestmentResult {
  /** Gross return before IR deduction (BRL). */
  grossReturn: number;
  /** Net return after all deductions (BRL). */
  netReturn: number;
  /** Final net amount (principal + net return). */
  netAmount: number;
  /** Real return above IPCA using Fisher formula (decimal). */
  realReturn: number;
}

/** CDB-specific result that includes IR breakdown. */
export interface CdbSpecificResult extends CdbInvestmentResult {
  /** IR rate applied (decimal, e.g. 0.175). */
  irRate: number;
  /** IR amount deducted (BRL). */
  irAmount: number;
}

/** A ranking entry for comparison display. */
export interface CdbRankingEntry {
  /** Product name (e.g. "CDB", "LCI", "LCA", "Poupança"). */
  name: string;
  /** Final net amount for this product (BRL). */
  netAmount: number;
}

/** Full calculation result for the CDB/LCI/LCA vs Poupança calculator. */
export interface CdbLciLcaResult {
  /** CDB result with IR breakdown. */
  cdb: CdbSpecificResult;
  /** LCI result (IR-exempt). */
  lci: CdbInvestmentResult;
  /** LCA result (IR-exempt). */
  lca: CdbInvestmentResult;
  /** Poupança result (IR-exempt on the Poupança account). */
  poupanca: CdbInvestmentResult;
  /** Products ranked by net amount descending. */
  ranking: CdbRankingEntry[];
  /** Name of the best product by net amount. */
  bestOption: string;
}

// ─── Form state ───────────────────────────────────────────────────────────────

/** Form state for the CDB/LCI/LCA vs Poupança calculator. */
export interface CdbLciLcaFormState extends Record<string, unknown> {
  /** Principal investment amount in BRL (null until user fills in). */
  amount: number | null;
  /** Investment term in calendar days (default 365). */
  termDays: number;
  /** CDB rate as % of CDI (e.g. 100 means 100% CDI). Null if not compared. */
  cdbRatePct: number | null;
  /** LCI rate as % of CDI (e.g. 95). Null if not compared. */
  lciRatePct: number | null;
  /** LCA rate as % of CDI (e.g. 93). Null if not compared. */
  lcaRatePct: number | null;
  /** CDI annual rate in % (default 10.65 as of Apr/2026). */
  cdiRatePct: number;
  /** SELIC annual rate in % (default 10.75 as of Apr/2026). */
  selicRatePct: number;
  /** IPCA annual rate in % used to compute real return (default 4.5). */
  ipcaRatePct: number;
  /** Whether to show IOF disclaimer (IOF only applies under 30 days; not calculated). */
  includeIof: boolean;
}

/**
 * Returns the default initial form state for the CDB/LCI/LCA calculator.
 *
 * @returns Default CdbLciLcaFormState.
 */
export function createDefaultCdbLciLcaFormState(): CdbLciLcaFormState {
  return {
    amount: null,
    termDays: 365,
    cdbRatePct: 100,
    lciRatePct: 95,
    lcaRatePct: 93,
    cdiRatePct: 10.65,
    selicRatePct: 10.75,
    ipcaRatePct: 4.5,
    includeIof: false,
  };
}

// ─── Validation ───────────────────────────────────────────────────────────────

/** Validation error shape for the CDB/LCI/LCA form. */
export interface CdbLciLcaValidationError {
  field: keyof CdbLciLcaFormState;
  messageKey: string;
}

/**
 * Validates the CDB/LCI/LCA form state before calculating.
 *
 * @param form Current form state.
 * @returns Array of validation errors. Empty array means valid.
 */
export function validateCdbLciLcaForm(form: CdbLciLcaFormState): CdbLciLcaValidationError[] {
  const errors: CdbLciLcaValidationError[] = [];

  if (form.amount === null || form.amount <= 0) {
    errors.push({ field: "amount", messageKey: "errors.amountRequired" });
  }

  if (form.termDays < 1) {
    errors.push({ field: "termDays", messageKey: "errors.termDaysRequired" });
  }

  const hasAnyRate =
    form.cdbRatePct !== null ||
    form.lciRatePct !== null ||
    form.lcaRatePct !== null;

  if (!hasAnyRate) {
    errors.push({ field: "cdbRatePct", messageKey: "errors.atLeastOneRateRequired" });
  }

  return errors;
}

// ─── Calculation ──────────────────────────────────────────────────────────────

/**
 * Finds the applicable IR rate for a CDB given the investment term.
 *
 * @param termDays Term in calendar days.
 * @returns IR rate as a decimal (e.g. 0.175).
 */
export function findCdbIrRate(termDays: number): number {
  for (const bracket of CDB_IR_BRACKETS) {
    if (termDays <= bracket.maxDays) {
      return bracket.rate;
    }
  }
  return 0.15;
}

/** Options for CDI-based gross return calculation. */
interface CdiCalcOptions {
  /** Principal amount in BRL. */
  amount: number;
  /** CDI annual rate as a decimal (e.g. 0.1065). */
  annualCdi: number;
  /** Product rate as % of CDI (e.g. 95 for 95% CDI). */
  productRatePct: number;
  /** Investment term in days. */
  termDays: number;
}

/**
 * Calculates gross return for a product expressed as % of CDI.
 *
 * Uses business-day convention via annual compounding:
 * grossReturn = amount * ((1 + annualCdi * productRate/100)^(termDays/252) - 1)
 *
 * @param opts Calculation options.
 * @returns Gross return in BRL.
 */
function calcCdiGrossReturn(opts: CdiCalcOptions): number {
  const effectiveAnnualRate = opts.annualCdi * (opts.productRatePct / 100);
  const grossReturn = opts.amount * (Math.pow(1 + effectiveAnnualRate, opts.termDays / 252) - 1);
  return round2(grossReturn);
}

/** Options for real return calculation via Fisher equation. */
interface RealReturnOptions {
  /** Final net amount including principal. */
  netAmount: number;
  /** Principal invested. */
  amount: number;
  /** IPCA annual rate as a decimal. */
  annualIpca: number;
  /** Investment term in days. */
  termDays: number;
}

/**
 * Calculates real return using the Fisher equation.
 *
 * realReturn = (netAmount/amount) / (1 + periodIpca) - 1
 *
 * @param opts Calculation options.
 * @returns Real return as a decimal.
 */
function calcRealReturn(opts: RealReturnOptions): number {
  const nominalGrowth = opts.netAmount / opts.amount;
  const periodIpca = Math.pow(1 + opts.annualIpca, opts.termDays / 365) - 1;
  return round4(nominalGrowth / (1 + periodIpca) - 1);
}

/**
 * Calculates Poupança gross return.
 *
 * Rule: if SELIC > 8.5% a.a., monthly rate = selic * 0.70 / 12;
 *       else monthly rate = 0.5% + TR (TR assumed 0).
 *
 * @param amount Principal amount in BRL.
 * @param annualSelic SELIC annual rate as a decimal.
 * @param termDays Investment term in days.
 * @returns Gross return in BRL.
 */
function calcPoupancaGrossReturn(amount: number, annualSelic: number, termDays: number): number {
  const selicThreshold = 0.085;
  const monthlyRate = annualSelic > selicThreshold ? (annualSelic * 0.70) / 12 : 0.005;
  const months = termDays / 30;
  return round2(amount * (Math.pow(1 + monthlyRate, months) - 1));
}

/** Internal rates extracted from the form for calculation. */
interface CalcRates {
  annualCdi: number;
  annualSelic: number;
  annualIpca: number;
  termDays: number;
}

/**
 * Builds the CDB result including IR.
 *
 * @param amount Principal in BRL.
 * @param productRatePct CDB rate as % of CDI.
 * @param rates Annual rates and term.
 * @returns CdbSpecificResult.
 */
function buildCdbResult(
  amount: number,
  productRatePct: number | null,
  rates: CalcRates,
): CdbSpecificResult {
  const grossReturn = productRatePct !== null
    ? calcCdiGrossReturn({ amount, annualCdi: rates.annualCdi, productRatePct, termDays: rates.termDays })
    : 0;
  const irRate = findCdbIrRate(rates.termDays);
  const irAmount = round2(grossReturn * irRate);
  const netReturn = round2(grossReturn - irAmount);
  const netAmount = round2(amount + netReturn);
  return {
    grossReturn,
    irRate,
    irAmount,
    netReturn,
    netAmount,
    realReturn: calcRealReturn({ netAmount, amount, annualIpca: rates.annualIpca, termDays: rates.termDays }),
  };
}

/**
 * Builds an IR-exempt investment result (LCI/LCA).
 *
 * @param amount Principal in BRL.
 * @param productRatePct Rate as % of CDI (null = not selected).
 * @param rates Annual rates and term.
 * @returns CdbInvestmentResult.
 */
function buildExemptResult(
  amount: number,
  productRatePct: number | null,
  rates: CalcRates,
): CdbInvestmentResult {
  const grossReturn = productRatePct !== null
    ? calcCdiGrossReturn({ amount, annualCdi: rates.annualCdi, productRatePct, termDays: rates.termDays })
    : 0;
  const netAmount = round2(amount + grossReturn);
  return {
    grossReturn,
    netReturn: grossReturn,
    netAmount,
    realReturn: calcRealReturn({ netAmount, amount, annualIpca: rates.annualIpca, termDays: rates.termDays }),
  };
}

/**
 * Builds the Poupança result.
 *
 * @param amount Principal in BRL.
 * @param rates Annual rates and term.
 * @returns CdbInvestmentResult.
 */
function buildPoupancaResult(amount: number, rates: CalcRates): CdbInvestmentResult {
  const grossReturn = calcPoupancaGrossReturn(amount, rates.annualSelic, rates.termDays);
  const netAmount = round2(amount + grossReturn);
  return {
    grossReturn,
    netReturn: grossReturn,
    netAmount,
    realReturn: calcRealReturn({ netAmount, amount, annualIpca: rates.annualIpca, termDays: rates.termDays }),
  };
}

/** Input for building the ranking from product results. */
interface RankingInput {
  /** Form state used to know which products are active. */
  form: CdbLciLcaFormState;
  /** CDB result. */
  cdb: CdbSpecificResult;
  /** LCI result. */
  lci: CdbInvestmentResult;
  /** LCA result. */
  lca: CdbInvestmentResult;
  /** Poupança result. */
  poupanca: CdbInvestmentResult;
}

/**
 * Builds the ranking and best option from the four results.
 *
 * @param input All product results and form state.
 * @returns ranking and bestOption.
 */
function buildRanking(input: RankingInput): { ranking: CdbRankingEntry[]; bestOption: string } {
  const { form, cdb, lci, lca, poupanca } = input;
  const candidates: CdbRankingEntry[] = [];
  if (form.cdbRatePct !== null) { candidates.push({ name: "CDB", netAmount: cdb.netAmount }); }
  if (form.lciRatePct !== null) { candidates.push({ name: "LCI", netAmount: lci.netAmount }); }
  if (form.lcaRatePct !== null) { candidates.push({ name: "LCA", netAmount: lca.netAmount }); }
  candidates.push({ name: "Poupança", netAmount: poupanca.netAmount });
  const ranking = [...candidates].sort((a, b) => b.netAmount - a.netAmount);
  return { ranking, bestOption: ranking[0]?.name ?? "Poupança" };
}

/**
 * Calculates net returns for CDB, LCI, LCA and Poupança and produces a ranking.
 *
 * @param form Validated form state.
 * @returns Complete CdbLciLcaResult with rankings.
 */
export function calculateCdbLciLca(form: CdbLciLcaFormState): CdbLciLcaResult {
  const amount = form.amount ?? 0;
  const rates: CalcRates = {
    annualCdi: form.cdiRatePct / 100,
    annualSelic: form.selicRatePct / 100,
    annualIpca: form.ipcaRatePct / 100,
    termDays: form.termDays,
  };

  const cdb = buildCdbResult(amount, form.cdbRatePct, rates);
  const lci = buildExemptResult(amount, form.lciRatePct, rates);
  const lca = buildExemptResult(amount, form.lcaRatePct, rates);
  const poupanca = buildPoupancaResult(amount, rates);
  const { ranking, bestOption } = buildRanking({ form, cdb, lci, lca, poupanca });

  return { cdb, lci, lca, poupanca, ranking, bestOption };
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
 * Rounds a number to 4 decimal places (rate precision).
 *
 * @param value Number to round.
 * @returns Rounded value.
 */
function round4(value: number): number {
  return Math.round(value * 10000) / 10000;
}
