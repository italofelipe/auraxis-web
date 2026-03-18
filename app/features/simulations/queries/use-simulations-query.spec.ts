import { beforeEach, describe, expect, it, vi } from "vitest";

import { useSimulationsQuery } from "./use-simulations-query";
import type { Simulation } from "~/features/simulations/model/simulation";

const useQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({
  useQuery: useQueryMock,
}));

/**
 * Builds a minimal Simulation fixture for testing.
 *
 * @returns Simulation fixture.
 */
const makeSimulation = (): Simulation => ({
  id: "sim-1",
  name: "Test Simulation",
  toolSlug: "raise-calculator",
  inputs: { current: 5000 },
  result: { recommended: 5500 },
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

  it("calls client.listSimulations and returns the simulation list", async () => {
    const simulations = [makeSimulation()];
    const client = { listSimulations: vi.fn().mockResolvedValue(simulations) };
    useQueryMock.mockImplementation(
      (opts: { queryFn: () => Promise<Simulation[]> }) => opts,
    );

    const query = useSimulationsQuery(client as never) as unknown as {
      queryFn: () => Promise<Simulation[]>;
    };

    const result = await query.queryFn();

    expect(client.listSimulations).toHaveBeenCalledOnce();
    expect(result).toEqual(simulations);
  });

  it("propagates error from client.listSimulations without catching it", async () => {
    const client = {
      listSimulations: vi.fn().mockRejectedValue(new Error("server error")),
    };
    useQueryMock.mockImplementation(
      (opts: { queryFn: () => Promise<Simulation[]> }) => opts,
    );

    const query = useSimulationsQuery(client as never) as unknown as {
      queryFn: () => Promise<Simulation[]>;
    };

    await expect(query.queryFn()).rejects.toThrow("server error");
  });
});
