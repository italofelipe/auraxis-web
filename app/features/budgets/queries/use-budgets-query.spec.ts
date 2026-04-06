import { beforeEach, describe, expect, it, vi } from "vitest";

import { useBudgetsQuery } from "./use-budgets-query";
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
  name: "Alimentação Mensal",
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

describe("useBudgetsQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers with the canonical budgets list query key", () => {
    const client = { listBudgets: vi.fn().mockResolvedValue([makeBudgetDto()]) };
    useQueryMock.mockImplementation((opts: Record<string, unknown>) => opts);

    const query = useBudgetsQuery(client as never) as unknown as {
      queryKey: readonly ["budgets", "list"];
    };

    expect(query.queryKey).toEqual(["budgets", "list"]);
  });

  it("calls client.listBudgets and returns the budgets array", async () => {
    const budgets = [makeBudgetDto()];
    const client = { listBudgets: vi.fn().mockResolvedValue(budgets) };
    useQueryMock.mockImplementation(
      (opts: { queryFn: () => Promise<BudgetDto[]> }) => opts,
    );

    const query = useBudgetsQuery(client as never) as unknown as {
      queryFn: () => Promise<BudgetDto[]>;
    };

    const result = await query.queryFn();

    expect(client.listBudgets).toHaveBeenCalledOnce();
    expect(result).toEqual(budgets);
  });

  it("propagates error from client.listBudgets without catching it", async () => {
    const client = {
      listBudgets: vi.fn().mockRejectedValue(new Error("network error")),
    };
    useQueryMock.mockImplementation(
      (opts: { queryFn: () => Promise<BudgetDto[]> }) => opts,
    );

    const query = useBudgetsQuery(client as never) as unknown as {
      queryFn: () => Promise<BudgetDto[]>;
    };

    await expect(query.queryFn()).rejects.toThrow("network error");
  });
});
