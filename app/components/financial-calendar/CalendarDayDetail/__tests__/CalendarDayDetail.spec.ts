import { mount } from "@vue/test-utils";
import { describe, it, expect } from "vitest";
import { NModal, NStatistic, NTag } from "naive-ui";
import { TrendingDown, TrendingUp } from "lucide-vue-next";

import CalendarDayDetail from "../CalendarDayDetail.vue";
import type { CalendarDay } from "~/features/transactions/composables/useFinancialCalendar";
import type { TransactionDto } from "~/features/transactions/contracts/transaction.dto";

// ── Fixtures ──────────────────────────────────────────────────────────────────

/**
 * Builds a minimal TransactionDto fixture.
 *
 * @param overrides - Partial fields applied on top of the defaults.
 * @returns A complete TransactionDto fixture.
 */
function makeTx(overrides: Partial<TransactionDto> = {}): TransactionDto {
  return {
    id: "tx-001",
    title: "Salário",
    amount: "5000.00",
    type: "income",
    due_date: "2026-04-10",
    description: null,
    observation: null,
    is_recurring: false,
    is_installment: false,
    installment_count: null,
    currency: "BRL",
    status: "paid",
    start_date: null,
    end_date: null,
    tag_id: null,
    account_id: null,
    credit_card_id: null,
    installment_group_id: null,
    paid_at: null,
    created_at: null,
    updated_at: null,
    ...overrides,
  };
}

/**
 * Builds a minimal CalendarDay fixture with optional transaction list.
 *
 * @param txs - Transactions to include in the day.
 * @param overrides - Other CalendarDay field overrides.
 * @returns A complete CalendarDay fixture.
 */
function makeDay(
  txs: TransactionDto[] = [],
  overrides: Partial<CalendarDay> = {},
): CalendarDay {
  return {
    date: "2026-04-10",
    dayOfMonth: 10,
    isCurrentMonth: true,
    isToday: false,
    transactions: txs,
    totalIncome: txs.filter((t) => t.type === "income").reduce((s, t) => s + parseFloat(t.amount), 0),
    totalExpense: txs.filter((t) => t.type === "expense").reduce((s, t) => s + parseFloat(t.amount), 0),
    dailyBalance: 0,
    cumulativeBalance: 0,
    isCashValley: false,
    ...overrides,
  };
}

// ── Mount helper ──────────────────────────────────────────────────────────────

/**
 * Mounts CalendarDayDetail with the given day and visibility.
 *
 * @param day - CalendarDay to display (null renders closed modal).
 * @param visible - Whether the modal is visible.
 * @returns VueWrapper around the mounted component.
 */
function mountDetail(
  day: CalendarDay | null,
  visible = true,
): ReturnType<typeof mount> {
  return mount(CalendarDayDetail, {
    props: { day, visible },
    global: {
      stubs: {
        /**
         * NModal's internal component name is "Modal" (not "NModal"), so
         * stubs must use that key.  The stub renders the slot inline when
         * `show` is true, preventing Teleport from moving content outside
         * the wrapper's root element and making `wrapper.find(".css-class")`
         * work as expected.
         */
        Modal: {
          name: "Modal",
          props: { show: Boolean, title: String },
          emits: ["update:show"],
          template: "<div v-if=\"show\"><slot /></div>",
        },
        UiEmptyState: { template: "<div class=\"ui-empty-state\" />" },
      },
    },
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("CalendarDayDetail", () => {
  it("renders NModal", () => {
    const wrapper = mountDetail(makeDay());
    expect(wrapper.findComponent(NModal).exists()).toBe(true);
  });

  it("passes visible prop to NModal", () => {
    const wrapper = mountDetail(makeDay(), true);
    expect(wrapper.findComponent(NModal).props("show")).toBe(true);
  });

  it("shows three NStatistic blocks (income, expense, balance) when day is provided", () => {
    const wrapper = mountDetail(makeDay([makeTx()]));
    const stats = wrapper.findAllComponents(NStatistic);
    expect(stats.length).toBeGreaterThanOrEqual(3);
  });

  it("shows empty state when the day has no transactions", () => {
    const wrapper = mountDetail(makeDay([]));
    expect(wrapper.find(".ui-empty-state").exists()).toBe(true);
  });

  it("renders a list item for each transaction", () => {
    const txs = [
      makeTx({ id: "tx-1", title: "Salário", type: "income" }),
      makeTx({ id: "tx-2", title: "Aluguel", type: "expense", status: "pending" }),
    ];
    const wrapper = mountDetail(makeDay(txs));
    const items = wrapper.findAll(".calendar-day-detail__item");
    expect(items).toHaveLength(2);
  });

  it("shows income icon for income transactions", () => {
    const wrapper = mountDetail(makeDay([makeTx({ type: "income" })]));
    expect(wrapper.findComponent(TrendingUp).exists()).toBe(true);
  });

  it("shows expense icon for expense transactions", () => {
    const wrapper = mountDetail(makeDay([makeTx({ type: "expense" })]));
    expect(wrapper.findComponent(TrendingDown).exists()).toBe(true);
  });

  it("shows valley warning when day is a cash valley", () => {
    const day = makeDay([], { isCashValley: true });
    const wrapper = mountDetail(day);
    expect(wrapper.find(".calendar-day-detail__valley-warning").exists()).toBe(true);
  });

  it("does not show valley warning when day is not a cash valley", () => {
    const wrapper = mountDetail(makeDay([], { isCashValley: false }));
    expect(wrapper.find(".calendar-day-detail__valley-warning").exists()).toBe(false);
  });

  it("emits update:visible=false when modal requests to close", async () => {
    const wrapper = mountDetail(makeDay());
    await wrapper.findComponent(NModal).vm.$emit("update:show", false);
    const emitted = wrapper.emitted("update:visible");
    expect(emitted).toBeDefined();
    expect(emitted?.[0]).toEqual([false]);
  });

  it("renders NTag for each transaction status", () => {
    const txs = [makeTx({ status: "paid" }), makeTx({ id: "tx-2", status: "overdue" })];
    const wrapper = mountDetail(makeDay(txs));
    const tags = wrapper.findAllComponents(NTag);
    expect(tags.length).toBeGreaterThanOrEqual(2);
  });
});
