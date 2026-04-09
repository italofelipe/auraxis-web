import { ref, computed } from "vue";
import { mount } from "@vue/test-utils";
import { describe, it, expect, vi, beforeEach } from "vitest";

import FinancialCalendar from "../FinancialCalendar.vue";
import type { CalendarDay } from "~/features/transactions/composables/useFinancialCalendar";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const goToPreviousMonthMock = vi.fn();
const goToNextMonthMock = vi.fn();

const useFinancialCalendarMock = vi.fn();

vi.mock("~/features/transactions/composables/useFinancialCalendar", () => ({
  useFinancialCalendar: (): unknown => useFinancialCalendarMock(),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

/**
 * Builds a minimal CalendarDay fixture.
 *
 * @param overrides - Partial overrides applied on top of the default fixture.
 * @returns A complete CalendarDay fixture.
 */
function makeDay(overrides: Partial<CalendarDay> = {}): CalendarDay {
  return {
    date: "2026-04-15",
    dayOfMonth: 15,
    isCurrentMonth: true,
    isToday: false,
    transactions: [],
    totalIncome: 0,
    totalExpense: 0,
    dailyBalance: 0,
    cumulativeBalance: 0,
    isCashValley: false,
    ...overrides,
  };
}

/**
 * Builds 42 CalendarDay fixtures for use in the grid.
 *
 * @param overrides - Sparse overrides keyed by slot index (0–41).
 * @returns Array of 42 CalendarDay objects.
 */
function make42Days(overrides: Partial<Record<number, Partial<CalendarDay>>> = {}): CalendarDay[] {
  return Array.from({ length: 42 }, (_, i) =>
    makeDay({
      date: `2026-04-${String(i + 1).padStart(2, "0")}`,
      dayOfMonth: i + 1,
      isCurrentMonth: i >= 0 && i < 30,
      ...overrides[i],
    }),
  );
}

// ── Mount helper ──────────────────────────────────────────────────────────────

/**
 * Mounts FinancialCalendar with a controlled composable mock state.
 *
 * @param days - 42 CalendarDay objects for the grid.
 * @param options - Optional state overrides (loading, error).
 * @param options.isLoading - Whether the loading state is active.
 * @param options.isError - Whether the error state is active.
 * @returns VueWrapper around the mounted component.
 */
function mountCalendar(
  days: CalendarDay[] = make42Days(),
  options: { isLoading?: boolean; isError?: boolean } = {},
): ReturnType<typeof mount> {
  useFinancialCalendarMock.mockReturnValue({
    calendarDays: computed(() => days),
    currentYear: ref(2026),
    currentMonth: ref(3),
    monthLabel: computed(() => "abril de 2026"),
    isLoading: computed(() => options.isLoading ?? false),
    isError: computed(() => options.isError ?? false),
    goToPreviousMonth: goToPreviousMonthMock,
    goToNextMonth: goToNextMonthMock,
  });

  return mount(FinancialCalendar, {
    global: {
      stubs: {
        UiSurfaceCard: { template: "<div><slot /></div>" },
        UiPageLoader: { template: "<div class=\"ui-page-loader\" />" },
        UiInlineError: {
          props: ["title", "message"],
          template: "<div class=\"ui-inline-error\">{{ title }}</div>",
        },
        UiEmptyState: { template: "<div class=\"ui-empty-state\" />" },
      },
    },
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("FinancialCalendar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the month label", () => {
    const wrapper = mountCalendar();
    expect(wrapper.text()).toContain("abril de 2026");
  });

  it("renders 7 day-of-week headers", () => {
    const wrapper = mountCalendar();
    const headers = wrapper.findAll(".financial-calendar__day-header");
    expect(headers).toHaveLength(7);
  });

  it("renders 42 day cells", () => {
    const wrapper = mountCalendar();
    const cells = wrapper.findAll(".financial-calendar__cell");
    expect(cells).toHaveLength(42);
  });

  it("shows loading state", () => {
    const wrapper = mountCalendar([], { isLoading: true });
    expect(wrapper.find(".ui-page-loader").exists()).toBe(true);
  });

  it("shows error state", () => {
    const wrapper = mountCalendar([], { isError: true });
    expect(wrapper.find(".ui-inline-error").exists()).toBe(true);
  });

  it("marks today's cell with the today class", () => {
    const days = make42Days({ 14: { isToday: true, isCurrentMonth: true } });
    const wrapper = mountCalendar(days);
    const todayCells = wrapper.findAll(".financial-calendar__cell--today");
    expect(todayCells).toHaveLength(1);
  });

  it("marks cash valley cells with the valley class", () => {
    const days = make42Days({
      4: { isCashValley: true, isCurrentMonth: true },
      5: { isCashValley: true, isCurrentMonth: true },
      6: { isCashValley: true, isCurrentMonth: true },
    });
    const wrapper = mountCalendar(days);
    const valleyCells = wrapper.findAll(".financial-calendar__cell--valley");
    expect(valleyCells).toHaveLength(3);
  });

  it("calls goToPreviousMonth when the previous button is clicked", async () => {
    const wrapper = mountCalendar();
    const buttons = wrapper.findAll(".financial-calendar__nav-btn");
    await buttons[0]?.trigger("click");
    expect(goToPreviousMonthMock).toHaveBeenCalledOnce();
  });

  it("calls goToNextMonth when the next button is clicked", async () => {
    const wrapper = mountCalendar();
    const buttons = wrapper.findAll(".financial-calendar__nav-btn");
    await buttons[1]?.trigger("click");
    expect(goToNextMonthMock).toHaveBeenCalledOnce();
  });

  it("emits day-click when a current-month cell is clicked", async () => {
    const clickableDay = makeDay({ isCurrentMonth: true, dayOfMonth: 10, date: "2026-04-10" });
    const days = make42Days({ 9: clickableDay });
    const wrapper = mountCalendar(days);

    const cells = wrapper.findAll(".financial-calendar__cell");
    await cells[9]?.trigger("click");

    const emitted = wrapper.emitted("day-click");
    expect(emitted).toBeDefined();
    expect(emitted?.length).toBeGreaterThanOrEqual(1);
  });

  it("shows income icon when totalIncome > 0", () => {
    const days = make42Days({ 0: { totalIncome: 500, isCurrentMonth: true } });
    const wrapper = mountCalendar(days);
    expect(wrapper.find(".financial-calendar__icon--income").exists()).toBe(true);
  });

  it("shows expense icon when totalExpense > 0", () => {
    const days = make42Days({ 0: { totalExpense: 200, isCurrentMonth: true } });
    const wrapper = mountCalendar(days);
    expect(wrapper.find(".financial-calendar__icon--expense").exists()).toBe(true);
  });

  it("renders the legend", () => {
    const wrapper = mountCalendar();
    expect(wrapper.find(".financial-calendar__legend").exists()).toBe(true);
  });
});
