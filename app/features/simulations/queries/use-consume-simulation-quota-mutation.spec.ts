import { beforeEach, describe, expect, it, vi } from "vitest";

import { useConsumeSimulationQuotaMutation } from "./use-consume-simulation-quota-mutation";
import { SIMULATION_QUOTA_QUERY_KEY } from "./use-simulation-quota-query";
import type { SimulationQuotaClient } from "~/features/simulations/services/simulation-quota.client";

const useMutationMock = vi.hoisted(() => vi.fn());
const setQueryData = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({
  useMutation: useMutationMock,
  useQueryClient: (): Record<string, unknown> => ({ setQueryData }),
}));

describe("useConsumeSimulationQuotaMutation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useMutationMock.mockImplementation((opts: Record<string, unknown>) => opts);
  });

  it("invoca client.consume na mutationFn", async () => {
    const consume = vi.fn().mockResolvedValue({ allowed: false });
    const mutation = useConsumeSimulationQuotaMutation({
      consume,
    } as unknown as SimulationQuotaClient) as unknown as {
      mutationFn: () => Promise<unknown>;
    };

    await mutation.mutationFn();
    expect(consume).toHaveBeenCalledOnce();
  });

  it("atualiza o cache da quota no onSuccess", () => {
    const mutation = useConsumeSimulationQuotaMutation({
      consume: vi.fn(),
    } as unknown as SimulationQuotaClient) as unknown as {
      onSuccess: (quota: unknown) => void;
    };

    const quota = { allowed: false, remaining: 0 };
    mutation.onSuccess(quota);

    expect(setQueryData).toHaveBeenCalledWith(SIMULATION_QUOTA_QUERY_KEY, quota);
  });
});
