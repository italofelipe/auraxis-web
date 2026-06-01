import { computed, type ComputedRef } from "vue";

import { useAnalytics } from "~/composables/useAnalytics/useAnalytics";
import { useSimulationQuotaQuery } from "~/features/simulations/queries/use-simulation-quota-query";
import { useConsumeSimulationQuotaMutation } from "~/features/simulations/queries/use-consume-simulation-quota-mutation";
import {
  UNKNOWN_SIMULATION_QUOTA,
  type SimulationQuota,
} from "~/features/simulations/model/simulation-quota";
import type { SimulationQuotaClient } from "~/features/simulations/services/simulation-quota.client";

export interface UseSimulationQuotaReturn {
  readonly quota: ComputedRef<SimulationQuota>;
  readonly remaining: ComputedRef<number | null>;
  readonly unlimited: ComputedRef<boolean>;
  readonly isExhausted: ComputedRef<boolean>;
  readonly isLoading: ComputedRef<boolean>;
  /**
   * Consome 1 simulação no backend (fonte de verdade). Emite
   * `free_simulation_used` quando o consumo é permitido e o usuário é free.
   * Retorna o snapshot resultante para o caller decidir revelar ou exibir paywall.
   */
  consume(goalId: string): Promise<SimulationQuota>;
}

/**
 * Orquestra a quota freemium do simulador (#566): snapshot + consumo + analytics.
 *
 * @param providedClient Client opcional injetado para testes unitários.
 * @returns Estado e ações da quota.
 */
export const useSimulationQuota = (
  providedClient?: SimulationQuotaClient,
): UseSimulationQuotaReturn => {
  const analytics = useAnalytics();
  const query = useSimulationQuotaQuery(providedClient);
  const consumeMutation = useConsumeSimulationQuotaMutation(providedClient);

  const quota = computed<SimulationQuota>(
    () => query.data.value ?? UNKNOWN_SIMULATION_QUOTA,
  );
  const remaining = computed<number | null>(() => quota.value.remaining);
  const unlimited = computed<boolean>(() => quota.value.unlimited);
  const isExhausted = computed<boolean>(
    () => !quota.value.unlimited && !quota.value.allowed,
  );
  const isLoading = computed<boolean>(() => query.isLoading.value);

  /**
   * Consome 1 simulação no backend e emite analytics quando aplicável.
   *
   * @param goalId Meta sendo simulada (props do evento `free_simulation_used`).
   * @returns Snapshot da quota após o consumo (o caller decide revelar/paywall).
   */
  const consume = async (goalId: string): Promise<SimulationQuota> => {
    const result = await consumeMutation.mutateAsync();
    if (result.allowed && !result.unlimited) {
      analytics.capture("free_simulation_used", { goal_id: goalId });
    }
    return result;
  };

  return { quota, remaining, unlimited, isExhausted, isLoading, consume };
};
