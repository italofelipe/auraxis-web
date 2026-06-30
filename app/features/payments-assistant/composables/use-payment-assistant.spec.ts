import { beforeEach, describe, expect, it, vi } from "vitest";

import type { TransactionDto } from "~/features/transactions/contracts/transaction.dto";

import { usePaymentAssistant } from "./use-payment-assistant";

const h = vi.hoisted(() => ({
  flag: { value: true },
  subData: { value: null as unknown },
  txData: { value: [] as unknown[] },
  markPaid: vi.fn(),
  del: vi.fn(),
  update: vi.fn(),
  restore: vi.fn(),
  useFeatureFlag: vi.fn(),
  useSubscriptionQuery: vi.fn(),
  useListAll: vi.fn(),
  useMarkPaid: vi.fn(),
  useDelete: vi.fn(),
  useUpdate: vi.fn(),
  useRestore: vi.fn(),
}));

vi.mock("~/shared/feature-flags/use-feature-flag", () => ({ useFeatureFlag: h.useFeatureFlag }));
vi.mock("~/features/subscription/queries/use-subscription-query", () => ({
  useSubscriptionQuery: h.useSubscriptionQuery,
}));
vi.mock("~/features/transactions/queries/use-list-all-transactions-query", () => ({
  useListAllTransactionsQuery: h.useListAll,
}));
vi.mock("~/features/transactions/queries/use-mark-transaction-paid-mutation", () => ({
  useMarkTransactionPaidMutation: h.useMarkPaid,
}));
vi.mock("~/features/transactions/queries/use-delete-transaction-mutation", () => ({
  useDeleteTransactionMutation: h.useDelete,
}));
vi.mock("~/features/transactions/queries/use-update-transaction-mutation", () => ({
  useUpdateTransactionMutation: h.useUpdate,
}));
vi.mock("~/features/transactions/queries/use-restore-transaction-mutation", () => ({
  useRestoreTransactionMutation: h.useRestore,
}));

/**
 * Fixed clock for deterministic eligibility math.
 *
 * @returns 2026-06-29 (local).
 */
const NOW = (): Date => new Date(2026, 5, 29);

/**
 * Builds a TransactionDto with overdue-expense defaults.
 *
 * @param overrides Fields to override.
 * @returns A transaction fixture.
 */
const tx = (overrides: Partial<TransactionDto> = {}): TransactionDto =>
  ({
    id: "tx",
    title: "Conta",
    amount: "100.00",
    type: "expense",
    due_date: "2026-04-01",
    status: "pending",
    description: null,
    observation: null,
    paid_at: null,
    created_at: "2026-03-01T00:00:00Z",
    ...overrides,
  }) as TransactionDto;

const premiumSub = {
  id: "s",
  planSlug: "premium",
  status: "active",
  trialEndsAt: null,
  currentPeriodEnd: null,
  provider: null,
  providerSubscriptionId: null,
};

describe("usePaymentAssistant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.flag.value = true;
    h.subData.value = premiumSub;
    h.txData.value = [
      tx({ id: "a", due_date: "2026-02-01" }),
      tx({ id: "b", due_date: "2026-03-01" }),
      tx({ id: "recent", due_date: "2026-06-25" }),
      tx({ id: "settled", status: "paid", due_date: "2026-01-01" }),
    ];
    h.markPaid.mockResolvedValue(undefined);
    h.del.mockResolvedValue(undefined);
    h.update.mockResolvedValue(undefined);
    h.restore.mockResolvedValue(undefined);
    h.useFeatureFlag.mockReturnValue(h.flag);
    h.useSubscriptionQuery.mockReturnValue({ data: h.subData });
    h.useListAll.mockReturnValue({ data: h.txData });
    h.useMarkPaid.mockReturnValue({ mutateAsync: h.markPaid });
    h.useDelete.mockReturnValue({ mutateAsync: h.del });
    h.useUpdate.mockReturnValue({ mutateAsync: h.update });
    h.useRestore.mockReturnValue({ mutateAsync: h.restore });
    sessionStorage.clear();
  });

  it("derives Premium from the subscription query", () => {
    expect(usePaymentAssistant(NOW).isPremium.value).toBe(true);
    h.subData.value = { ...premiumSub, planSlug: "free" };
    expect(usePaymentAssistant(NOW).isPremium.value).toBe(false);
  });

  it("selects only overdue open candidates, oldest first", () => {
    const a = usePaymentAssistant(NOW);
    expect(a.candidates.value.map((t) => t.id)).toEqual(["a", "b"]);
  });

  it("auto-opens for a Premium user with candidates and marks the session", () => {
    const a = usePaymentAssistant(NOW);
    expect(a.maybeAutoOpen(false)).toBe(true);
    expect(a.isOpen.value).toBe(true);
    // Second instance must not auto-open again in the same session.
    expect(usePaymentAssistant(NOW).maybeAutoOpen(false)).toBe(false);
  });

  it("does not auto-open while held by another modal", () => {
    const a = usePaymentAssistant(NOW);
    expect(a.maybeAutoOpen(true)).toBe(false);
    expect(a.isOpen.value).toBe(false);
  });

  it("pays the current card and advances", async () => {
    const a = usePaymentAssistant(NOW);
    a.open();
    expect(a.current.value?.id).toBe("a");
    await a.pay();
    expect(h.markPaid).toHaveBeenCalledWith({ id: "a", paidAt: expect.any(String) });
    expect(a.current.value?.id).toBe("b");
    expect(a.progress.value).toEqual({ current: 2, total: 2 });
  });

  it("discards the current card via soft-delete and advances", async () => {
    const a = usePaymentAssistant(NOW);
    a.open();
    await a.discard();
    expect(h.del).toHaveBeenCalledWith({ id: "a", scope: "occurrence" });
    expect(a.current.value?.id).toBe("b");
  });

  it("skips without mutating", () => {
    const a = usePaymentAssistant(NOW);
    a.open();
    a.skipCard();
    expect(h.markPaid).not.toHaveBeenCalled();
    expect(h.del).not.toHaveBeenCalled();
    expect(a.current.value?.id).toBe("b");
  });

  it("marks all remaining cards as paid", async () => {
    const a = usePaymentAssistant(NOW);
    a.open();
    await a.markAllPaid();
    expect(h.markPaid).toHaveBeenCalledTimes(2);
    expect(a.isDone.value).toBe(true);
  });

  it("undo of a payment reverts the status back to pending", async () => {
    const a = usePaymentAssistant(NOW);
    a.open();
    await a.pay();
    const undone = await a.undo();
    expect(undone?.kind).toBe("paid");
    expect(h.update).toHaveBeenCalledWith({
      id: "a",
      payload: { status: "pending", paid_at: null },
    });
    expect(a.current.value?.id).toBe("a");
  });

  it("undo of a delete restores the transaction", async () => {
    const a = usePaymentAssistant(NOW);
    a.open();
    await a.discard();
    await a.undo();
    expect(h.restore).toHaveBeenCalledWith("a");
  });

  it("undo is a no-op when nothing was done", async () => {
    const a = usePaymentAssistant(NOW);
    a.open();
    expect(await a.undo()).toBeNull();
    expect(h.update).not.toHaveBeenCalled();
    expect(h.restore).not.toHaveBeenCalled();
  });
});
