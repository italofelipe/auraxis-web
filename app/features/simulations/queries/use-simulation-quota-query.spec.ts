import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  SIMULATION_QUOTA_QUERY_KEY,
  useSimulationQuotaQuery,
} from "./use-simulation-quota-query";
import type { SimulationQuotaClient } from "~/features/simulations/services/simulation-quota.client";

const useQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({
  useQuery: useQueryMock,
}));

describe("useSimulationQuotaQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useQueryMock.mockImplementation((opts: Record<string, unknown>) => opts);
  });

  it("registra com a query key canônica", () => {
    const client: Partial<SimulationQuotaClient> = {
      getQuota: vi.fn().mockResolvedValue(undefined),
    };

    const query = useSimulationQuotaQuery(
      client as SimulationQuotaClient,
    ) as unknown as { queryKey: typeof SIMULATION_QUOTA_QUERY_KEY };

    expect(query.queryKey).toEqual(SIMULATION_QUOTA_QUERY_KEY);
  });

  it("delega o fetch ao client.getQuota", async () => {
    const getQuota = vi.fn().mockResolvedValue({ allowed: true });
    const query = useSimulationQuotaQuery({
      getQuota,
    } as unknown as SimulationQuotaClient) as unknown as {
      queryFn: () => Promise<unknown>;
    };

    await query.queryFn();
    expect(getQuota).toHaveBeenCalledOnce();
  });
});
