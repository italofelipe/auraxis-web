import type { DashboardOverviewDto } from "~/features/dashboard/contracts/dashboard-overview.dto";
import { DashboardOverviewContractError } from "~/features/dashboard/services/dashboard-overview.contract-error";
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
 * Extracts the data payload from either a bare object or a v2-wrapped response.
 *
 * The backend wraps all v2 responses as `{ success, message, data: {...} }`.
 * Some code paths may also pass the inner data directly.
 *
 * @param input Unknown runtime payload from the API.
 * @returns The inner data record.
 */
const unwrapV2 = (input: unknown): Record<string, unknown> => {
  const top = expectRecord(input, "response");
  // v2 contract wrapper: { success: true, message: "...", data: {...} }
  if ("data" in top && isRecord(top.data)) {
    return top.data as Record<string, unknown>;
  }
  return top;
};

/**
 * Maps the backend's simplified `totals` block to the frontend summary model.
 *
 * @param raw The unwrapped data payload.
 * @returns Parsed summary model.
 */
const toSummaryFromTotals = (raw: Record<string, unknown>): DashboardSummary => {
  if (isRecord(raw.summary)) {
    return toSummary(raw.summary);
  }

  if (isRecord(raw.totals)) {
    const totals = raw.totals as Record<string, unknown>;
    return {
      income: typeof totals.income_total === "number" ? totals.income_total : 0,
      expense: typeof totals.expense_total === "number" ? totals.expense_total : 0,
      balance: typeof totals.balance === "number" ? totals.balance : 0,
      upcomingDueTotal: 0,
      netWorth: 0,
    };
  }

  return { income: 0, expense: 0, balance: 0, upcomingDueTotal: 0, netWorth: 0 };
};

/**
 * Maps the backend's `top_categories.expense[]` to the frontend category model.
 *
 * @param raw The unwrapped data payload.
 * @returns Parsed expense category array.
 */
const toExpenseCategoriesFromTopCategories = (
  raw: Record<string, unknown>,
): DashboardExpenseCategory[] => {
  if (Array.isArray(raw.expenses_by_category)) {
    return (raw.expenses_by_category as unknown[]).map(toExpenseCategory);
  }

  if (isRecord(raw.top_categories) && Array.isArray((raw.top_categories as Record<string, unknown>).expense)) {
    const items = (raw.top_categories as Record<string, unknown[]>).expense ?? [];
    return items.map((item, i) => {
      const it = isRecord(item) ? item : {};
      const categoryName = it.category_name ?? it.category;
      const totalAmount = it.total_amount ?? it.amount;
      const total = typeof raw.totals === "object" && raw.totals !== null
        ? (raw.totals as Record<string, unknown>).expense_total ?? 1
        : 1;
      const amount = typeof totalAmount === "number" ? totalAmount : 0;
      const pct = typeof total === "number" && total > 0 ? (amount / total) * 100 : 0;

      return {
        category: typeof categoryName === "string" ? categoryName : `Category ${i}`,
        amount,
        percentage: Math.round(pct * 100) / 100,
      };
    });
  }

  return [];
};

/**
 * Derives the period label from an YYYY-MM month string.
 *
 * @param month YYYY-MM month string.
 * @returns Localised PT-BR month label.
 */
const monthLabel = (month: string): string => {
  const [year, mon] = month.split("-");
  if (!year || !mon) {return month;}
  const date = new Date(Number(year), Number(mon) - 1, 1);
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
};

/**
 * Maps the canonical dashboard overview DTO into the internal dashboard model.
 *
 * Handles two response shapes:
 * 1. Rich contract (period/summary/comparison/…) — returned by future API versions.
 * 2. Simplified backend contract (month/totals/counts/top_categories) — current MVP backend.
 *    In this case the v2 wrapper `{ success, message, data }` is stripped first.
 *
 * @param input Unknown runtime payload from the API.
 * @returns Parsed dashboard overview model.
 */
export const mapDashboardOverviewDto = (input: unknown): DashboardOverview => {
  const data = unwrapV2(input);

  // Rich contract path (period object present)
  if (isRecord(data.period)) {
    const period = data.period as Record<string, unknown>;
    return {
      period: {
        key: expectString(period.key, "period.key") as DashboardOverviewDto["period"]["key"],
        start: expectString(period.start, "period.start"),
        end: expectString(period.end, "period.end"),
        label: expectString(period.label, "period.label"),
      },
      summary: toSummary(data.summary),
      comparison: toComparison(data.comparison),
      timeseries: Array.isArray(data.timeseries)
        ? (data.timeseries as unknown[]).map(toTimeseriesPoint)
        : [],
      expensesByCategory: Array.isArray(data.expenses_by_category)
        ? (data.expenses_by_category as unknown[]).map(toExpenseCategory)
        : [],
      upcomingDues: Array.isArray(data.upcoming_dues)
        ? (data.upcoming_dues as unknown[]).map(toUpcomingDue)
        : [],
      goals: Array.isArray(data.goals)
        ? (data.goals as unknown[]).map(toGoalSummary)
        : [],
      portfolio: isRecord(data.portfolio) ? toPortfolio(data.portfolio) : { currentValue: 0, changePercent: null },
      alerts: Array.isArray(data.alerts)
        ? (data.alerts as unknown[]).map(toAlert)
        : [],
    };
  }

  // Simplified backend contract path (month / totals / counts / top_categories)
  const month = typeof data.month === "string" ? data.month : "";
  const now = new Date();
  const startOfMonth = `${month}-01`;
  const endOfMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const endOfMonth = month
    ? `${month}-${String(endOfMonthDate.getDate()).padStart(2, "0")}`
    : "";

  return {
    period: {
      key: "current_month",
      start: startOfMonth,
      end: endOfMonth,
      label: monthLabel(month),
    },
    summary: toSummaryFromTotals(data),
    comparison: {
      incomeVsPreviousMonthPercent: null,
      expenseVsPreviousMonthPercent: null,
      balanceVsPreviousMonthPercent: null,
    },
    timeseries: [],
    expensesByCategory: toExpenseCategoriesFromTopCategories(data),
    upcomingDues: [],
    goals: [],
    portfolio: { currentValue: 0, changePercent: null },
    alerts: [],
  };
};

export { DashboardOverviewContractError };
