import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCreateBudgetMutation } from "./use-create-budget-mutation";
import type { BudgetDto, CreateBudgetPayload } from "~/features/budgets/contracts/budget.contracts";

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
  spent: "0.00",
  remaining: "800.00",
  percentage_used: 0,
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
 * Builds a minimal CreateBudgetPayload fixture for testing.
 *
 * @returns CreateBudgetPayload fixture.
 */
const makePayload = (): CreateBudgetPayload => ({
  name: "Alimentação",
  amount: "800.00",
  period: "monthly",
});

describe("useCreateBudgetMutation", () => {
  beforeEach((): void => {
    vi.clearAllMocks();
    useQueryClientMock.mockReturnValue({ invalidateQueries: vi.fn() });
    useMessageMock.mockReturnValue({ success: vi.fn(), error: vi.fn() });
    useMutationMock.mockImplementation((opts: unknown) => opts);
  });

  it("registers the mutation with useMutation", (): void => {
    const client = { createBudget: vi.fn().mockResolvedValue(makeBudget()) };

    useCreateBudgetMutation(client as never);

    expect(useMutationMock).toHaveBeenCalledOnce();
  });

  it("mutationFn calls client.createBudget with the payload", async (): Promise<void> => {
    const budget = makeBudget();
    const client = { createBudget: vi.fn().mockResolvedValue(budget) };
    useMutationMock.mockImplementation(
      (opts: { mutationFn: (p: CreateBudgetPayload) => Promise<BudgetDto> }) => opts,
    );

    const mutation = useCreateBudgetMutation(client as never) as unknown as {
      mutationFn: (payload: CreateBudgetPayload) => Promise<BudgetDto>;
    };

    const payload = makePayload();
    const result = await mutation.mutationFn(payload);

    expect(client.createBudget).toHaveBeenCalledWith(payload);
    expect(result).toEqual(budget);
  });

  it("invalidates the budgets list cache on success", (): void => {
    const client = { createBudget: vi.fn().mockResolvedValue(makeBudget()) };
    const queryClient = { invalidateQueries: vi.fn() };
    useQueryClientMock.mockReturnValue(queryClient);
    useMutationMock.mockImplementation(
      (opts: { onSuccess: (data: BudgetDto, vars: CreateBudgetPayload) => void }) => opts,
    );

    const mutation = useCreateBudgetMutation(client as never) as unknown as {
      onSuccess: (data: BudgetDto, vars: CreateBudgetPayload) => void;
    };

    mutation.onSuccess(makeBudget(), makePayload());

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["budgets", "list"],
    });
  });

  it("propagates errors from client.createBudget", async (): Promise<void> => {
    const client = {
      createBudget: vi.fn().mockRejectedValue(new Error("Validation failed")),
    };
    useMutationMock.mockImplementation(
      (opts: { mutationFn: (p: CreateBudgetPayload) => Promise<BudgetDto> }) => opts,
    );

    const mutation = useCreateBudgetMutation(client as never) as unknown as {
      mutationFn: (payload: CreateBudgetPayload) => Promise<BudgetDto>;
    };

    await expect(mutation.mutationFn(makePayload())).rejects.toThrow("Validation failed");
  });
});
