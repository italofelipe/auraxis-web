import type { AxiosInstance } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SimulationQuotaClient } from "./simulation-quota.client";

/**
 * Constrói um client com adapter Axios mockado.
 *
 * @returns Client de teste e os mocks de get/post.
 */
const makeClient = (): {
  readonly client: SimulationQuotaClient;
  readonly get: ReturnType<typeof vi.fn>;
  readonly post: ReturnType<typeof vi.fn>;
} => {
  const get = vi.fn();
  const post = vi.fn();
  const http = { get, post } as unknown as AxiosInstance;
  return { client: new SimulationQuotaClient(http), get, post };
};

describe("SimulationQuotaClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getQuota chama /simulations/quota e desembrulha o envelope", async () => {
    const { client, get } = makeClient();
    get.mockResolvedValue({
      data: {
        data: {
          limit: 1,
          used: 0,
          remaining: 1,
          unlimited: false,
          allowed: true,
          reset_at: "2026-06-01T00:00:00Z",
        },
      },
    });

    const quota = await client.getQuota();

    expect(get).toHaveBeenCalledWith("/simulations/quota");
    expect(quota.remaining).toBe(1);
    expect(quota.allowed).toBe(true);
  });

  it("consume faz POST e retorna allowed=false quando esgotado", async () => {
    const { client, post } = makeClient();
    post.mockResolvedValue({
      data: {
        limit: 1,
        used: 1,
        remaining: 0,
        unlimited: false,
        allowed: false,
        reset_at: "2026-06-01T00:00:00Z",
      },
    });

    const quota = await client.consume();

    expect(post).toHaveBeenCalledWith("/simulations/quota/consume");
    expect(quota.allowed).toBe(false);
    expect(quota.remaining).toBe(0);
  });
});
