import { useQuery } from "@tanstack/vue-query";
import { computed, type ComputedRef, type MaybeRefOrGetter, toValue } from "vue";

import { useAIInsightsApiClient } from "~/features/ai-insights/api/ai-insights-api";
import type {
  AIInsightHistoryDTO,
  GenerateInsightResponseDTO,
} from "~/features/ai-insights/contracts/ai-insight";
import {
  selectInsightForCadence,
} from "~/features/ai-insights/fluida/model/insight-by-cadence";
import type { FluidaCadence } from "~/features/ai-insights/fluida/model/insight-fluida";

/** How many history entries to scan when resolving a cadence. */
const HISTORY_PAGE_SIZE = 30;

export interface UseInsightReadingResult {
  /** The enriched payload for the selected cadence, or null when none exists. */
  readonly insight: ComputedRef<GenerateInsightResponseDTO | null>;
  /** True while either the history or the detail request is in flight. */
  readonly isLoading: ComputedRef<boolean>;
  /** True when the history resolved and the cadence simply has no insight. */
  readonly isEmpty: ComputedRef<boolean>;
  /** The persisted history, exposed so callers can spot a monthly closing. */
  readonly history: ComputedRef<AIInsightHistoryDTO | undefined>;
}

/**
 * Resolves the persisted insight the reading screen should render.
 *
 * Reads the history to find the right insight for the cadence, then fetches it
 * by id to get the enriched Fluida fields. Both calls are plain reads — no
 * Premium gate, no quota, no LLM cost.
 *
 * Before this existed the screen only ever showed what the current session had
 * generated, so a reload fell back to the demo skeleton (#1302).
 *
 * @param cadence Selected reading cadence.
 * @returns Reactive reading state.
 */
export const useInsightReading = (
  cadence: MaybeRefOrGetter<FluidaCadence>,
): UseInsightReadingResult => {
  const client = useAIInsightsApiClient();

  const historyQuery = useQuery({
    queryKey: ["ai-insights", "history", HISTORY_PAGE_SIZE],
    queryFn: () => client.fetchInsightHistory(1, HISTORY_PAGE_SIZE),
    staleTime: 60_000,
  });

  const selected = computed(() => {
    const items = historyQuery.data.value?.items;
    if (!items) {
      return null;
    }
    return selectInsightForCadence(items, toValue(cadence));
  });

  const selectedId = computed(() => selected.value?.id ?? null);

  const detailQuery = useQuery({
    queryKey: computed(() => ["ai-insights", "detail", selectedId.value] as const),
    queryFn: () => client.fetchInsightById(selectedId.value!),
    enabled: computed(() => selectedId.value !== null),
    staleTime: 5 * 60_000,
  });

  return {
    insight: computed(() => detailQuery.data.value ?? null),
    isLoading: computed(
      () => historyQuery.isLoading.value || (selectedId.value !== null && detailQuery.isLoading.value),
    ),
    isEmpty: computed(
      () => !historyQuery.isLoading.value && historyQuery.data.value !== undefined && selectedId.value === null,
    ),
    history: computed(() => historyQuery.data.value),
  };
};
