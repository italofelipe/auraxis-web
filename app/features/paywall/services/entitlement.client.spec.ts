import type { AxiosInstance } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EntitlementClient } from "./entitlement.client";

/**
 * Builds an entitlement client backed by a mocked Axios adapter.
 *
 * @returns Test client and mocked get function.
 */
const makeClient = (): {
  readonly client: EntitlementClient;
  readonly get: ReturnType<typeof vi.fn>;
} => {
  const get = vi.fn();
  const http = { get } as unknown as AxiosInstance;

  return {
    client: new EntitlementClient(http),
    get,
  };
};

describe("EntitlementClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reads active access from the v2 entitlement envelope", async () => {
    const { client, get } = makeClient();
    get.mockResolvedValue({
      data: {
        success: true,
        data: {
          feature_key: "advanced_simulations",
          active: true,
        },
      },
    });

    await expect(client.checkEntitlement("advanced_simulations")).resolves.toBe(true);
    expect(get).toHaveBeenCalledWith("/entitlements/check", {
      params: { feature_key: "advanced_simulations" },
    });
  });

  it("keeps compatibility with flat active payloads", async () => {
    const { client, get } = makeClient();
    get.mockResolvedValue({ data: { active: true } });

    await expect(client.checkEntitlement("export_pdf")).resolves.toBe(true);
  });

  it("keeps compatibility with legacy has_access payloads", async () => {
    const { client, get } = makeClient();
    get.mockResolvedValue({ data: { has_access: true } });

    await expect(client.checkEntitlement("shared_entries")).resolves.toBe(true);
  });

  it("returns false when the entitlement is inactive", async () => {
    const { client, get } = makeClient();
    get.mockResolvedValue({
      data: {
        success: true,
        data: {
          feature_key: "advanced_simulations",
          active: false,
        },
      },
    });

    await expect(client.checkEntitlement("advanced_simulations")).resolves.toBe(false);
  });
});
