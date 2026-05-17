import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTransactionFilters } from "../useTransactionFilters";

vi.mock("~/features/tags/queries/use-tags-query", () => ({
  useTagsQuery: (): { data: { value: { id: string; name: string; color: string | null }[] } } => ({
    data: { value: [{ id: "t1", name: "Food", color: "#FF6B6B" }, { id: "t2", name: "Travel", color: null }] },
  }),
}));

vi.mock("~/features/accounts/queries/use-accounts-query", () => ({
  useAccountsQuery: (): { data: { value: { id: string; name: string }[] } } => ({ data: { value: [{ id: "a1", name: "Checking" }] } }),
}));

vi.mock("vue-i18n", () => ({
  useI18n: (): { t: (key: string) => string } => ({ t: (key: string): string => key }),
}));

describe("useTransactionFilters", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 17, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("initialises filters to the current month by default", () => {
    const { filterType, filterStatus, filterStartDate, filterEndDate, filterTagId, periodLabel, periodMode } = useTransactionFilters();
    expect(filterType.value).toBe("all");
    expect(filterStatus.value).toBe("all");
    expect(filterStartDate.value).toBe(new Date(2026, 4, 1).getTime());
    expect(filterEndDate.value).toBe(new Date(2026, 4, 31).getTime());
    expect(filterTagId.value).toBe("all");
    expect(periodMode.value).toBe("month");
    expect(periodLabel.value).toBe("Maio de 2026");
  });

  it("returns current month filters by default", () => {
    const { filters } = useTransactionFilters();
    expect(filters.value).toMatchObject({
      start_date: "2026-05-01",
      end_date: "2026-05-31",
    });
  });

  it("includes type in filters when filterType is set", () => {
    const { filterType, filters } = useTransactionFilters();
    filterType.value = "income";
    expect(filters.value?.type).toBe("income");
  });

  it("includes status in filters when filterStatus is set", () => {
    const { filterStatus, filters } = useTransactionFilters();
    filterStatus.value = "pending";
    expect(filters.value?.status).toBe("pending");
  });

  it("converts timestamp to YYYY-MM-DD for start_date filter", () => {
    const { filterStartDate, filters } = useTransactionFilters();
    filterStartDate.value = new Date(2026, 0, 15).getTime();
    expect(filters.value?.start_date).toBe("2026-01-15");
  });

  it("clearFilters resets all filter refs to the current month defaults", () => {
    const { filterType, filterStatus, filterStartDate, filterEndDate, filterTagId, clearFilters, periodLabel } = useTransactionFilters();
    filterType.value = "expense";
    filterStatus.value = "paid";
    filterStartDate.value = 123456789;
    filterEndDate.value = 987654321;
    filterTagId.value = "t1";
    clearFilters();
    expect(filterType.value).toBe("all");
    expect(filterStatus.value).toBe("all");
    expect(filterStartDate.value).toBe(new Date(2026, 4, 1).getTime());
    expect(filterEndDate.value).toBe(new Date(2026, 4, 31).getTime());
    expect(filterTagId.value).toBe("all");
    expect(periodLabel.value).toBe("Maio de 2026");
  });

  it("goes to previous and next months with month labels", () => {
    const { goToPreviousMonth, goToNextMonth, periodLabel, filters } = useTransactionFilters();

    goToPreviousMonth();
    expect(periodLabel.value).toBe("Abril de 2026");
    expect(filters.value).toMatchObject({ start_date: "2026-04-01", end_date: "2026-04-30" });

    goToNextMonth();
    goToNextMonth();
    expect(periodLabel.value).toBe("Junho de 2026");
    expect(filters.value).toMatchObject({ start_date: "2026-06-01", end_date: "2026-06-30" });
  });

  it("shows a custom period range when date filters no longer match the selected month", () => {
    const { filterStartDate, filterEndDate, periodMode, periodLabel } = useTransactionFilters();

    filterStartDate.value = new Date(2026, 0, 2).getTime();
    filterEndDate.value = new Date(2026, 1, 28).getTime();

    expect(periodMode.value).toBe("custom");
    expect(periodLabel.value).toBe("02/01/2026 - 28/02/2026");
  });

  it("tagMap contains entries from loaded tags", () => {
    const { tagMap } = useTransactionFilters();
    expect(tagMap.value.get("t1")).toBe("Food");
  });

  it("tagDetailMap exposes both name and colour for a tag with a colour", () => {
    const { tagDetailMap } = useTransactionFilters();
    expect(tagDetailMap.value.get("t1")).toStrictEqual({ name: "Food", color: "#FF6B6B" });
  });

  it("tagDetailMap returns null colour for tags without a colour", () => {
    const { tagDetailMap } = useTransactionFilters();
    expect(tagDetailMap.value.get("t2")).toStrictEqual({ name: "Travel", color: null });
  });

  it("accountMap contains entries from loaded accounts", () => {
    const { accountMap } = useTransactionFilters();
    expect(accountMap.value.get("a1")).toBe("Checking");
  });

  it("onDayClick opens the day detail modal with the selected day", () => {
    const { selectedDay, showDayDetail, onDayClick } = useTransactionFilters();
    const day = { date: "2026-01-01", transactions: [], income: 0, expense: 0 };
    onDayClick(day as never);
    expect(showDayDetail.value).toBe(true);
    expect(selectedDay.value).toStrictEqual(day);
  });

  it("defaults viewMode to list", () => {
    const { viewMode } = useTransactionFilters();
    expect(viewMode.value).toBe("list");
  });
});
