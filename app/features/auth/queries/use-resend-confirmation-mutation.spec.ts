import { describe, expect, it, vi } from "vitest";

import { useResendConfirmationMutation } from "./use-resend-confirmation-mutation";

const createApiMutationMock = vi.hoisted(() => vi.fn());

vi.mock("~/core/query/use-api-mutation", () => ({
  createApiMutation: createApiMutationMock,
}));

describe("useResendConfirmationMutation", () => {
  it("registers a mutation with the api mutation factory", () => {
    const client = { resendConfirmation: vi.fn().mockResolvedValue(undefined) };
    createApiMutationMock.mockImplementation((fn: () => Promise<undefined>) => ({ mutationFn: fn }));

    useResendConfirmationMutation(client as never);

    expect(createApiMutationMock).toHaveBeenCalledOnce();
  });

  it("calls client.resendConfirmation with no arguments", async () => {
    const client = { resendConfirmation: vi.fn().mockResolvedValue(undefined) };
    createApiMutationMock.mockImplementation((fn: () => Promise<undefined>) => ({ mutationFn: fn }));

    const mutation = useResendConfirmationMutation(client as never) as unknown as {
      mutationFn: () => Promise<undefined>;
    };

    await mutation.mutationFn();

    expect(client.resendConfirmation).toHaveBeenCalledOnce();
    expect(client.resendConfirmation).toHaveBeenCalledWith();
  });

  it("returns undefined on success", async () => {
    const client = { resendConfirmation: vi.fn().mockResolvedValue(undefined) };
    createApiMutationMock.mockImplementation((fn: () => Promise<undefined>) => ({ mutationFn: fn }));

    const mutation = useResendConfirmationMutation(client as never) as unknown as {
      mutationFn: () => Promise<undefined>;
    };

    const result = await mutation.mutationFn();

    expect(result).toBeUndefined();
  });

  it("propagates error from client.resendConfirmation", async () => {
    const client = {
      resendConfirmation: vi.fn().mockRejectedValue(new Error("rate limited")),
    };
    createApiMutationMock.mockImplementation((fn: () => Promise<undefined>) => ({ mutationFn: fn }));

    const mutation = useResendConfirmationMutation(client as never) as unknown as {
      mutationFn: () => Promise<undefined>;
    };

    await expect(mutation.mutationFn()).rejects.toThrow("rate limited");
  });
});
