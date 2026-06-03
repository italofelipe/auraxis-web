import { defineComponent } from "vue";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import DashboardCalendarPanel from "../DashboardCalendarPanel.vue";
import type { CalendarDay } from "~/features/transactions/composables/useFinancialCalendar";

const UiSurfaceCardStub = defineComponent({
  name: "UiSurfaceCard",
  template: "<section class=\"ui-surface-card-stub\"><slot /></section>",
});

const FinancialCalendarStub = defineComponent({
  name: "FinancialCalendar",
  emits: ["day-click"],
  template: "<div class=\"financial-calendar-stub\" />",
});

const CalendarDayDetailStub = defineComponent({
  name: "CalendarDayDetail",
  props: ["day", "visible"],
  emits: ["update:visible"],
  template: "<div class=\"calendar-day-detail-stub\" :data-visible=\"visible\" />",
});

const stubs = {
  UiSurfaceCard: UiSurfaceCardStub,
  FinancialCalendar: FinancialCalendarStub,
  CalendarDayDetail: CalendarDayDetailStub,
};

const mountOptions = {
  global: {
    stubs,
    mocks: { $t: (key: string): string => key },
  },
};

/**
 * Builds a minimal CalendarDay fixture for the given day-of-month.
 *
 * @param dayOfMonth Numeric day of month for the fixture.
 * @returns CalendarDay with empty transaction aggregates.
 */
function makeDay(dayOfMonth: number): CalendarDay {
  return {
    date: `2026-06-${String(dayOfMonth).padStart(2, "0")}`,
    dayOfMonth,
    isCurrentMonth: true,
    isToday: false,
    transactions: [],
    totalIncome: 0,
    totalExpense: 0,
    dailyBalance: 0,
    cumulativeBalance: 0,
    isCashValley: false,
  };
}

describe("DashboardCalendarPanel", () => {
  it("renders the financial calendar inside a surface card", () => {
    const wrapper = mount(DashboardCalendarPanel, mountOptions);
    expect(wrapper.findComponent(FinancialCalendarStub).exists()).toBe(true);
    expect(wrapper.findComponent(UiSurfaceCardStub).exists()).toBe(true);
  });

  it("keeps the day-detail modal hidden until a day is clicked", () => {
    const wrapper = mount(DashboardCalendarPanel, mountOptions);
    const detail = wrapper.findComponent(CalendarDayDetailStub);
    expect(detail.props("visible")).toBe(false);
    expect(detail.props("day")).toBeNull();
  });

  it("opens the day-detail modal with the clicked day on day-click", async () => {
    const wrapper = mount(DashboardCalendarPanel, mountOptions);
    const day = makeDay(12);

    await wrapper.findComponent(FinancialCalendarStub).vm.$emit("day-click", day);

    const detail = wrapper.findComponent(CalendarDayDetailStub);
    expect(detail.props("visible")).toBe(true);
    expect(detail.props("day")).toEqual(day);
  });

  it("closes the modal when CalendarDayDetail emits update:visible(false)", async () => {
    const wrapper = mount(DashboardCalendarPanel, mountOptions);

    await wrapper.findComponent(FinancialCalendarStub).vm.$emit("day-click", makeDay(5));
    expect(wrapper.findComponent(CalendarDayDetailStub).props("visible")).toBe(true);

    await wrapper.findComponent(CalendarDayDetailStub).vm.$emit("update:visible", false);
    expect(wrapper.findComponent(CalendarDayDetailStub).props("visible")).toBe(false);
  });
});
