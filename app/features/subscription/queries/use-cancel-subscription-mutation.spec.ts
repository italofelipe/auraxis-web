import { describe, expect, it, vi } from "vitest";

import { useCancelSubscriptionMutation } from "./use-cancel-subscription-mutation";

const useMutationMock = vi.hoisted(() => vi.fn());
const useQueryClientMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({
  useMutation: useMutationMock,
  useQueryClient: useQueryClientMock,
}));

describe("useCancelSubscriptionMutation", () => {
  it("registers a mutation with the subscription client", () => {
    const invalidateQueries = vi.fn().mockResolvedValue(undefined);
    useQueryClientMock.mockReturnValue({ invalidateQueries });
    useMutationMock.mockImplementation((opts: Record<string, unknown>) => opts);

    const client = { cancelSubscription: vi.fn().mockResolvedValue(undefined) };
    useCancelSubscriptionMutation(client as never);

    expect(useMutationMock).toHaveBeenCalledOnce();
  });

  it("calls client.cancelSubscription on mutation execution", async () => {
    const invalidateQueries = vi.fn().mockResolvedValue(undefined);
    useQueryClientMock.mockReturnValue({ invalidateQueries });
    useMutationMock.mockImplementation((opts: { mutationFn: () => Promise<void> }) => opts);

    const client = { cancelSubscription: vi.fn().mockResolvedValue(undefined) };
    const mutation = useCancelSubscriptionMutation(client as never) as unknown as {
      mutationFn: () => Promise<void>;
    };

    await mutation.mutationFn();

    expect(client.cancelSubscription).toHaveBeenCalledOnce();
  });

  it("invalidates the subscription query on success", async () => {
    const invalidateQueries = vi.fn().mockResolvedValue(undefined);
    useQueryClientMock.mockReturnValue({ invalidateQueries });
    useMutationMock.mockImplementation(
      (opts: { onSuccess: () => Promise<void> }) => opts,
    );

    const client = { cancelSubscription: vi.fn().mockResolvedValue(undefined) };
    const mutation = useCancelSubscriptionMutation(client as never) as unknown as {
      onSuccess: () => Promise<void>;
    };

    await mutation.onSuccess();

    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["subscription", "me"] });
  });

  it("propagates error from client.cancelSubscription without catching", async () => {
    const invalidateQueries = vi.fn().mockResolvedValue(undefined);
    useQueryClientMock.mockReturnValue({ invalidateQueries });
    useMutationMock.mockImplementation((opts: { mutationFn: () => Promise<void> }) => opts);

    const client = {
      cancelSubscription: vi.fn().mockRejectedValue(new Error("cancel failed")),
    };
    const mutation = useCancelSubscriptionMutation(client as never) as unknown as {
      mutationFn: () => Promise<void>;
    };

    await expect(mutation.mutationFn()).rejects.toThrow("cancel failed");
  });
});
