import type { AxiosInstance } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SubscriptionClient } from "./subscription.client";

/**
 * Builds a subscription client backed by mocked Axios methods.
 *
 * @returns Test client and mocked HTTP methods.
 */
const makeClient = (): {
  readonly client: SubscriptionClient;
  readonly get: ReturnType<typeof vi.fn>;
  readonly post: ReturnType<typeof vi.fn>;
} => {
  const get = vi.fn();
  const post = vi.fn();
  const http = { get, post } as unknown as AxiosInstance;

  return {
    client: new SubscriptionClient(http),
    get,
    post,
  };
};

describe("SubscriptionClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("unwraps the current v2 /subscriptions/me envelope", async () => {
    const { client, get } = makeClient();
    get.mockResolvedValue({
      data: {
        success: true,
        data: {
          subscription: {
            id: "sub-premium",
            plan_code: "premium",
            offer_code: "premium_annual",
            status: "active",
            billing_cycle: "annual",
            trial_ends_at: null,
            current_period_end: "2036-05-16T17:08:02.072692",
            provider: "manual_override",
            provider_subscription_id: null,
          },
        },
      },
    });

    await expect(client.getMySubscription()).resolves.toMatchObject({
      id: "sub-premium",
      planSlug: "premium",
      status: "active",
      provider: "manual_override",
    });
  });

  it("keeps compatibility with flat subscription payloads", async () => {
    const { client, get } = makeClient();
    get.mockResolvedValue({
      data: {
        id: "sub-legacy",
        plan_slug: "premium",
        status: "trialing",
        trial_ends_at: "2026-06-01T00:00:00.000Z",
        current_period_end: "2026-06-30T00:00:00.000Z",
        provider: null,
        provider_subscription_id: null,
      },
    });

    await expect(client.getMySubscription()).resolves.toMatchObject({
      id: "sub-legacy",
      planSlug: "premium",
      status: "trialing",
    });
  });

  it("unwraps checkout URLs from the v2 envelope", async () => {
    const { client, post } = makeClient();
    post.mockResolvedValue({
      data: {
        success: true,
        data: {
          checkout_url: "https://billing.example/checkout",
        },
      },
    });

    await expect(client.createCheckout("premium", "annual")).resolves.toBe(
      "https://billing.example/checkout",
    );
    expect(post).toHaveBeenCalledWith("/subscriptions/checkout", {
      plan_slug: "premium",
      billing_cycle: "annual",
    });
  });
});
