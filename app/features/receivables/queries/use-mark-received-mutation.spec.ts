import { beforeEach, describe, expect, it, vi } from "vitest";

import { useMarkReceivedMutation } from "./use-mark-received-mutation";
import type { ReceivableEntry } from "~/features/receivables/model/receivables";

const useMutationMock = vi.hoisted(() => vi.fn());
const invalidateQueriesMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({
  useMutation: useMutationMock,
  useQueryClient: (): { invalidateQueries: typeof invalidateQueriesMock } => ({
    invalidateQueries: invalidateQueriesMock,
  }),
}));

/**
 * Builds a minimal ReceivableEntry fixture in "received" state.
 *
 * @returns ReceivableEntry fixture for use in assertions.
 */
const makeReceivableEntry = (): ReceivableEntry => ({
  id: "entry-1",
  description: "Consultoria",
  amount: 5000,
  expectedDate: "2026-03-31",
  receivedDate: "2026-03-30",
  status: "received",
  category: "Consultoria",
  createdAt: "2026-03-01T00:00:00.000Z",
});

describe("useMarkReceivedMutation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useMutationMock.mockImplementation((options: unknown) => options);
  });

  it("calls client.markReceived with provided id and receivedDate", async () => {
    const updated = makeReceivableEntry();
    const client = { markReceived: vi.fn().mockResolvedValue(updated) };

    const mutation = useMarkReceivedMutation(client as never) as unknown as {
      mutationFn: (vars: { id: string; receivedDate?: string }) => Promise<ReceivableEntry>;
    };

    await mutation.mutationFn({ id: "entry-1", receivedDate: "2026-03-30" });

    expect(client.markReceived).toHaveBeenCalledWith("entry-1", "2026-03-30");
  });

  it("defaults receivedDate to today when not provided", async () => {
    const today = new Date().toISOString().split("T")[0]!;
    const updated = makeReceivableEntry();
    const client = { markReceived: vi.fn().mockResolvedValue(updated) };

    const mutation = useMarkReceivedMutation(client as never) as unknown as {
      mutationFn: (vars: { id: string; receivedDate?: string }) => Promise<ReceivableEntry>;
    };

    await mutation.mutationFn({ id: "entry-1" });

    expect(client.markReceived).toHaveBeenCalledWith("entry-1", today);
  });

  it("invalidates receivables list and summary queries on success", async () => {
    invalidateQueriesMock.mockResolvedValue(undefined);
    const client = { markReceived: vi.fn().mockResolvedValue(makeReceivableEntry()) };

    const mutation = useMarkReceivedMutation(client as never) as unknown as {
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

  it("propagates errors from client.markReceived without catching", async () => {
    const client = {
      markReceived: vi.fn().mockRejectedValue(new Error("network error")),
    };

    const mutation = useMarkReceivedMutation(client as never) as unknown as {
      mutationFn: (vars: { id: string }) => Promise<ReceivableEntry>;
    };

    await expect(mutation.mutationFn({ id: "entry-1" })).rejects.toThrow("network error");
  });
});
