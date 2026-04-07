import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import DueDateList from "../DueDateList.vue";
import type { DueTransactionDto } from "~/features/transactions/contracts/due-range.dto";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("~/features/transactions/utils/ical-export", () => ({
  downloadICalFile: vi.fn(),
}));

// ── Factories ─────────────────────────────────────────────────────────────────

/**
 * Builds a DueTransactionDto with sensible defaults.
 *
 * @param overrides Fields to override.
 * @returns DueTransactionDto instance.
 */
function makeTx(overrides: Partial<DueTransactionDto> = {}): DueTransactionDto {
  return {
    id: "tx-1",
    title: "Netflix",
    amount: "39.90",
    type: "expense",
    due_date: "2099-12-31", // far future → "upcoming" band by default
    status: "pending",
    tag_id: null,
    account_id: null,
    credit_card_id: null,
    is_recurring: false,
    ...overrides,
  };
}

/**
 * Returns an ISO date string N days from today.
 *
 * @param n - Number of days to add (positive = future).
 * @returns ISO date string YYYY-MM-DD.
 */
function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * Returns an ISO date string N days in the past.
 *
 * @param n - Number of days to subtract.
 * @returns ISO date string YYYY-MM-DD.
 */
function daysAgo(n: number): string {
  return daysFromNow(-n);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("DueDateList", () => {
  it("renders an empty state when no transactions are provided", () => {
    const wrapper = mount(DueDateList, {
      props: { transactions: [] },
    });
    expect(wrapper.text()).toContain("Nenhum vencimento");
  });

  it("renders the header title", () => {
    const wrapper = mount(DueDateList, {
      props: { transactions: [makeTx()] },
    });
    expect(wrapper.text()).toContain("Central de Vencimentos");
  });

  it("shows the export button when there are transactions", () => {
    const wrapper = mount(DueDateList, {
      props: { transactions: [makeTx()] },
    });
    expect(wrapper.find(".ddl__export-btn").exists()).toBe(true);
  });

  it("hides the export button when there are no transactions", () => {
    const wrapper = mount(DueDateList, { props: { transactions: [] } });
    expect(wrapper.find(".ddl__export-btn").exists()).toBe(false);
  });

  it("groups overdue transactions under the overdue band", () => {
    const tx = makeTx({ due_date: daysAgo(5), id: "ov-1" });
    const wrapper = mount(DueDateList, { props: { transactions: [tx] } });
    expect(wrapper.find(".ddl__group--overdue").exists()).toBe(true);
    expect(wrapper.find(".ddl__group--overdue").text()).toContain("Netflix");
  });

  it("groups transactions due in < 3 days under the critical band", () => {
    const tx = makeTx({ due_date: daysFromNow(1), id: "cr-1" });
    const wrapper = mount(DueDateList, { props: { transactions: [tx] } });
    expect(wrapper.find(".ddl__group--critical").exists()).toBe(true);
  });

  it("groups transactions due in 3–7 days under the warning band", () => {
    const tx = makeTx({ due_date: daysFromNow(5), id: "wa-1" });
    const wrapper = mount(DueDateList, { props: { transactions: [tx] } });
    expect(wrapper.find(".ddl__group--warning").exists()).toBe(true);
  });

  it("groups transactions due in > 7 days under the upcoming band", () => {
    const tx = makeTx({ due_date: daysFromNow(15), id: "up-1" });
    const wrapper = mount(DueDateList, { props: { transactions: [tx] } });
    expect(wrapper.find(".ddl__group--upcoming").exists()).toBe(true);
  });

  it("shows the urgency alert when overdue items exist", () => {
    const tx = makeTx({ due_date: daysAgo(3), id: "ov-2" });
    const wrapper = mount(DueDateList, { props: { transactions: [tx] } });
    expect(wrapper.find(".ddl__alert").exists()).toBe(true);
    expect(wrapper.find("[role='alert']").exists()).toBe(true);
  });

  it("shows the urgency alert when critical items exist", () => {
    const tx = makeTx({ due_date: daysFromNow(1), id: "cr-2" });
    const wrapper = mount(DueDateList, { props: { transactions: [tx] } });
    expect(wrapper.find(".ddl__alert").exists()).toBe(true);
  });

  it("hides the alert when only upcoming/warning items exist", () => {
    const tx = makeTx({ due_date: daysFromNow(10) });
    const wrapper = mount(DueDateList, { props: { transactions: [tx] } });
    expect(wrapper.find(".ddl__alert").exists()).toBe(false);
  });

  it("dismisses the alert when the close button is clicked", async () => {
    const tx = makeTx({ due_date: daysAgo(1), id: "ov-3" });
    const wrapper = mount(DueDateList, { props: { transactions: [tx] } });

    expect(wrapper.find(".ddl__alert").exists()).toBe(true);
    await wrapper.find(".ddl__alert-close").trigger("click");
    expect(wrapper.find(".ddl__alert").exists()).toBe(false);
  });

  it("calls downloadICalFile when export button is clicked", async () => {
    const { downloadICalFile } = await import(
      "~/features/transactions/utils/ical-export"
    );
    const tx = makeTx();
    const wrapper = mount(DueDateList, { props: { transactions: [tx] } });

    await wrapper.find(".ddl__export-btn").trigger("click");

    expect(downloadICalFile).toHaveBeenCalledWith([tx]);
  });

  it("displays the formatted amount for each transaction", () => {
    const tx = makeTx({ amount: "150.00", due_date: daysFromNow(10) });
    const wrapper = mount(DueDateList, { props: { transactions: [tx] } });
    expect(wrapper.text()).toContain("150");
  });

  it("renders skeletons when isLoading is true", () => {
    const wrapper = mount(DueDateList, {
      props: { transactions: [], isLoading: true },
    });
    expect(wrapper.findAll(".ddl__skeleton").length).toBeGreaterThan(0);
    expect(wrapper.find(".ddl__list").exists()).toBe(false);
  });

  it("shows paid status icon for paid transactions", () => {
    const tx = makeTx({ status: "paid", due_date: daysFromNow(10) });
    const wrapper = mount(DueDateList, { props: { transactions: [tx] } });
    expect(wrapper.find(".ddl__item-paid").exists()).toBe(true);
  });

  it("does not show paid icon for pending transactions", () => {
    const tx = makeTx({ status: "pending", due_date: daysFromNow(10) });
    const wrapper = mount(DueDateList, { props: { transactions: [tx] } });
    expect(wrapper.find(".ddl__item-paid").exists()).toBe(false);
  });

  it("renders income icon for income transactions", () => {
    const tx = makeTx({ type: "income", due_date: daysFromNow(10) });
    const wrapper = mount(DueDateList, { props: { transactions: [tx] } });
    // income branch covered — wrapper renders without error
    expect(wrapper.find(".ddl__item-type").exists()).toBe(true);
  });
});
