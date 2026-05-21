import { describe, expect, it, vi } from "vitest";

import { useConfirmEmailMutation } from "./use-confirm-email-mutation";
import type { ConfirmEmailResult } from "~/features/auth/services/auth-email.client";

const createApiMutationMock = vi.hoisted(() => vi.fn());

vi.mock("~/core/query/use-api-mutation", () => ({
  createApiMutation: createApiMutationMock,
}));

const sampleResult: ConfirmEmailResult = {
  token: "jwt-abc.payload.sig",
  user: {
    identity: { id: "u-1", name: "Smoke", email: "smoke@auraxis.com.br" },
    email_verification: {
      verified: true,
      deadline_at: null,
      required_now: false,
      days_remaining: null,
    },
  },
};

describe("useConfirmEmailMutation", () => {
  it("registers a mutation with the api mutation factory", () => {
    const client = { confirmEmail: vi.fn().mockResolvedValue(sampleResult) };
    createApiMutationMock.mockImplementation(
      (fn: (token: string) => Promise<ConfirmEmailResult>, opts: unknown) => ({
        fn,
        opts,
      }),
    );

    useConfirmEmailMutation(client as never);

    expect(createApiMutationMock).toHaveBeenCalledOnce();
  });

  it("calls client.confirmEmail with the provided token", async () => {
    const client = { confirmEmail: vi.fn().mockResolvedValue(sampleResult) };
    createApiMutationMock.mockImplementation(
      (fn: (token: string) => Promise<ConfirmEmailResult>) => ({
        mutationFn: fn,
      }),
    );

    const mutation = useConfirmEmailMutation(client as never) as unknown as {
      mutationFn: (token: string) => Promise<ConfirmEmailResult>;
    };

    await mutation.mutationFn("abc123");

    expect(client.confirmEmail).toHaveBeenCalledWith("abc123");
  });

  it("returns the token + user payload on success (magic-link login)", async () => {
    const client = { confirmEmail: vi.fn().mockResolvedValue(sampleResult) };
    createApiMutationMock.mockImplementation(
      (fn: (token: string) => Promise<ConfirmEmailResult>) => ({
        mutationFn: fn,
      }),
    );

    const mutation = useConfirmEmailMutation(client as never) as unknown as {
      mutationFn: (token: string) => Promise<ConfirmEmailResult>;
    };

    const result = await mutation.mutationFn("token-xyz");

    expect(result).toEqual(sampleResult);
    expect(result.token).toBe("jwt-abc.payload.sig");
    expect(result.user.email_verification.verified).toBe(true);
  });

  it("propagates error from client.confirmEmail", async () => {
    const client = {
      confirmEmail: vi.fn().mockRejectedValue(new Error("invalid token")),
    };
    createApiMutationMock.mockImplementation(
      (fn: (token: string) => Promise<ConfirmEmailResult>) => ({
        mutationFn: fn,
      }),
    );

    const mutation = useConfirmEmailMutation(client as never) as unknown as {
      mutationFn: (token: string) => Promise<ConfirmEmailResult>;
    };

    await expect(mutation.mutationFn("bad-token")).rejects.toThrow("invalid token");
  });

  it("passes invalidates option to the factory with subscription key", () => {
    const client = { confirmEmail: vi.fn().mockResolvedValue(sampleResult) };
    createApiMutationMock.mockImplementation(
      (_fn: unknown, opts: { invalidates: readonly (readonly string[])[] }) => ({
        opts,
      }),
    );

    const mutation = useConfirmEmailMutation(client as never) as unknown as {
      opts: { invalidates: readonly (readonly string[])[] };
    };

    expect(mutation.opts.invalidates).toContainEqual(["subscription", "me"]);
  });
});
