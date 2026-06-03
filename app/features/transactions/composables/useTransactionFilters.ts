import { computed, ref, type ComputedRef, type Ref } from "vue";
import type { SelectOption } from "naive-ui";
import type { CalendarDay } from "~/components/financial-calendar/FinancialCalendar/FinancialCalendar.types";
import { useTagsQuery } from "~/features/tags/queries/use-tags-query";
import { useAccountsQuery } from "~/features/accounts/queries/use-accounts-query";
import type { ListTransactionsFilters } from "~/features/transactions/services/transactions.client";
import type { TransactionStatusDto, TransactionTypeDto } from "~/features/transactions/contracts/transaction.dto";

type FilterType = TransactionTypeDto | "all";
type FilterStatus = TransactionStatusDto | "all";
type ViewMode = "list" | "calendar";
type PeriodMode = "month" | "custom";

interface TransactionPeriodState {
  filterStartDate: Ref<number | null>;
  filterEndDate: Ref<number | null>;
  periodMode: ComputedRef<PeriodMode>;
  periodLabel: ComputedRef<string>;
  periodRangeLabel: ComputedRef<string>;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  resetToCurrentMonth: () => void;
}

interface TransactionFilterRefs {
  filterType: Ref<FilterType>;
  filterStatus: Ref<FilterStatus>;
  filterStartDate: Ref<number | null>;
  filterEndDate: Ref<number | null>;
  filterTagId: Ref<string | "all">;
}

/**
 * Returns the first calendar day for the month that contains the provided date.
 *
 * @param date Date inside the desired month.
 * @returns Local Date set to the first day of that month.
 */
function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Returns the last calendar day for the month that contains the provided date.
 *
 * @param date Date inside the desired month.
 * @returns Local Date set to the last day of that month.
 */
function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/**
 * Formats a local timestamp as the API date key expected by the transactions endpoint.
 *
 * @param timestamp Local date timestamp from Naive UI date picker.
 * @returns Date string in YYYY-MM-DD format.
 */
