import { beforeEach, describe, expect, it, vi } from "vitest";

import { useSimulationsQuery } from "./use-simulations-query";
import type { SimulationCardDto } from "~/features/simulations/contracts/simulation-card.dto";
import type { Simulation } from "~/features/simulations/model/simulation";

const useQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({
  useQuery: useQueryMock,
}));

vi.mock("~/core/config", () => ({
  isMockDataEnabled: (): boolean => false,
}));

/**
 * Builds a minimal Simulation domain model fixture for testing.
 *
 * @returns Simulation fixture.
 */
const makeSimulation = (): Simulation => ({
  id: "sim-1",
  name: "Test Simulation",
  toolSlug: "installment_vs_cash",
  inputs: { current: 5000 },
  result: { summary: "À vista economiza R$ 480", result_value: 480 },
  goalId: null,
  createdAt: "2026-03-18T00:00:00.000Z",
});

describe("useSimulationsQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers with the canonical simulations query key", () => {
    const client = { listSimulations: vi.fn().mockResolvedValue([makeSimulation()]) };
    useQueryMock.mockImplementation((opts: Record<string, unknown>) => opts);

    const query = useSimulationsQuery(client as never) as unknown as {
      queryKey: readonly ["simulations"];
    };

    expect(query.queryKey).toEqual(["simulations"]);
  });

  it("calls client.listSimulations, maps to SimulationCardDto, and returns the list", async () => {
    const simulations = [makeSimulation()];
    const client = { listSimulations: vi.fn().mockResolvedValue(simulations) };
    useQueryMock.mockImplementation(
      (opts: { queryFn: () => Promise<SimulationCardDto[]> }) => opts,
    );

    const query = useSimulationsQuery(client as never) as unknown as {
      queryFn: () => Promise<SimulationCardDto[]>;
    };

    const result = await query.queryFn();

    expect(client.listSimulations).toHaveBeenCalledOnce();
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: "sim-1",
      name: "Test Simulation",
      type: "installment_vs_cash",
    });
  });

  it("propagates error from client.listSimulations without catching it", async () => {
    const client = {
      listSimulations: vi.fn().mockRejectedValue(new Error("server error")),
    };
    useQueryMock.mockImplementation(
      (opts: { queryFn: () => Promise<SimulationCardDto[]> }) => opts,
    );

    const query = useSimulationsQuery(client as never) as unknown as {
      queryFn: () => Promise<SimulationCardDto[]>;
    };

    await expect(query.queryFn()).rejects.toThrow("server error");
  });
});
