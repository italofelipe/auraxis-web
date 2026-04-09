import { computed, type ComputedRef, ref, type Ref } from "vue";
import type { TransactionDto } from "~/features/transactions/contracts/transaction.dto";
import type { TransactionsClient } from "~/features/transactions/services/transactions.client";
import { useListTransactionsQuery } from "~/features/transactions/queries/use-list-transactions-query";

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Aggregated data for a single calendar cell.
 *
 * Cells outside the current month (`isCurrentMonth === false`) are padding
 * slots used to fill the 6×7 weekly grid; their transaction arrays are empty.
 */
export type CalendarDay = {
  /** ISO date string YYYY-MM-DD identifying this cell. */
  readonly date: string;
  /** Numeric day of month (1–31). */
  readonly dayOfMonth: number;
  /** True when this cell belongs to the displayed month. */
  readonly isCurrentMonth: boolean;
  /** True when this cell represents today's date. */
  readonly isToday: boolean;
  /** Transactions whose due_date matches this date. */
  readonly transactions: TransactionDto[];
  /** Sum of all income transactions for this day. */
  readonly totalIncome: number;
  /** Sum of all expense transactions for this day (always ≥ 0). */
  readonly totalExpense: number;
  /** Net daily balance: totalIncome − totalExpense. */
  readonly dailyBalance: number;
  /** Running cumulative balance from the first day of the month. */
  readonly cumulativeBalance: number;
  /**
   * True when this day is part of a "cash valley":
   * a sequence of 3 or more consecutive days within the current month
   * where the daily net balance is negative.
   */
  readonly isCashValley: boolean;
};

