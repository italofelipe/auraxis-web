import { ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SimulationQuota } from "~/features/simulations/model/simulation-quota";

import { useSimulationQuota } from "./useSimulationQuota";

const captureMock = vi.fn();
const mutateAsyncMock = vi.fn();
const queryDataRef = ref<SimulationQuota | undefined>(undefined);
const isLoadingRef = ref<boolean>(false);

vi.mock("~/composables/useAnalytics/useAnalytics", () => ({
  useAnalytics: (): Record<string, unknown> => ({
    capture: captureMock,
    identify: vi.fn(),
    reset: vi.fn(),
  }),
}));

vi.mock("~/features/simulations/queries/use-simulation-quota-query", () => ({
  SIMULATION_QUOTA_QUERY_KEY: ["simulation-quota"],
  useSimulationQuotaQuery: (): Record<string, unknown> => ({
    data: queryDataRef,
    isLoading: isLoadingRef,
  }),
}));

vi.mock(
  "~/features/simulations/queries/use-consume-simulation-quota-mutation",
  () => ({
    useConsumeSimulationQuotaMutation: (): Record<string, unknown> => ({
      mutateAsync: mutateAsyncMock,
    }),
  }),
);

/**
 * Constrói um snapshot de quota com overrides.
 *
 * @param over Campos a sobrescrever no snapshot base.
 * @returns Snapshot de quota completo.
 */
const QUOTA = (over: Partial<SimulationQuota> = {}): SimulationQuota => ({
  limit: 1,
  used: 0,
  remaining: 1,
  unlimited: false,
  allowed: true,
  resetAt: "2026-06-01T00:00:00Z",
  ...over,
});

describe("useSimulationQuota", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryDataRef.value = undefined;
    isLoadingRef.value = false;
  });

  it("emite free_simulation_used quando consumo é permitido e free", async () => {
    mutateAsyncMock.mockResolvedValue(QUOTA({ used: 1, remaining: 0, allowed: true }));
    const { consume } = useSimulationQuota();

    await consume("goal-1");

    expect(captureMock).toHaveBeenCalledWith("free_simulation_used", {
      goal_id: "goal-1",
    });
  });

  it("NÃO emite evento para premium (unlimited)", async () => {
    mutateAsyncMock.mockResolvedValue(
      QUOTA({ unlimited: true, remaining: null, allowed: true }),
    );
    const { consume } = useSimulationQuota();

    await consume("goal-1");

    expect(captureMock).not.toHaveBeenCalled();
  });

  it("NÃO emite evento quando esgotado (allowed=false)", async () => {
    mutateAsyncMock.mockResolvedValue(QUOTA({ used: 1, remaining: 0, allowed: false }));
    const { consume } = useSimulationQuota();

    await consume("goal-1");

    expect(captureMock).not.toHaveBeenCalled();
  });

  it("isExhausted é true quando free sem saldo", () => {
    queryDataRef.value = QUOTA({ used: 1, remaining: 0, allowed: false });
    const { isExhausted } = useSimulationQuota();
    expect(isExhausted.value).toBe(true);
  });

  it("isExhausted é false para premium", () => {
    queryDataRef.value = QUOTA({ unlimited: true, remaining: null, allowed: true });
    const { isExhausted, unlimited } = useSimulationQuota();
    expect(unlimited.value).toBe(true);
    expect(isExhausted.value).toBe(false);
  });

  it("usa fallback otimista quando a query ainda não carregou", () => {
    const { quota } = useSimulationQuota();
    expect(quota.value.allowed).toBe(true);
    expect(quota.value.remaining).toBe(1);
  });
});