function toDateKey(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Formats a local timestamp for Brazilian display.
 *
 * @param timestamp Local date timestamp from Naive UI date picker.
 * @returns Date string in DD/MM/YYYY format.
 */
function formatBrazilianDate(timestamp: number): string {
  const [year, month, day] = toDateKey(timestamp).split("-");
  return `${day}/${month}/${year}`;
}

/**
 * Formats a month/year label in pt-BR with title-case first letter.
 *
 * @param date Date inside the desired month.
 * @returns Label such as "Maio de 2026".
 */
function formatMonthLabel(date: Date): string {
  const label = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * Creates all reactive period state used by the transactions list.
 *
 * @returns Date refs, labels and month navigation helpers.
 */
function useTransactionPeriod(): TransactionPeriodState {
  const selectedMonth = ref(startOfMonth(new Date()));
  const selectedMonthStart = computed(() => startOfMonth(selectedMonth.value).getTime());
  const selectedMonthEnd = computed(() => endOfMonth(selectedMonth.value).getTime());
  const filterStartDate = ref<number | null>(selectedMonthStart.value);
  const filterEndDate = ref<number | null>(selectedMonthEnd.value);

  const periodMode = computed<PeriodMode>(() =>
    filterStartDate.value === selectedMonthStart.value && filterEndDate.value === selectedMonthEnd.value
      ? "month"
      : "custom",
  );
  const periodRangeLabel = computed(() => formatPeriodRange(filterStartDate.value, filterEndDate.value));
  const periodLabel = computed(() => periodMode.value === "month" ? formatMonthLabel(selectedMonth.value) : periodRangeLabel.value);

  /**
   * Applies the month that contains the provided date to both date filters.
   *
   * @param date Date inside the month to select.
   */
  function applyMonth(date: Date): void {
    selectedMonth.value = startOfMonth(date);
    filterStartDate.value = selectedMonthStart.value;
    filterEndDate.value = selectedMonthEnd.value;
  }

  return {
    filterStartDate,
    filterEndDate,
    periodMode,
    periodLabel,
    periodRangeLabel,
    goToPreviousMonth: () => applyMonth(new Date(selectedMonth.value.getFullYear(), selectedMonth.value.getMonth() - 1, 1)),
    goToNextMonth: () => applyMonth(new Date(selectedMonth.value.getFullYear(), selectedMonth.value.getMonth() + 1, 1)),
    resetToCurrentMonth: () => applyMonth(new Date()),
  };
}

/**
 * Formats the active period range for display.
 *
 * @param startDate Start timestamp or null.
 * @param endDate End timestamp or null.
 * @returns Display range or fallback label.
 */
function formatPeriodRange(startDate: number | null, endDate: number | null): string {
  if (!startDate || !endDate) { return "Período customizado"; }
  return `${formatBrazilianDate(startDate)} - ${formatBrazilianDate(endDate)}`;
}

/**
 * Converts UI filter refs into API query parameters.
 *
 * @param refs Reactive filter refs from the transactions page.
 * @returns API filters or undefined when no filter is active.
 */
function buildListFilters(refs: TransactionFilterRefs): ListTransactionsFilters | undefined {
  const f: {
    type?: ListTransactionsFilters["type"];
    status?: ListTransactionsFilters["status"];
    start_date?: string;
    end_date?: string;
    tag_id?: string;
  } = {};

  if (refs.filterType.value !== "all") { f.type = refs.filterType.value; }
  if (refs.filterStatus.value !== "all") { f.status = refs.filterStatus.value; }
  if (refs.filterStartDate.value) { f.start_date = toDateKey(refs.filterStartDate.value); }
  if (refs.filterEndDate.value) { f.end_date = toDateKey(refs.filterEndDate.value); }
  if (refs.filterTagId.value !== "all") { f.tag_id = refs.filterTagId.value; }

  return Object.keys(f).length > 0 ? f : undefined;
}

/**
 * Calls tag and account queries; centralises lookup data access.
 *
 * @returns Reactive tag and account data refs.
 */
function useLookupQueries(): { tags: ReturnType<typeof useTagsQuery>["data"]; accounts: ReturnType<typeof useAccountsQuery>["data"] } {
  return { tags: useTagsQuery().data, accounts: useAccountsQuery().data };
}

/**
 * Builds reactive lookup maps from tag and account query data.
 *
 * @param tags     Reactive tag list.
 * @param accounts Reactive account list.
 * @returns ComputedRef maps for fast id → name resolution.
 */
export type TagLookup = { name: string; color: string | null };

/**
 * Builds reactive lookup maps from tag and account query data.
 *
 * @param tags     Reactive tag list.
 * @param accounts Reactive account list.
 * @returns ComputedRef maps for fast id → name/color resolution.
 */
function buildLookupMaps(
  tags: ReturnType<typeof useTagsQuery>["data"],
  accounts: ReturnType<typeof useAccountsQuery>["data"],
): { tagMap: ComputedRef<Map<string, string>>; tagDetailMap: ComputedRef<Map<string, TagLookup>>; accountMap: ComputedRef<Map<string, string>> } {
  return {
    tagMap: computed(() => new Map((tags.value ?? []).map((tg: { id: string; name: string }) => [tg.id, tg.name]))),
    tagDetailMap: computed(() => new Map((tags.value ?? []).map((tg: { id: string; name: string; color: string | null }) => [tg.id, { name: tg.name, color: tg.color }]))),
    accountMap: computed(() => new Map((accounts.value ?? []).map((ac: { id: string; name: string }) => [ac.id, ac.name]))),
  };
}

export type UseTransactionFiltersReturn = {
  filterType: Ref<FilterType>;
  filterStatus: Ref<FilterStatus>;
  filterStartDate: Ref<number | null>;
  filterEndDate: Ref<number | null>;
  filterTagId: Ref<string | "all">;
  periodMode: ComputedRef<PeriodMode>;
  periodLabel: ComputedRef<string>;
  periodRangeLabel: ComputedRef<string>;
  viewMode: Ref<ViewMode>;
  selectedDay: Ref<CalendarDay | null>;
  showDayDetail: Ref<boolean>;
  onDayClick: (day: CalendarDay) => void;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  filters: ComputedRef<ListTransactionsFilters | undefined>;
  TYPE_OPTIONS: ComputedRef<SelectOption[]>;
  STATUS_OPTIONS: ComputedRef<SelectOption[]>;
  tagOptions: ComputedRef<SelectOption[]>;
  tagMap: ComputedRef<Map<string, string>>;
  tagDetailMap: ComputedRef<Map<string, TagLookup>>;
  accountMap: ComputedRef<Map<string, string>>;
  clearFilters: () => void;
};

/**
 * Manages all filter state, view mode, calendar selection, and lookup maps
 * for the transactions page.
 *
 * Encapsulates tag and account queries so the page doesn't need to call
 * them directly.
 *
 * @returns Reactive filter state, computed API filters, select options,
 *          lookup maps and a reset helper.
 */
export function useTransactionFilters(): UseTransactionFiltersReturn {
  const { t } = useI18n();
  const period = useTransactionPeriod();

  const filterType = ref<FilterType>("all");
  const filterStatus = ref<FilterStatus>("all");
  const filterTagId = ref<string | "all">("all");

  const viewMode = ref<ViewMode>("list");
  const selectedDay = ref<CalendarDay | null>(null);
  const showDayDetail = ref(false);

  const { tags, accounts } = useLookupQueries();

  /**
   * Opens the CalendarDayDetail modal for the clicked day.
   *
   * @param day - The CalendarDay emitted by FinancialCalendar.
   */
  function onDayClick(day: CalendarDay): void {
    selectedDay.value = day;
    showDayDetail.value = true;
  }

  /**
   * Builds the filter object forwarded to the API query.
   *
   * Type and status filters are sent server-side. Start/end date timestamps
   * (NDatePicker) are converted to YYYY-MM-DD strings.
   *
   * @returns ListTransactionsFilters or undefined when no active filters.
   */
  const filters = computed((): ListTransactionsFilters | undefined =>
    buildListFilters({
      filterType,
      filterStatus,
      filterStartDate: period.filterStartDate,
      filterEndDate: period.filterEndDate,
      filterTagId,
    }),
  );

  const TYPE_OPTIONS = computed((): SelectOption[] => [
    { label: t("transactions.filter.all"), value: "all" },
    { label: t("transactions.filter.income"), value: "income" },
    { label: t("transactions.filter.expense"), value: "expense" },
  ]);

  const STATUS_OPTIONS = computed((): SelectOption[] => [
    { label: t("transactions.filter.all"), value: "all" },
    { label: t("transaction.status.pending"), value: "pending" },
    { label: t("transaction.status.paid"), value: "paid" },
    { label: t("transaction.status.overdue"), value: "overdue" },
    { label: t("transaction.status.cancelled"), value: "cancelled" },
    { label: t("transaction.status.postponed"), value: "postponed" },
  ]);

  /**
   * Options for the tag filter dropdown.
   *
   * Prepends an "All" entry so the user can clear the tag filter.
   *
   * @returns Array of SelectOption derived from the loaded tags list.
   */
  const tagOptions = computed((): SelectOption[] => [
    { label: t("transactions.filter.all"), value: "all" },
    ...(tags.value ?? []).map((tg: { id: string; name: string }) => ({ label: tg.name, value: tg.id })),
  ]);

  const { tagMap, tagDetailMap, accountMap } = buildLookupMaps(tags, accounts);

  /**
   * Resets all active filters back to their default current-month state.
   */
  function clearFilters(): void {
    filterType.value = "all";
    filterStatus.value = "all";
    period.resetToCurrentMonth();
    filterTagId.value = "all";
  }

  return {
    filterType,
    filterStatus,
    filterStartDate: period.filterStartDate,
    filterEndDate: period.filterEndDate,
    filterTagId,
    periodMode: period.periodMode,
    periodLabel: period.periodLabel,
    periodRangeLabel: period.periodRangeLabel,
    viewMode,
    selectedDay,
    showDayDetail,
    onDayClick,
    goToPreviousMonth: period.goToPreviousMonth,
    goToNextMonth: period.goToNextMonth,
    filters,
    TYPE_OPTIONS,
    STATUS_OPTIONS,
    tagOptions,
    tagMap,
    tagDetailMap,
    accountMap,
    clearFilters,
  };
}
