import { beforeEach, describe, expect, it, vi } from "vitest";

import { useDeleteBudgetMutation } from "./use-delete-budget-mutation";

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

describe("useDeleteBudgetMutation", () => {
  beforeEach((): void => {
    vi.clearAllMocks();
    useQueryClientMock.mockReturnValue({ invalidateQueries: vi.fn() });
    useMessageMock.mockReturnValue({ success: vi.fn(), error: vi.fn() });
    useMutationMock.mockImplementation((opts: unknown) => opts);
  });

  it("registers the mutation with useMutation", (): void => {
    const client = { deleteBudget: vi.fn().mockResolvedValue(undefined) };

    useDeleteBudgetMutation(client as never);

    expect(useMutationMock).toHaveBeenCalledOnce();
  });

  it("mutationFn calls client.deleteBudget with the id and returns undefined", async (): Promise<void> => {
    const client = { deleteBudget: vi.fn().mockResolvedValue(undefined) };
    useMutationMock.mockImplementation(
      (opts: { mutationFn: (id: string) => Promise<undefined> }) => opts,
    );

    const mutation = useDeleteBudgetMutation(client as never) as unknown as {
      mutationFn: (id: string) => Promise<undefined>;
    };

    const result = await mutation.mutationFn("budget-001");

    expect(client.deleteBudget).toHaveBeenCalledWith("budget-001");
    expect(result).toBeUndefined();
  });

  it("invalidates the budgets list cache on success", (): void => {
    const client = { deleteBudget: vi.fn().mockResolvedValue(undefined) };
    const queryClient = { invalidateQueries: vi.fn() };
    useQueryClientMock.mockReturnValue(queryClient);
    useMutationMock.mockImplementation(
      (opts: { onSuccess: (data: undefined, id: string) => void }) => opts,
    );

    const mutation = useDeleteBudgetMutation(client as never) as unknown as {
      onSuccess: (data: undefined, id: string) => void;
    };

    mutation.onSuccess(undefined, "budget-001");

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["budgets", "list"],
    });
  });

  it("propagates errors from client.deleteBudget", async (): Promise<void> => {
    const client = {
      deleteBudget: vi.fn().mockRejectedValue(new Error("Not found")),
    };
    useMutationMock.mockImplementation(
      (opts: { mutationFn: (id: string) => Promise<undefined> }) => opts,
    );

    const mutation = useDeleteBudgetMutation(client as never) as unknown as {
      mutationFn: (id: string) => Promise<undefined>;
    };

    await expect(mutation.mutationFn("budget-001")).rejects.toThrow("Not found");
  });
});
