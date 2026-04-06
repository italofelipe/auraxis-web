import { ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useBudgetQuery } from "./use-budget-query";
import type { BudgetDto } from "~/features/budgets/contracts/budget.contracts";

const useQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({
  useQuery: useQueryMock,
}));

vi.mock("~/core/config", () => ({
  isMockDataEnabled: (): boolean => false,
}));

/**
 * Builds a minimal BudgetDto fixture for testing.
 *
 * @returns BudgetDto fixture.
 */
const makeBudgetDto = (): BudgetDto => ({
  id: "budget-001",
  name: "Alimentação",
  amount: "800.00",
  spent: "450.00",
  remaining: "350.00",
  percentage_used: 56.25,
  period: "monthly",
  start_date: null,
  end_date: null,
  tag_id: null,
  tag_name: null,
  tag_color: null,
  is_active: true,
  is_over_budget: false,
  created_at: "2026-04-01T10:00:00Z",
  updated_at: "2026-04-01T10:00:00Z",
});

describe("useBudgetQuery", () => {
  beforeEach((): void => {
    vi.clearAllMocks();
  });

  it("registers with the canonical budget detail query key", (): void => {
    const client = { getBudget: vi.fn().mockResolvedValue(makeBudgetDto()) };
    useQueryMock.mockImplementation((opts: Record<string, unknown>) => opts);

    const query = useBudgetQuery("budget-001", client as never) as unknown as {
      queryKey: readonly ["budgets", "detail", string];
    };

    expect(query.queryKey[0]).toBe("budgets");
    expect(query.queryKey[1]).toBe("detail");
    expect(query.queryKey[2]).toBe("budget-001");
  });

  it("calls client.getBudget with the resolved string id", async (): Promise<void> => {
    const budget = makeBudgetDto();
    const client = { getBudget: vi.fn().mockResolvedValue(budget) };
    useQueryMock.mockImplementation(
      (opts: { queryFn: () => Promise<BudgetDto> }) => opts,
    );

    const query = useBudgetQuery("budget-001", client as never) as unknown as {
      queryFn: () => Promise<BudgetDto>;
    };

    const result = await query.queryFn();

    expect(client.getBudget).toHaveBeenCalledWith("budget-001");
    expect(result).toEqual(budget);
  });

  it("resolves a reactive ref id correctly", async (): Promise<void> => {
    const idRef = ref("budget-ref-01");
    const budget = { ...makeBudgetDto(), id: "budget-ref-01" };
    const client = { getBudget: vi.fn().mockResolvedValue(budget) };
    useQueryMock.mockImplementation(
      (opts: { queryFn: () => Promise<BudgetDto> }) => opts,
    );

    const query = useBudgetQuery(idRef, client as never) as unknown as {
      queryFn: () => Promise<BudgetDto>;
    };

    await query.queryFn();

    expect(client.getBudget).toHaveBeenCalledWith("budget-ref-01");
  });

  it("propagates errors from client.getBudget without catching them", async (): Promise<void> => {
    const client = {
      getBudget: vi.fn().mockRejectedValue(new Error("Not found")),
    };
    useQueryMock.mockImplementation(
      (opts: { queryFn: () => Promise<BudgetDto> }) => opts,
    );

    const query = useBudgetQuery("budget-001", client as never) as unknown as {
      queryFn: () => Promise<BudgetDto>;
    };

    await expect(query.queryFn()).rejects.toThrow("Not found");
  });
});
