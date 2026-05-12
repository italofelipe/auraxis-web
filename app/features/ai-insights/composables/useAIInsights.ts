import { computed, ref, type ComputedRef, type Ref } from "vue";
import { useState } from "#app";

import { useEntitlementQuery } from "~/features/paywall/queries/use-entitlement-query";
import { useGenerateAIInsight } from "~/features/ai-insights/queries/use-generate-ai-insight";
import {
  isPreviousMonthInsight,
  mapGeneratedInsight,
  type GeneratedAIInsight,
  type GenerateAIInsightVariables,
} from "~/features/ai-insights/model/ai-insight";
import type { GenerateInsightResponseWithMetaDTO, InsightItem } from "~/features/ai-insights/contracts/ai-insight";

interface EntitlementLike {
  readonly data: Ref<boolean | undefined>;
  readonly isLoading: Ref<boolean>;
}

interface MutationLike {
  readonly mutateAsync: (variables?: GenerateAIInsightVariables) => Promise<GenerateInsightResponseWithMetaDTO>;
  readonly isPending: Ref<boolean>;
  readonly error: Ref<Error | null>;
}

interface UseAIInsightsDeps {
  readonly entitlement?: EntitlementLike;
  readonly mutation?: MutationLike;
}

export interface UseAIInsightsResult {
  readonly generate: (variables?: GenerateAIInsightVariables) => Promise<GeneratedAIInsight | null>;
  readonly isLoading: ComputedRef<boolean>;
  readonly currentInsight: ComputedRef<InsightItem[] | null>;
  readonly currentResult: Ref<GeneratedAIInsight | null>;
  readonly callsRemaining: Ref<number | null>;
  readonly hasPremium: ComputedRef<boolean>;
  readonly entitlementLoading: ComputedRef<boolean>;
  readonly insightMonth: ComputedRef<string>;
  readonly insightModel: ComputedRef<string>;
  readonly tokensUsed: ComputedRef<number>;
  readonly costUsd: ComputedRef<number>;
  readonly isStale: ComputedRef<boolean>;
  readonly cached: ComputedRef<boolean>;
  readonly error: Ref<Error | null>;
}

/**
 * Returns the current month in the backend YYYY-MM format.
 *
 * @returns Current month string.
 */
const getCurrentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

/**
 * Resolves shared generated insight state for page-level and button-level
 * consumers, while keeping injected unit-test state isolated.
 *
 * @param isInjected Whether dependencies were provided by a test.
 * @returns Current generated insight state.
 */
const getCurrentResultState = (isInjected: boolean): Ref<GeneratedAIInsight | null> => {
  if (isInjected) {
    return ref<GeneratedAIInsight | null>(null);
  }

  return useState<GeneratedAIInsight | null>("ai-insights:current-result", () => null);
};

/**
 * Resolves shared daily-call metadata state.
 *
 * @param isInjected Whether dependencies were provided by a test.
 * @returns Calls remaining state.
 */
const getCallsRemainingState = (isInjected: boolean): Ref<number | null> => {
  if (isInjected) {
    return ref<number | null>(null);
  }

  return useState<number | null>("ai-insights:calls-remaining", () => null);
};

/**
 * Orchestrates AI insight entitlement, generation and current result state.
 *
 * @param deps Optional injected dependencies for unit tests.
 * @returns Reactive AI insight state and actions.
 */
export const useAIInsights = (deps?: UseAIInsightsDeps): UseAIInsightsResult => {
  const entitlement = deps?.entitlement ?? useEntitlementQuery("advanced_simulations");
  const mutation = deps?.mutation ?? useGenerateAIInsight();
  const currentResult = getCurrentResultState(Boolean(deps));
  const callsRemaining = getCallsRemainingState(Boolean(deps));

  const hasPremium = computed(() => entitlement.data.value === true);
  const entitlementLoading = computed(() => entitlement.isLoading.value);
  const isLoading = computed(() => mutation.isPending.value);
  const currentInsight = computed(() => currentResult.value?.items ?? null);
  const insightMonth = computed(() => currentResult.value?.month ?? getCurrentMonth());
  const insightModel = computed(() => currentResult.value?.model ?? "");
  const tokensUsed = computed(() => currentResult.value?.tokensUsed ?? 0);
  const costUsd = computed(() => currentResult.value?.costUsd ?? 0);
  const cached = computed(() => currentResult.value?.cached ?? false);
  const isStale = computed(() => isPreviousMonthInsight(insightMonth.value));

  /**
   * Generates an insight for the current user when premium access is available.
   *
   * @param variables Optional generation variables.
   * @returns Generated insight, or null when the user is free.
   */
  const generate = async (
    variables?: GenerateAIInsightVariables,
  ): Promise<GeneratedAIInsight | null> => {
    if (!hasPremium.value) {
      return null;
    }

    const result = mapGeneratedInsight(await mutation.mutateAsync(variables));
    currentResult.value = result;
    callsRemaining.value = result.callsRemaining;
    return result;
  };

  return {
    generate,
    isLoading,
    currentInsight,
    currentResult,
    callsRemaining,
    hasPremium,
    entitlementLoading,
    insightMonth,
    insightModel,
    tokensUsed,
    costUsd,
    isStale,
    cached,
    error: mutation.error,
  };
};
