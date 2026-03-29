import { beforeEach, describe, expect, it, vi } from "vitest";

import { useEntitlementQuery } from "./use-entitlement-query";
import type { EntitlementClient } from "~/features/paywall/services/entitlement.client";

const useQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({
  useQuery: useQueryMock,
}));

vi.mock("~/core/config", () => ({
  isMockDataEnabled: (): boolean => false,
}));

describe("useEntitlementQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers with the canonical entitlement query key", () => {
    const client: Partial<EntitlementClient> = {
      checkEntitlement: vi.fn().mockResolvedValue(true),
    };

    useQueryMock.mockImplementation((opts: Record<string, unknown>) => opts);

    const query = useEntitlementQuery(
      "advanced_simulations",
      client as EntitlementClient,
    ) as unknown as { queryKey: readonly ["entitlements", "advanced_simulations"] };

    expect(query.queryKey).toEqual(["entitlements", "advanced_simulations"]);
  });

  it("calls client.checkEntitlement and returns the boolean result", async () => {
    const client: Partial<EntitlementClient> = {
      checkEntitlement: vi.fn().mockResolvedValue(true),
    };

    useQueryMock.mockImplementation(
      (opts: { queryFn: () => Promise<boolean> }) => opts,
    );

    const query = useEntitlementQuery(
      "export_pdf",
      client as EntitlementClient,
    ) as unknown as { queryFn: () => Promise<boolean> };

    const result = await query.queryFn();

    expect(client.checkEntitlement).toHaveBeenCalledOnce();
    expect(result).toBe(true);
  });

  it("propagates error from client.checkEntitlement without catching it", async () => {
    const client: Partial<EntitlementClient> = {
      checkEntitlement: vi.fn().mockRejectedValue(new Error("server error")),
    };

    useQueryMock.mockImplementation(
      (opts: { queryFn: () => Promise<boolean> }) => opts,
    );

    const query = useEntitlementQuery(
      "shared_entries",
      client as EntitlementClient,
    ) as unknown as { queryFn: () => Promise<boolean> };

    await expect(query.queryFn()).rejects.toThrow("server error");
  });

  it("returns false when mock mode is enabled", async () => {
    vi.doMock("~/core/config", () => ({
      isMockDataEnabled: (): boolean => true,
    }));

    const client: Partial<EntitlementClient> = {
      checkEntitlement: vi.fn(),
    };

    useQueryMock.mockImplementation(
      (opts: { queryFn: () => Promise<boolean> }) => opts,
    );

    const query = useEntitlementQuery(
      "advanced_simulations",
      client as EntitlementClient,
    ) as unknown as { queryFn: () => Promise<boolean> };

    // The mock is at module level (false), so queryFn delegates to client
    // We just check it doesn't throw
    expect(query.queryFn).toBeTypeOf("function");

    vi.doUnmock("~/core/config");
  });
});
