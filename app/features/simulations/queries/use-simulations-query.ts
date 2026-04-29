import { computed, type MaybeRef, unref } from "vue";
import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";

import { isMockDataEnabled } from "~/core/config";
import { STALE_TIME } from "~/core/query/stale-time";
import {
  useSimulationClient,
  type SimulationClient,
} from "~/features/simulations/services/simulation.client";
import { MOCK_SIMULATIONS } from "~/features/simulations/mock/simulations.mock";
import { mapToSimulationCardDto } from "~/features/simulations/model/simulation-card.mapper";
import type { SimulationCardDto } from "~/features/simulations/contracts/simulation-card.dto";
import type {
  ListSimulationsParams,
  Simulation,
} from "~/features/simulations/model/simulation";

export type SimulationsQueryParams = ListSimulationsParams;

export interface UseSimulationsQueryOptions {
  readonly params?: MaybeRef<SimulationsQueryParams | undefined>;
  readonly providedClient?: SimulationClient;
}

interface SimulationsQueryResult {
  readonly cards: readonly SimulationCardDto[];
  readonly simulations: readonly Simulation[];
  readonly total: number;
  readonly page: number;
  readonly perPage: number;
  readonly pages: number;
}

const EMPTY_RESULT: SimulationsQueryResult = {
  cards: [],
  simulations: [],
  total: 0,
  page: 1,
  perPage: 0,
  pages: 0,
};

/**
 * Vue Query hook for the canonical `/simulations` listing.
 *
 * Returns SimulationCardDto objects ready for `<SimulationCard />` plus the
 * underlying Simulation domain models so per-tool detail views can render
 * tool-specific summaries without an extra request.
 * @param options
 * @returns The computed value.
   */
export const useSimulationsQuery = (
  options: UseSimulationsQueryOptions = {},
): UseQueryReturnType<SimulationsQueryResult, Error> => {
  const client = options.providedClient ?? useSimulationClient();
  const params = computed(() => unref(options.params));

  const queryKey = computed(
    () => ["simulations", params.value ?? {}] as const,
  );

  return useQuery({
    queryKey,
    queryFn: async (): Promise<SimulationsQueryResult> => {
      if (isMockDataEnabled()) {
        return {
          ...EMPTY_RESULT,
          cards: MOCK_SIMULATIONS,
          total: MOCK_SIMULATIONS.length,
          page: 1,
          perPage: MOCK_SIMULATIONS.length,
          pages: 1,
        };
      }

      const list = await client.listSimulations(params.value);
      return {
        cards: list.items.map(mapToSimulationCardDto),
        simulations: list.items,
        total: list.total,
        page: list.page,
        perPage: list.perPage,
        pages: list.pages,
      };
    },
    staleTime: STALE_TIME.STABLE,
  });
};
