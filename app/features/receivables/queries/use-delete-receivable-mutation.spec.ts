import { beforeEach, describe, expect, it, vi } from "vitest";

import { useDeleteReceivableMutation } from "./use-delete-receivable-mutation";

const useMutationMock = vi.hoisted(() => vi.fn());
const invalidateQueriesMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({
  useMutation: useMutationMock,
  useQueryClient: (): { invalidateQueries: typeof invalidateQueriesMock } => ({
    invalidateQueries: invalidateQueriesMock,
  }),
}));

describe("useDeleteReceivableMutation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useMutationMock.mockImplementation((options: unknown) => options);
  });

  it("calls client.deleteReceivable with the given id", async () => {
    const client = { deleteReceivable: vi.fn().mockResolvedValue(undefined) };

    const mutation = useDeleteReceivableMutation(client as never) as unknown as {
      mutationFn: (id: string) => Promise<void>;
    };

    await mutation.mutationFn("entry-42");

    expect(client.deleteReceivable).toHaveBeenCalledWith("entry-42");
  });

  it("invalidates receivables list and summary queries on success", async () => {
    invalidateQueriesMock.mockResolvedValue(undefined);
    const client = { deleteReceivable: vi.fn().mockResolvedValue(undefined) };

    const mutation = useDeleteReceivableMutation(client as never) as unknown as {
      onSuccess: () => Promise<void>;
    };

    await mutation.onSuccess();

    expect(invalidateQueriesMock).toHaveBeenCalledWith({
      queryKey: ["receivables", "list"],
    });
    expect(invalidateQueriesMock).toHaveBeenCalledWith({
      queryKey: ["receivables", "summary"],
    });
  });

  it("propagates errors from client.deleteReceivable without catching", async () => {
    const client = {
      deleteReceivable: vi.fn().mockRejectedValue(new Error("server error")),
    };

    const mutation = useDeleteReceivableMutation(client as never) as unknown as {
      mutationFn: (id: string) => Promise<void>;
    };

    await expect(mutation.mutationFn("entry-1")).rejects.toThrow("server error");
  });
});
