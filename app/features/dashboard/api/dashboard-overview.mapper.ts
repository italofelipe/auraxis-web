import type { DashboardOverviewDto } from "~/features/dashboard/contracts/dashboard-overview.dto";
import { DashboardOverviewContractError } from "~/features/dashboard/api/dashboard-overview.contract-error";
import type {
  DashboardAlert,
  DashboardComparison,
  DashboardExpenseCategory,
  DashboardGoalSummary,
  DashboardOverview,
  DashboardPortfolio,
  DashboardSummary,
  DashboardTimeseriesPoint,
  DashboardUpcomingDue,
} from "~/features/dashboard/model/dashboard-overview";

/**
 * Checks whether the input is a plain object.
 *
 * @param value Unknown runtime value.
 * @returns Whether the input is a plain object.
 */
const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

/**
 * Ensures a contract field is an object.
 *
 * @param value Unknown runtime value.
 * @param field Contract field label for error reporting.
 * @returns Parsed object value.
 */
const expectRecord = (value: unknown, field: string): Record<string, unknown> => {
  if (!isRecord(value)) {
    throw new DashboardOverviewContractError(`${field} must be an object`);
  }

  return value;
};

/**
 * Ensures a contract field is a non-empty string.
 *
 * @param value Unknown runtime value.
 * @param field Contract field label for error reporting.
 * @returns Parsed string value.
 */
const expectString = (value: unknown, field: string): string => {
  if (typeof value !== "string" || value.length === 0) {
    throw new DashboardOverviewContractError(`${field} must be a non-empty string`);
  }

  return value;
};

/**
 * Ensures a contract field is either a non-empty string or null.
 *
 * @param value Unknown runtime value.
 * @param field Contract field label for error reporting.
 * @returns Parsed nullable string value.
 */
const expectNullableString = (value: unknown, field: string): string | null => {
  if (value === null) {
    return null;
  }

  return expectString(value, field);
};

/**
 * Ensures a contract field is a valid number.
 *
 * @param value Unknown runtime value.
 * @param field Contract field label for error reporting.
 * @returns Parsed number value.
 */
const expectNumber = (value: unknown, field: string): number => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new DashboardOverviewContractError(`${field} must be a valid number`);
  }

  return value;
};

/**
 * Ensures a contract field is either a valid number or null.
 *
 * @param value Unknown runtime value.
 * @param field Contract field label for error reporting.
 * @returns Parsed nullable number value.
 */
const expectNullableNumber = (value: unknown, field: string): number | null => {
  if (value === null) {
    return null;
  }

  return expectNumber(value, field);
};

/**
 * Ensures a contract field is an array.
 *
 * @param value Unknown runtime value.
 * @param field Contract field label for error reporting.
 * @returns Parsed array value.
 */
const expectArray = (value: unknown, field: string): unknown[] => {
  if (!Array.isArray(value)) {
    throw new DashboardOverviewContractError(`${field} must be an array`);
  }

  return value;
};

/**
 * Maps the summary block from the dashboard DTO.
 *
 * @param value Unknown runtime summary block.
 * @returns Parsed summary model.
 */
const toSummary = (value: unknown): DashboardSummary => {
  const raw = expectRecord(value, "summary");

  return {
    income: expectNumber(raw.income, "summary.income"),
    expense: expectNumber(raw.expense, "summary.expense"),
    balance: expectNumber(raw.balance, "summary.balance"),
    upcomingDueTotal: expectNumber(
      raw.upcoming_due_total,
      "summary.upcoming_due_total",
    ),
    netWorth: expectNumber(raw.net_worth, "summary.net_worth"),
  };
};

/**
 * Maps the comparison block from the dashboard DTO.
 *
 * @param value Unknown runtime comparison block.
 * @returns Parsed comparison model.
 */
const toComparison = (value: unknown): DashboardComparison => {
  const raw = expectRecord(value, "comparison");

  return {
    incomeVsPreviousMonthPercent: expectNullableNumber(
      raw.income_vs_previous_month_percent,
      "comparison.income_vs_previous_month_percent",
    ),
    expenseVsPreviousMonthPercent: expectNullableNumber(
      raw.expense_vs_previous_month_percent,
      "comparison.expense_vs_previous_month_percent",
    ),
    balanceVsPreviousMonthPercent: expectNullableNumber(
      raw.balance_vs_previous_month_percent,
      "comparison.balance_vs_previous_month_percent",
    ),
  };
};

/**
 * Maps a timeseries point from the dashboard DTO.
 *
 * @param value Unknown runtime point.
 * @param index Position for error reporting.
 * @returns Parsed timeseries point.
 */
const toTimeseriesPoint = (value: unknown, index: number): DashboardTimeseriesPoint => {
  const raw = expectRecord(value, `timeseries[${index}]`);

  return {
    date: expectString(raw.date, `timeseries[${index}].date`),
    income: expectNumber(raw.income, `timeseries[${index}].income`),
    expense: expectNumber(raw.expense, `timeseries[${index}].expense`),
    balance: expectNumber(raw.balance, `timeseries[${index}].balance`),
  };
};