/** Full return type of useFinancialCalendar. */
export type UseFinancialCalendarReturn = {
  /** 42-slot (6×7) array of calendar cells for the displayed month. */
  readonly calendarDays: ComputedRef<CalendarDay[]>;
  /** Currently displayed year (mutable). */
  readonly currentYear: Ref<number>;
  /** Currently displayed month index, 0-indexed (Jan=0, Dec=11). */
  readonly currentMonth: Ref<number>;
  /** Localised "month year" label, e.g. "abril de 2026". */
  readonly monthLabel: ComputedRef<string>;
  /** True while the transactions query is in flight. */
  readonly isLoading: ComputedRef<boolean>;
  /** True when the transactions query has errored. */
  readonly isError: ComputedRef<boolean>;
  /** Navigates to the previous calendar month. */
  readonly goToPreviousMonth: () => void;
  /** Navigates to the next calendar month. */
  readonly goToNextMonth: () => void;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Formats a Date as a YYYY-MM-DD string.
 *
 * @param d - Date to format.
 * @returns ISO date string.
 */
function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Returns the number of days in a given month.
 *
 * @param year - Four-digit year.
 * @param month - Month index (0 = January).
 * @returns Number of days (28, 29, 30 or 31).
 */
function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Adds all days in a streak to the valleys set when the streak is long enough.
 *
 * @param valleys    - Mutable Set to populate.
 * @param streakStart - First day-of-month in the streak.
 * @param streakLen  - Length of the streak.
 */
function flushStreak(valleys: Set<number>, streakStart: number, streakLen: number): void {
  if (streakLen < 3) { return; }
  for (let i = streakStart; i < streakStart + streakLen; i++) {
    valleys.add(i);
  }
}

/**
 * Detects "cash valley" days within a month's set of daily balances.
 *
 * A cash valley is any sequence of 3 or more consecutive days (by day-of-month,
 * covering only the current month) where the daily net balance is negative.
 *
 * @param dailyBalances - Map from day-of-month (1-indexed) to daily net balance.
 * @param totalDays     - Total number of days in the month.
 * @returns Set of day-of-month values that are part of a cash valley.
 */
function detectCashValleys(
  dailyBalances: Map<number, number>,
  totalDays: number,
): Set<number> {
  const valleys = new Set<number>();
  let streakStart = -1;
  let streakLen = 0;

  for (let d = 1; d <= totalDays; d++) {
    const bal = dailyBalances.get(d) ?? 0;
    if (bal < 0) {
      if (streakLen === 0) { streakStart = d; }
      streakLen++;
    } else {
      flushStreak(valleys, streakStart, streakLen);
      streakLen = 0;
      streakStart = -1;
    }
  }
  flushStreak(valleys, streakStart, streakLen); // Flush streak reaching end of month

  return valleys;
}

// ── Calendar build types & helpers ────────────────────────────────────────────

/** Internal context passed between calendar-building helpers. */
type CalendarBuildContext = {
  readonly txByDate: Map<string, TransactionDto[]>;
  readonly dailyBalances: Map<number, number>;
  readonly cumulativeByDay: Map<number, number>;
  readonly cashValleys: Set<number>;
  readonly todayIso: string;
};

/** Options bundle for buildCalendarDays and its internal helpers. */
type BuildOptions = {
  readonly year: number;
  readonly month: number;
  readonly transactions: TransactionDto[];
  readonly todayIso: string;
};

/**
 * Builds a running cumulative balance map for all days in a month.
 *
 * @param dailyBalances - Daily net balances keyed by day-of-month.
 * @param totalDays     - Number of days in the month.
 * @returns Map from day-of-month to running cumulative balance.
 */
function buildCumulative(dailyBalances: Map<number, number>, totalDays: number): Map<number, number> {
  const map = new Map<number, number>();
  let cum = 0;
  for (let d = 1; d <= totalDays; d++) {
    cum += dailyBalances.get(d) ?? 0;
    map.set(d, cum);
  }
  return map;
}

/**
 * Groups transactions by due_date and computes daily / cumulative balances.
 *
 * @param opts - Year, month, transactions and today's ISO date.
 * @returns Context object used by the slot-building helpers.
 */
function buildContext(opts: BuildOptions): CalendarBuildContext {
  const { year, month, transactions: txs, todayIso } = opts;
  const totalDays = daysInMonth(year, month);

  const txByDate = new Map<string, TransactionDto[]>();
  for (const tx of txs) {
    if (!txByDate.has(tx.due_date)) { txByDate.set(tx.due_date, []); }
    txByDate.get(tx.due_date)!.push(tx);
  }

  const dailyBalances = new Map<number, number>();
  for (let d = 1; d <= totalDays; d++) {
    const iso = toIso(new Date(year, month, d));
    const dayTxs = txByDate.get(iso) ?? [];
    const income = dayTxs.filter((t) => t.type === "income").reduce((s, t) => s + parseFloat(t.amount), 0);
    const expense = dayTxs.filter((t) => t.type === "expense").reduce((s, t) => s + parseFloat(t.amount), 0);
    dailyBalances.set(d, income - expense);
  }

  return { txByDate, dailyBalances, cumulativeByDay: buildCumulative(dailyBalances, totalDays), cashValleys: detectCashValleys(dailyBalances, totalDays), todayIso };
}

/** Minimal date spec for padding day construction. */
type PaddingDaySpec = { year: number; month: number; day: number; todayIso: string };

/**
 * Builds a padding-only CalendarDay for a day outside the current month.
 *
 * @param spec - Year, month, day-of-month, and today's ISO date string.
 * @returns Inactive CalendarDay with empty transaction data.
 */
function makePaddingDay(spec: PaddingDaySpec): CalendarDay {
  const { year, month, day, todayIso } = spec;
  const date = toIso(new Date(year, month, day));
  return { date, dayOfMonth: day, isCurrentMonth: false, isToday: date === todayIso, transactions: [], totalIncome: 0, totalExpense: 0, dailyBalance: 0, cumulativeBalance: 0, isCashValley: false };
}

/**
 * Builds the current-month day slots with full transaction aggregation.
 *
 * @param year  - Four-digit year.
 * @param month - Month index (0 = January).
 * @param ctx   - Pre-computed build context.
 * @returns Array of CalendarDay objects for the current month.
 */
function buildCurrentMonthSlots(year: number, month: number, ctx: CalendarBuildContext): CalendarDay[] {
  const total = daysInMonth(year, month);
  return Array.from({ length: total }, (_, i) => {
    const d = i + 1;
    const date = toIso(new Date(year, month, d));
    const dayTxs = ctx.txByDate.get(date) ?? [];
    const income = dayTxs.filter((t) => t.type === "income").reduce((s, t) => s + parseFloat(t.amount), 0);
    const expense = dayTxs.filter((t) => t.type === "expense").reduce((s, t) => s + parseFloat(t.amount), 0);
    return { date, dayOfMonth: d, isCurrentMonth: true, isToday: date === ctx.todayIso, transactions: dayTxs, totalIncome: income, totalExpense: expense, dailyBalance: ctx.dailyBalances.get(d) ?? 0, cumulativeBalance: ctx.cumulativeByDay.get(d) ?? 0, isCashValley: ctx.cashValleys.has(d) };
  });
}

/**
 * Builds 42 CalendarDay slots (6 rows × 7 cols, starting Sunday) for the
 * given year/month, populating current-month days with aggregated transaction data.
 *
 * @param opts - Year, month, transactions array and today's ISO date string.
 * @returns Array of 42 CalendarDay objects.
 */
function buildCalendarDays(opts: BuildOptions): CalendarDay[] {
  const { year, month } = opts;
  const ctx = buildContext(opts);
  const firstWeekday = new Date(year, month, 1).getDay();

  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const prevDays = daysInMonth(prevYear, prevMonth);

  const slots: CalendarDay[] = [];
  for (let i = firstWeekday - 1; i >= 0; i--) {
    slots.push(makePaddingDay({ year: prevYear, month: prevMonth, day: prevDays - i, todayIso: ctx.todayIso }));
  }
  slots.push(...buildCurrentMonthSlots(year, month, ctx));

  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  let nextDay = 1;
  while (slots.length < 42) {
    slots.push(makePaddingDay({ year: nextYear, month: nextMonth, day: nextDay++, todayIso: ctx.todayIso }));
  }

  return slots;
}

// ── Composable ────────────────────────────────────────────────────────────────

/**
 * Manages state and data for the financial calendar view.
 *
 * Fetches the current month's transactions from the API, groups them by
 * due_date, calculates daily and cumulative balances, detects cash valleys,
 * and builds the 42-slot grid required by the FinancialCalendar component.
 *
 * @param providedClient - Optional injected TransactionsClient for testing.
 * @returns Reactive state, computed grid and navigation helpers.
 */
export function useFinancialCalendar(
  providedClient?: TransactionsClient,
): UseFinancialCalendarReturn {
  const today = new Date();
  const currentYear = ref<number>(today.getFullYear());
  const currentMonth = ref<number>(today.getMonth());

  const todayIso = toIso(today);

  /** First day of the displayed month as YYYY-MM-DD. */
  const startDate = computed((): string =>
    toIso(new Date(currentYear.value, currentMonth.value, 1)),
  );

  /** Last day of the displayed month as YYYY-MM-DD. */
  const endDate = computed((): string => {
    const last = daysInMonth(currentYear.value, currentMonth.value);
    return toIso(new Date(currentYear.value, currentMonth.value, last));
  });

  const filters = computed(() => ({
    start_date: startDate.value,
    end_date: endDate.value,
  }));

  const { data: transactions, isLoading, isError } = useListTransactionsQuery(
    filters,
    providedClient,
  );

  const monthLabel = computed((): string =>
    new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(
      new Date(currentYear.value, currentMonth.value, 1),
    ),
  );

  const calendarDays = computed((): CalendarDay[] =>
    buildCalendarDays({
      year: currentYear.value,
      month: currentMonth.value,
      transactions: transactions.value ?? [],
      todayIso,
    }),
  );

  /**
   * Navigates the calendar to the previous month.
   */
  const goToPreviousMonth = (): void => {
    if (currentMonth.value === 0) {
      currentMonth.value = 11;
      currentYear.value -= 1;
    } else {
      currentMonth.value -= 1;
    }
  };

  /**
   * Navigates the calendar to the next month.
   */
  const goToNextMonth = (): void => {
    if (currentMonth.value === 11) {
      currentMonth.value = 0;
      currentYear.value += 1;
    } else {
      currentMonth.value += 1;
    }
  };

  return {
    calendarDays,
    currentYear,
    currentMonth,
    monthLabel,
    isLoading: computed(() => isLoading.value),
    isError: computed(() => isError.value),
    goToPreviousMonth,
    goToNextMonth,
  };
}
