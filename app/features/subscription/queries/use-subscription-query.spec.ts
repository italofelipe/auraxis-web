import { beforeEach, describe, expect, it, vi } from "vitest";

import { useSubscriptionQuery } from "./use-subscription-query";
import type { Subscription } from "~/features/subscription/model/subscription";

const useQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({
  useQuery: useQueryMock,
}));

vi.mock("~/core/config", () => ({
  isMockDataEnabled: (): boolean => false,
}));

/**
 * Builds a minimal Subscription fixture for testing.
 *
 * @returns Subscription fixture with active status.
 */
const makeSubscription = (): Subscription => ({
  id: "sub-test-id",
  planSlug: "premium",
  status: "active",
  trialEndsAt: null,
  currentPeriodEnd: "2026-04-17T00:00:00.000Z",
  provider: null,
  providerSubscriptionId: null,
});

describe("useSubscriptionQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers with the canonical subscription query key", () => {
    const client = { getMySubscription: vi.fn().mockResolvedValue(makeSubscription()) };
    useQueryMock.mockImplementation((opts: Record<string, unknown>) => opts);

    const query = useSubscriptionQuery(client as never) as unknown as {
      queryKey: readonly ["subscription", "me"];
    };

    expect(query.queryKey).toEqual(["subscription", "me"]);
  });

  it("calls client.getMySubscription and returns the mapped subscription", async () => {
    const subscription = makeSubscription();
    const client = { getMySubscription: vi.fn().mockResolvedValue(subscription) };
    useQueryMock.mockImplementation((opts: { queryFn: () => Promise<Subscription> }) => opts);

    const query = useSubscriptionQuery(client as never) as unknown as {
      queryFn: () => Promise<Subscription>;
    };

    const result = await query.queryFn();

    expect(client.getMySubscription).toHaveBeenCalledOnce();
    expect(result).toEqual(subscription);
  });

  it("propagates error from client.getMySubscription without catching it", async () => {
    const client = {
      getMySubscription: vi.fn().mockRejectedValue(new Error("server error")),
    };
    useQueryMock.mockImplementation((opts: { queryFn: () => Promise<Subscription> }) => opts);

    const query = useSubscriptionQuery(client as never) as unknown as {
      queryFn: () => Promise<Subscription>;
    };

    await expect(query.queryFn()).rejects.toThrow("server error");
  });
});
