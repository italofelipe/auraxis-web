import { computed, type ComputedRef } from "vue";
import { describe, expect, it, vi } from "vitest";
import type { TransactionDto } from "~/features/transactions/contracts/transaction.dto";
import { useTransactionRecurrence } from "../useTransactionRecurrence";

type Pattern = { groupKey: string; title: string; count: number };

vi.mock("../useRecurrenceDetection", () => ({
  useRecurrenceDetection: (): { patterns: ComputedRef<Pattern[]> } => ({
    patterns: computed(() => [
      { groupKey: "g1", title: "Netflix", count: 3 },
      { groupKey: "g2", title: "Spotify", count: 2 },
    ]),
  }),
}));

describe("useTransactionRecurrence", () => {
  it("visiblePatterns returns all non-dismissed patterns initially", () => {
    const data = computed<TransactionDto[] | undefined>(() => []);
    const { visiblePatterns } = useTransactionRecurrence(data, vi.fn());
    expect(visiblePatterns.value).toHaveLength(2);
  });

  it("handleRecurrenceDismiss hides the pattern for the session", () => {
    const data = computed<TransactionDto[] | undefined>(() => []);
    const { visiblePatterns, handleRecurrenceDismiss } = useTransactionRecurrence(data, vi.fn());
    handleRecurrenceDismiss("g1");
    expect(visiblePatterns.value.map((p) => p.groupKey)).not.toContain("g1");
    expect(visiblePatterns.value.map((p) => p.groupKey)).toContain("g2");
  });

  it("handleRecurrenceNever hides the pattern and writes to localStorage", () => {
    const setItemSpy = vi.spyOn(globalThis.localStorage, "setItem");
    const data = computed<TransactionDto[] | undefined>(() => []);
    const { visiblePatterns, handleRecurrenceNever } = useTransactionRecurrence(data, vi.fn());
    handleRecurrenceNever("g2");
    expect(visiblePatterns.value.map((p) => p.groupKey)).not.toContain("g2");
    expect(setItemSpy).toHaveBeenCalled();
    setItemSpy.mockRestore();
  });

  it("handleRecurrenceConfirm dismisses the pattern and calls onConfirmExpense", () => {
    const onConfirmExpense = vi.fn();
    const data = computed<TransactionDto[] | undefined>(() => []);
    const { visiblePatterns, handleRecurrenceConfirm } = useTransactionRecurrence(data, onConfirmExpense);
    handleRecurrenceConfirm({ groupKey: "g1", title: "Netflix", count: 3 } as never);
    expect(onConfirmExpense).toHaveBeenCalledTimes(1);
    expect(visiblePatterns.value.map((p) => p.groupKey)).not.toContain("g1");
  });

  it("initialises neverSuggestKeys from localStorage if available", () => {
    vi.spyOn(globalThis.localStorage, "getItem").mockReturnValue(JSON.stringify(["g1"]));
    const data = computed<TransactionDto[] | undefined>(() => []);
    const { visiblePatterns } = useTransactionRecurrence(data, vi.fn());
    expect(visiblePatterns.value.map((p) => p.groupKey)).not.toContain("g1");
    vi.restoreAllMocks();
  });
});