/**
 * Maps a category bucket from the dashboard DTO.
 *
 * @param value Unknown runtime category bucket.
 * @param index Position for error reporting.
 * @returns Parsed expense category summary.
 */
const toExpenseCategory = (
  value: unknown,
  index: number,
): DashboardExpenseCategory => {
  const raw = expectRecord(value, `expenses_by_category[${index}]`);

  return {
    category: expectString(raw.category, `expenses_by_category[${index}].category`),
    amount: expectNumber(raw.amount, `expenses_by_category[${index}].amount`),
    percentage: expectNumber(
      raw.percentage,
      `expenses_by_category[${index}].percentage`,
    ),
  };
};

/**
 * Maps an upcoming due item from the dashboard DTO.
 *
 * @param value Unknown runtime due item.
 * @param index Position for error reporting.
 * @returns Parsed due item.
 */
const toUpcomingDue = (value: unknown, index: number): DashboardUpcomingDue => {
  const raw = expectRecord(value, `upcoming_dues[${index}]`);

  return {
    id: expectString(raw.id, `upcoming_dues[${index}].id`),
    description: expectString(
      raw.description,
      `upcoming_dues[${index}].description`,
    ),
    amount: expectNumber(raw.amount, `upcoming_dues[${index}].amount`),
    dueDate: expectString(raw.due_date, `upcoming_dues[${index}].due_date`),
    category: expectNullableString(
      raw.category,
      `upcoming_dues[${index}].category`,
    ),
  };
};

/**
 * Maps a goal summary from the dashboard DTO.
 *
 * @param value Unknown runtime goal summary.
 * @param index Position for error reporting.
 * @returns Parsed goal summary.
 */
const toGoalSummary = (value: unknown, index: number): DashboardGoalSummary => {
  const raw = expectRecord(value, `goals[${index}]`);

  return {
    id: expectString(raw.id, `goals[${index}].id`),
    name: expectString(raw.name, `goals[${index}].name`),
    progressPercent: expectNumber(
      raw.progress_percent,
      `goals[${index}].progress_percent`,
    ),
    currentAmount: expectNumber(raw.current_amount, `goals[${index}].current_amount`),
    targetAmount: expectNumber(raw.target_amount, `goals[${index}].target_amount`),
    targetDate: expectNullableString(raw.target_date, `goals[${index}].target_date`),
  };
};

/**
 * Maps the portfolio block from the dashboard DTO.
 *
 * @param value Unknown runtime portfolio block.
 * @returns Parsed portfolio summary.
 */
const toPortfolio = (value: unknown): DashboardPortfolio => {
  const raw = expectRecord(value, "portfolio");

  return {
    currentValue: expectNumber(raw.current_value, "portfolio.current_value"),
    changePercent: expectNullableNumber(
      raw.change_percent,
      "portfolio.change_percent",
    ),
  };
};

/**
 * Maps an alert item from the dashboard DTO.
 *
 * @param value Unknown runtime alert item.
 * @param index Position for error reporting.
 * @returns Parsed dashboard alert.
 */
const toAlert = (value: unknown, index: number): DashboardAlert => {
  const raw = expectRecord(value, `alerts[${index}]`);

  return {
    type: expectString(raw.type, `alerts[${index}].type`),
    title: expectString(raw.title, `alerts[${index}].title`),
    description: expectNullableString(raw.description, `alerts[${index}].description`),
    actionLabel: expectNullableString(raw.action_label, `alerts[${index}].action_label`),
  };
};

/**
 * Maps the canonical dashboard overview DTO into the internal dashboard model.
 *
 * @param input Unknown runtime payload from the API.
 * @returns Parsed dashboard overview model.
 */
export const mapDashboardOverviewDto = (input: unknown): DashboardOverview => {
  const raw = expectRecord(input, "dashboard_overview");
  const period = expectRecord(raw.period, "period");

  return {
    period: {
      key: expectString(period.key, "period.key") as DashboardOverviewDto["period"]["key"],
      start: expectString(period.start, "period.start"),
      end: expectString(period.end, "period.end"),
      label: expectString(period.label, "period.label"),
    },
    summary: toSummary(raw.summary),
    comparison: toComparison(raw.comparison),
    timeseries: expectArray(raw.timeseries, "timeseries").map(toTimeseriesPoint),
    expensesByCategory: expectArray(
      raw.expenses_by_category,
      "expenses_by_category",
    ).map(toExpenseCategory),
    upcomingDues: expectArray(raw.upcoming_dues, "upcoming_dues").map(
      toUpcomingDue,
    ),
    goals: expectArray(raw.goals, "goals").map(toGoalSummary),
    portfolio: toPortfolio(raw.portfolio),
    alerts: expectArray(raw.alerts, "alerts").map(toAlert),
  };
};

export { DashboardOverviewContractError };
