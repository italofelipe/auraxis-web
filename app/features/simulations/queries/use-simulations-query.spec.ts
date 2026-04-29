import { beforeEach, describe, expect, it, vi } from "vitest";

import { useSimulationsQuery } from "./use-simulations-query";
import type { Simulation, SimulationList } from "~/features/simulations/model/simulation";

const useQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({
  useQuery: useQueryMock,
}));

vi.mock("~/core/config", () => ({
  isMockDataEnabled: (): boolean => false,
}));

/**
 * @param overrides Partial overrides merged on top of the canonical fixture.
 * @returns A canonical Simulation domain fixture for tests.
 */
const makeSimulation = (overrides: Partial<Simulation> = {}): Simulation => ({
  id: "sim-1",
  userId: "user-1",
  toolId: "installment-vs-cash",
  ruleVersion: "2026.04",
  inputs: { current: 5000 },
  result: { summary: "À vista economiza R$ 480", result_value: 480 },
  metadata: { label: "Minha simulação" },
  saved: true,
  createdAt: "2026-03-18T00:00:00.000Z",
  ...overrides,
});

/**
 * @param items Domain items to wrap in the paginated response shape.
 * @returns A SimulationList envelope with single-page defaults.
 */
const makeList = (items: readonly Simulation[]): SimulationList => ({
  items,
  page: 1,
  perPage: items.length || 20,
  total: items.length,
  pages: 1,
});

describe("useSimulationsQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls client.listSimulations and maps each row to SimulationCardDto", async () => {
    const simulations = [makeSimulation()];
    const client = {
      listSimulations: vi.fn().mockResolvedValue(makeList(simulations)),
    };
    useQueryMock.mockImplementation((opts: { queryFn: () => Promise<unknown> }) => opts);

    const query = useSimulationsQuery({ providedClient: client as never }) as unknown as {
      queryFn: () => Promise<{
        cards: ReadonlyArray<{ id: string; type: string; name: string }>;
        total: number;
      }>;
    };

    const result = await query.queryFn();

    expect(client.listSimulations).toHaveBeenCalledOnce();
    expect(result.total).toBe(1);
    expect(result.cards[0]).toMatchObject({
      id: "sim-1",
      type: "installment_vs_cash",
      name: "Minha simulação",
    });
  });

  it("propagates error from client.listSimulations without catching it", async () => {
    const client = {
      listSimulations: vi.fn().mockRejectedValue(new Error("server error")),
    };
    useQueryMock.mockImplementation((opts: { queryFn: () => Promise<unknown> }) => opts);

    const query = useSimulationsQuery({ providedClient: client as never }) as unknown as {
      queryFn: () => Promise<unknown>;
    };

    await expect(query.queryFn()).rejects.toThrow("server error");
  });
});
