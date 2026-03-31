import { describe, expect, it, vi } from "vitest";

import { useCreateCheckoutMutation } from "./use-create-checkout-mutation";

const useMutationMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({
  useMutation: useMutationMock,
}));

describe("useCreateCheckoutMutation", () => {
  it("registers mutation with the client's createCheckout function", () => {
    const client = {
      createCheckout: vi.fn().mockResolvedValue("https://checkout.asaas.com/session/abc"),
    };
    useMutationMock.mockImplementation((opts: Record<string, unknown>) => opts);

    useCreateCheckoutMutation(client as never);

    expect(useMutationMock).toHaveBeenCalledOnce();
  });

  it("calls client.createCheckout with the provided planSlug and billingCycle", async () => {
    const checkoutUrl = "https://checkout.asaas.com/session/xyz";
    const client = { createCheckout: vi.fn().mockResolvedValue(checkoutUrl) };
    useMutationMock.mockImplementation((opts: { mutationFn: (vars: unknown) => Promise<string> }) => opts);

    const mutation = useCreateCheckoutMutation(client as never) as unknown as {
      mutationFn: (vars: { planSlug: string; billingCycle: string }) => Promise<string>;
    };

    const result = await mutation.mutationFn({ planSlug: "premium", billingCycle: "monthly" });

    expect(client.createCheckout).toHaveBeenCalledWith("premium", "monthly");
    expect(result).toBe(checkoutUrl);
  });

  it("calls client.createCheckout with annual billing cycle", async () => {
    const checkoutUrl = "https://checkout.asaas.com/session/annual";
    const client = { createCheckout: vi.fn().mockResolvedValue(checkoutUrl) };
    useMutationMock.mockImplementation((opts: { mutationFn: (vars: unknown) => Promise<string> }) => opts);

    const mutation = useCreateCheckoutMutation(client as never) as unknown as {
      mutationFn: (vars: { planSlug: string; billingCycle: string }) => Promise<string>;
    };

    const result = await mutation.mutationFn({ planSlug: "premium", billingCycle: "annual" });

    expect(client.createCheckout).toHaveBeenCalledWith("premium", "annual");
    expect(result).toBe(checkoutUrl);
  });

  it("propagates error from client.createCheckout without catching it", async () => {
    const client = {
      createCheckout: vi.fn().mockRejectedValue(new Error("checkout error")),
    };
    useMutationMock.mockImplementation((opts: { mutationFn: (vars: unknown) => Promise<string> }) => opts);

    const mutation = useCreateCheckoutMutation(client as never) as unknown as {
      mutationFn: (vars: { planSlug: string; billingCycle: string }) => Promise<string>;
    };

    await expect(mutation.mutationFn({ planSlug: "premium", billingCycle: "monthly" })).rejects.toThrow("checkout error");
  });
});
