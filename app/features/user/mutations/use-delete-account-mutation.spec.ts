import { describe, expect, it, vi } from "vitest";

import { useDeleteAccountMutation } from "./use-delete-account-mutation";

const createApiMutationMock = vi.hoisted(() => vi.fn());

vi.mock("~/core/query/use-api-mutation", () => ({
  createApiMutation: createApiMutationMock,
}));

describe("useDeleteAccountMutation", () => {
  it("registers a mutation with the api mutation factory", () => {
    const client = { deleteAccount: vi.fn().mockResolvedValue(undefined) };
    createApiMutationMock.mockImplementation(
      (fn: (password: string) => Promise<undefined>) => ({ mutationFn: fn }),
    );

    useDeleteAccountMutation(client as never);

    expect(createApiMutationMock).toHaveBeenCalledOnce();
  });

  it("calls client.deleteAccount with the provided password", async () => {
    const client = { deleteAccount: vi.fn().mockResolvedValue(undefined) };
    createApiMutationMock.mockImplementation(
      (fn: (password: string) => Promise<undefined>) => ({ mutationFn: fn }),
    );

    const mutation = useDeleteAccountMutation(client as never) as unknown as {
      mutationFn: (password: string) => Promise<undefined>;
    };

    await mutation.mutationFn("MinhaSenha@123");

    expect(client.deleteAccount).toHaveBeenCalledWith("MinhaSenha@123");
  });

  it("returns undefined on success", async () => {
    const client = { deleteAccount: vi.fn().mockResolvedValue(undefined) };
    createApiMutationMock.mockImplementation(
      (fn: (password: string) => Promise<undefined>) => ({ mutationFn: fn }),
    );

    const mutation = useDeleteAccountMutation(client as never) as unknown as {
      mutationFn: (password: string) => Promise<undefined>;
    };

    const result = await mutation.mutationFn("MinhaSenha@123");

    expect(result).toBeUndefined();
  });

  it("propagates error from client.deleteAccount", async () => {
    const client = {
      deleteAccount: vi.fn().mockRejectedValue(new Error("Invalid credentials")),
    };
    createApiMutationMock.mockImplementation(
      (fn: (password: string) => Promise<undefined>) => ({ mutationFn: fn }),
    );

    const mutation = useDeleteAccountMutation(client as never) as unknown as {
      mutationFn: (password: string) => Promise<undefined>;
    };

    await expect(mutation.mutationFn("wrong-password")).rejects.toThrow(
      "Invalid credentials",
    );
  });
});
