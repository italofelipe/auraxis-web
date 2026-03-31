import { describe, expect, it, vi } from "vitest";

import { useConfirmEmailMutation } from "./use-confirm-email-mutation";

const createApiMutationMock = vi.hoisted(() => vi.fn());

vi.mock("~/core/query/use-api-mutation", () => ({
  createApiMutation: createApiMutationMock,
}));

describe("useConfirmEmailMutation", () => {
  it("registers a mutation with the api mutation factory", () => {
    const client = { confirmEmail: vi.fn().mockResolvedValue(undefined) };
    createApiMutationMock.mockImplementation(
      (fn: (token: string) => Promise<undefined>, opts: unknown) => ({ fn, opts }),
    );

    useConfirmEmailMutation(client as never);

    expect(createApiMutationMock).toHaveBeenCalledOnce();
  });

  it("calls client.confirmEmail with the provided token", async () => {
    const client = { confirmEmail: vi.fn().mockResolvedValue(undefined) };
    createApiMutationMock.mockImplementation(
      (fn: (token: string) => Promise<undefined>) => ({ mutationFn: fn }),
    );

    const mutation = useConfirmEmailMutation(client as never) as unknown as {
      mutationFn: (token: string) => Promise<undefined>;
    };

    await mutation.mutationFn("abc123");

    expect(client.confirmEmail).toHaveBeenCalledWith("abc123");
  });

  it("returns undefined on success", async () => {
    const client = { confirmEmail: vi.fn().mockResolvedValue(undefined) };
    createApiMutationMock.mockImplementation(
      (fn: (token: string) => Promise<undefined>) => ({ mutationFn: fn }),
    );

    const mutation = useConfirmEmailMutation(client as never) as unknown as {
      mutationFn: (token: string) => Promise<undefined>;
    };

    const result = await mutation.mutationFn("token-xyz");

    expect(result).toBeUndefined();
  });

  it("propagates error from client.confirmEmail", async () => {
    const client = {
      confirmEmail: vi.fn().mockRejectedValue(new Error("invalid token")),
    };
    createApiMutationMock.mockImplementation(
      (fn: (token: string) => Promise<undefined>) => ({ mutationFn: fn }),
    );

    const mutation = useConfirmEmailMutation(client as never) as unknown as {
      mutationFn: (token: string) => Promise<undefined>;
    };

    await expect(mutation.mutationFn("bad-token")).rejects.toThrow("invalid token");
  });

  it("passes invalidates option to the factory with subscription key", () => {
    const client = { confirmEmail: vi.fn().mockResolvedValue(undefined) };
    createApiMutationMock.mockImplementation(
      (_fn: unknown, opts: { invalidates: readonly (readonly string[])[] }) => ({ opts }),
    );

    const mutation = useConfirmEmailMutation(client as never) as unknown as {
      opts: { invalidates: readonly (readonly string[])[] };
    };

    expect(mutation.opts.invalidates).toContainEqual(["subscription", "me"]);
  });
});
