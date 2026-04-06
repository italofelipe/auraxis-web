import { beforeEach, describe, expect, it, vi } from "vitest";

import { useUpdateBudgetMutation, type UpdateBudgetVariables } from "./use-update-budget-mutation";
import type { BudgetDto } from "~/features/budgets/contracts/budget.contracts";

const useMutationMock = vi.hoisted(() => vi.fn());
const useQueryClientMock = vi.hoisted(() => vi.fn());
const useMessageMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({
  useMutation: useMutationMock,
  useQueryClient: useQueryClientMock,
}));

vi.mock("naive-ui", () => ({
  useMessage: useMessageMock,
}));

/**
 * Builds a minimal BudgetDto fixture for testing.
 *
 * @returns BudgetDto fixture.
 */
const makeBudget = (): BudgetDto => ({
  id: "budget-001",
  name: "Alimentação",
  amount: "800.00",
  spent: "200.00",
  remaining: "600.00",
  percentage_used: 25,
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

/**
 * Builds a minimal UpdateBudgetVariables fixture for testing.
 *
 * @returns UpdateBudgetVariables fixture.
 */
const makeVars = (): UpdateBudgetVariables => ({
  id: "budget-001",
  name: "Alimentação Updated",
  amount: "1000.00",
});

describe("useUpdateBudgetMutation", () => {
  beforeEach((): void => {
    vi.clearAllMocks();
    useQueryClientMock.mockReturnValue({ invalidateQueries: vi.fn() });
    useMessageMock.mockReturnValue({ success: vi.fn(), error: vi.fn() });
    useMutationMock.mockImplementation((opts: unknown) => opts);
  });

  it("registers the mutation with useMutation", (): void => {
    const client = { updateBudget: vi.fn().mockResolvedValue(makeBudget()) };

    useUpdateBudgetMutation(client as never);

    expect(useMutationMock).toHaveBeenCalledOnce();
  });

  it("mutationFn calls client.updateBudget with id extracted from variables", async (): Promise<void> => {
    const budget = makeBudget();
    const client = { updateBudget: vi.fn().mockResolvedValue(budget) };
    useMutationMock.mockImplementation(
      (opts: { mutationFn: (v: UpdateBudgetVariables) => Promise<BudgetDto> }) => opts,
    );

    const mutation = useUpdateBudgetMutation(client as never) as unknown as {
      mutationFn: (vars: UpdateBudgetVariables) => Promise<BudgetDto>;
    };

    const vars = makeVars();
    const result = await mutation.mutationFn(vars);

    expect(client.updateBudget).toHaveBeenCalledWith("budget-001", {
      name: "Alimentação Updated",
      amount: "1000.00",
    });
    expect(result).toEqual(budget);
  });

  it("invalidates the budgets list cache on success", (): void => {
    const client = { updateBudget: vi.fn().mockResolvedValue(makeBudget()) };
    const queryClient = { invalidateQueries: vi.fn() };
    useQueryClientMock.mockReturnValue(queryClient);
    useMutationMock.mockImplementation(
      (opts: { onSuccess: (data: BudgetDto, vars: UpdateBudgetVariables) => void }) => opts,
    );

    const mutation = useUpdateBudgetMutation(client as never) as unknown as {
      onSuccess: (data: BudgetDto, vars: UpdateBudgetVariables) => void;
    };

    mutation.onSuccess(makeBudget(), makeVars());

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["budgets", "list"],
    });
  });

  it("propagates errors from client.updateBudget", async (): Promise<void> => {
    const client = {
      updateBudget: vi.fn().mockRejectedValue(new Error("Update failed")),
    };
    useMutationMock.mockImplementation(
      (opts: { mutationFn: (v: UpdateBudgetVariables) => Promise<BudgetDto> }) => opts,
    );

    const mutation = useUpdateBudgetMutation(client as never) as unknown as {
      mutationFn: (vars: UpdateBudgetVariables) => Promise<BudgetDto>;
    };

    await expect(mutation.mutationFn(makeVars())).rejects.toThrow("Update failed");
  });
});
