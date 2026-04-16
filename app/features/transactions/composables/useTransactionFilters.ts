import { computed, ref, type ComputedRef, type Ref } from "vue";
import type { SelectOption } from "naive-ui";
import type { CalendarDay } from "./useFinancialCalendar";
import { useTagsQuery } from "~/features/tags/queries/use-tags-query";
import { useAccountsQuery } from "~/features/accounts/queries/use-accounts-query";
import type { ListTransactionsFilters } from "~/features/transactions/services/transactions.client";
import type { TransactionStatusDto, TransactionTypeDto } from "~/features/transactions/contracts/transaction.dto";

type FilterType = TransactionTypeDto | "all";
type FilterStatus = TransactionStatusDto | "all";
type ViewMode = "list" | "calendar";

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
  viewMode: Ref<ViewMode>;
  selectedDay: Ref<CalendarDay | null>;
  showDayDetail: Ref<boolean>;
  onDayClick: (day: CalendarDay) => void;
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

  const filterType = ref<FilterType>("all");
  const filterStatus = ref<FilterStatus>("all");
  const filterStartDate = ref<number | null>(null);
  const filterEndDate = ref<number | null>(null);
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
  const filters = computed((): ListTransactionsFilters | undefined => {
    const f: {
      type?: ListTransactionsFilters["type"];
      status?: ListTransactionsFilters["status"];
      start_date?: string;
      end_date?: string;
      tag_id?: string;
    } = {};

    if (filterType.value !== "all") { f.type = filterType.value; }
    if (filterStatus.value !== "all") { f.status = filterStatus.value; }
    if (filterStartDate.value) { f.start_date = new Date(filterStartDate.value).toISOString().slice(0, 10); }
    if (filterEndDate.value) { f.end_date = new Date(filterEndDate.value).toISOString().slice(0, 10); }
    if (filterTagId.value !== "all") { f.tag_id = filterTagId.value; }

    return Object.keys(f).length > 0 ? f : undefined;
  });

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
   * Resets all active filters back to their default (unfiltered) state.
   */
  function clearFilters(): void {
    filterType.value = "all";
    filterStatus.value = "all";
    filterStartDate.value = null;
    filterEndDate.value = null;
    filterTagId.value = "all";
  }

  return {
    filterType,
    filterStatus,
    filterStartDate,
    filterEndDate,
    filterTagId,
    viewMode,
    selectedDay,
    showDayDetail,
    onDayClick,
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
