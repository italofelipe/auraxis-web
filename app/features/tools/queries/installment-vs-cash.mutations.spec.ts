import { describe, expect, it, vi } from "vitest";

import { useCreateGoalFromInstallmentVsCashMutation } from "./use-create-goal-from-installment-vs-cash-mutation";
import { useCreatePlannedExpenseFromInstallmentVsCashMutation } from "./use-create-planned-expense-from-installment-vs-cash-mutation";
import { useInstallmentVsCashCalculateMutation } from "./use-installment-vs-cash-calculate-mutation";
import { useSaveInstallmentVsCashMutation } from "./use-save-installment-vs-cash-mutation";

const useMutationMock = vi.hoisted(() => vi.fn());
const invalidateQueriesMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({
  useMutation: useMutationMock,
  useQueryClient: (): { invalidateQueries: typeof invalidateQueriesMock } => ({
    invalidateQueries: invalidateQueriesMock,
  }),
}));

describe("installment-vs-cash mutation hooks", () => {
  it("wires the calculate mutation to client.calculate", async () => {
    const client = {
      calculate: vi.fn().mockResolvedValue({ ok: true }),
    };
    useMutationMock.mockImplementation((options: Record<string, unknown>) => options);

    const mutation = useInstallmentVsCashCalculateMutation(client as never) as
      unknown as {
        mutationFn: (payload: Record<string, unknown>) => Promise<unknown>;
      };

    await mutation.mutationFn({ cash_price: "900.00" });

    expect(client.calculate).toHaveBeenCalledWith({ cash_price: "900.00" });
  });

  it("wires the save mutation to client.save", async () => {
    const client = {
      save: vi.fn().mockResolvedValue({ ok: true }),
    };
    useMutationMock.mockImplementation((options: Record<string, unknown>) => options);

    const mutation = useSaveInstallmentVsCashMutation(client as never) as
      unknown as {
        mutationFn: (payload: Record<string, unknown>) => Promise<unknown>;
      };

    await mutation.mutationFn({ cash_price: "900.00" });

    expect(client.save).toHaveBeenCalledWith({ cash_price: "900.00" });
  });

  it("wires the goal mutation to client.createGoalFromSimulation", async () => {
    const client = {
      createGoalFromSimulation: vi.fn().mockResolvedValue({ ok: true }),
    };
    useMutationMock.mockImplementation((options: Record<string, unknown>) => options);

    const mutation = useCreateGoalFromInstallmentVsCashMutation(
      client as never,
    ) as unknown as {
      mutationFn: (payload: {
        simulationId: string;
        payload: Record<string, unknown>;
      }) => Promise<unknown>;
    };

    await mutation.mutationFn({
      simulationId: "sim-1",
      payload: { title: "Notebook" },
    });

    expect(client.createGoalFromSimulation).toHaveBeenCalledWith("sim-1", {
      title: "Notebook",
    });
  });

  it("wires the planned-expense mutation to client.createPlannedExpenseFromSimulation", async () => {
    const client = {
      createPlannedExpenseFromSimulation: vi.fn().mockResolvedValue({ ok: true }),
    };
    useMutationMock.mockImplementation((options: Record<string, unknown>) => options);

    const mutation = useCreatePlannedExpenseFromInstallmentVsCashMutation(
      client as never,
    ) as unknown as {
      mutationFn: (payload: {
        simulationId: string;
        payload: Record<string, unknown>;
      }) => Promise<unknown>;
    };

    await mutation.mutationFn({
      simulationId: "sim-1",
      payload: { title: "Notebook" },
    });

    expect(client.createPlannedExpenseFromSimulation).toHaveBeenCalledWith(
      "sim-1",
      { title: "Notebook" },
    );
  });
});
