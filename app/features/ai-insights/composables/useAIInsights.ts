import { computed, ref, type ComputedRef, type Ref } from "vue";
import { useState } from "#app";

import { useEntitlementQuery } from "~/features/paywall/queries/use-entitlement-query";
import { useAIInsightsApiClient } from "~/features/ai-insights/api/ai-insights-api";
import { useGenerateAIInsight } from "~/features/ai-insights/queries/use-generate-ai-insight";
import { useGrantAIConsent } from "~/features/ai-insights/queries/use-grant-ai-consent";
import {
  isPreviousMonthInsight,
  mapGeneratedInsight,
  type GeneratedAIInsight,
  type GenerateAIInsightVariables,
} from "~/features/ai-insights/model/ai-insight";
import type {
  GenerateInsightResponseWithMetaDTO,
  InsightChangeStatusDTO,
  InsightItem,
  InsightPeriodType,
} from "~/features/ai-insights/contracts/ai-insight";

export interface CheckChangeStatusVariables {
  readonly periodType: InsightPeriodType;
  readonly anchorDate?: string;
}

interface EntitlementLike {
  readonly data: Ref<boolean | undefined>;
  readonly isLoading: Ref<boolean>;
}

interface MutationLike {
  readonly mutateAsync: (variables?: GenerateAIInsightVariables) => Promise<GenerateInsightResponseWithMetaDTO>;
  readonly isPending: Ref<boolean>;
  readonly error: Ref<Error | null>;
}

interface ConsentMutationLike {
  readonly mutateAsync: (variables?: undefined) => Promise<undefined>;
  readonly isPending: Ref<boolean>;
}

interface ConsentStatusLike {
  readonly hasAIConsent: () => Promise<boolean>;
}

interface ChangeStatusCheckerLike {
  readonly checkChangeStatus: (
    variables: CheckChangeStatusVariables,
  ) => Promise<InsightChangeStatusDTO>;
}

interface UseAIInsightsDeps {
  readonly entitlement?: EntitlementLike;
  readonly mutation?: MutationLike;
  readonly consentMutation?: ConsentMutationLike;
  readonly consentStatus?: ConsentStatusLike;
  readonly changeStatus?: ChangeStatusCheckerLike;
}

type DerivedAIInsightState = Pick<
  UseAIInsightsResult,
  | "hasPremium"
  | "entitlementLoading"
  | "isLoading"
  | "isGrantingAIConsent"
  | "currentInsight"
  | "currentInsightId"
  | "forecast"
  | "insightPeriodLabel"
  | "insightMonth"
  | "insightModel"
  | "tokensUsed"
  | "costUsd"
  | "cached"
  | "isStale"
>;

interface CreateDerivedStateArgs {
  readonly entitlement: EntitlementLike;
  readonly mutation: MutationLike;
  readonly consentMutation: ConsentMutationLike;
  readonly currentResult: Ref<GeneratedAIInsight | null>;
}

export interface UseAIInsightsResult {
  readonly generate: (variables?: GenerateAIInsightVariables) => Promise<GeneratedAIInsight | null>;
  readonly isLoading: ComputedRef<boolean>;
  readonly currentInsight: ComputedRef<InsightItem[] | null>;
  readonly currentInsightId: ComputedRef<string | null>;
  readonly currentResult: Ref<GeneratedAIInsight | null>;
  readonly callsRemaining: Ref<number | null>;
  readonly callsRemainingMonth: Ref<number | null>;
  readonly forecast: ComputedRef<boolean>;
  readonly hasPremium: ComputedRef<boolean>;
  readonly entitlementLoading: ComputedRef<boolean>;
  readonly hasAIConsent: () => Promise<boolean>;
  readonly checkChangeStatus: (
    variables: CheckChangeStatusVariables,
  ) => Promise<InsightChangeStatusDTO>;
  readonly grantAIConsent: () => Promise<void>;
  readonly isGrantingAIConsent: ComputedRef<boolean>;
  readonly insightPeriodLabel: ComputedRef<string>;
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
 * Resolves shared monthly-call metadata state.
 *
 * @param isInjected Whether dependencies were provided by a test.
 * @returns Monthly calls remaining state.
 */
const getCallsRemainingMonthState = (isInjected: boolean): Ref<number | null> => {
  if (isInjected) {
    return ref<number | null>(null);
  }

  return useState<number | null>("ai-insights:calls-remaining-month", () => null);
};

/**
 * Resolves the consent mutation for production or injected tests.
 *
 * @param deps Optional injected dependencies.
 * @param apiClient Production API client, when available.
 * @returns Consent mutation dependency.
 */
const resolveConsentMutation = (
  deps: UseAIInsightsDeps | undefined,
  apiClient: ReturnType<typeof useAIInsightsApiClient> | null,
): ConsentMutationLike => {
  if (deps) {
    return deps.consentMutation ?? {
      mutateAsync: async (): Promise<undefined> => undefined,
      isPending: ref(false),
    };
  }

  return useGrantAIConsent(apiClient ?? undefined);
};

/**
 * Resolves the consent status reader for production or injected tests.
 *
 * @param deps Optional injected dependencies.
 * @param apiClient Production API client, when available.
 * @returns Consent status dependency.
 */
const resolveConsentStatus = (
  deps: UseAIInsightsDeps | undefined,
  apiClient: ReturnType<typeof useAIInsightsApiClient> | null,
): ConsentStatusLike => {
  if (deps) {
    return deps.consentStatus ?? { hasAIConsent: async (): Promise<boolean> => true };
  }

  return { hasAIConsent: (): Promise<boolean> => apiClient!.hasAIConsent() };
};

/**
 * Builds the computed presentation state for generated AI insights.
 *
 * @param args Entitlement, mutation and result state dependencies.
 * @returns Computed state consumed by pages and the trigger button.
 */
const createDerivedState = (args: CreateDerivedStateArgs): DerivedAIInsightState => ({
  hasPremium: computed(() => args.entitlement.data.value === true),
  entitlementLoading: computed(() => args.entitlement.isLoading.value),
  isLoading: computed(() => args.mutation.isPending.value),
  isGrantingAIConsent: computed(() => args.consentMutation.isPending.value),
  currentInsight: computed(() => args.currentResult.value?.items ?? null),
  currentInsightId: computed(() => args.currentResult.value?.id ?? null),
  forecast: computed(() => args.currentResult.value?.forecast ?? false),
  insightPeriodLabel: computed(() => args.currentResult.value?.periodLabel ?? getCurrentMonth()),
  insightMonth: computed(() => args.currentResult.value?.periodLabel ?? getCurrentMonth()),
  insightModel: computed(() => args.currentResult.value?.model ?? ""),
  tokensUsed: computed(() => args.currentResult.value?.tokensUsed ?? 0),
  costUsd: computed(() => args.currentResult.value?.costUsd ?? 0),
  cached: computed(() => args.currentResult.value?.cached ?? false),
  isStale: computed(() => isPreviousMonthInsight(args.currentResult.value?.periodLabel ?? getCurrentMonth())),
});

/**
 * Orchestrates AI insight entitlement, generation and current result state.
 *
 * @param deps Optional injected dependencies for unit tests.
 * @returns Reactive AI insight state and actions.
 */
export const useAIInsights = (deps?: UseAIInsightsDeps): UseAIInsightsResult => {
  const apiClient = deps ? null : useAIInsightsApiClient();
  const entitlement = deps?.entitlement ?? useEntitlementQuery("advanced_simulations");
  const mutation = deps?.mutation ?? useGenerateAIInsight();
  const consentMutation = resolveConsentMutation(deps, apiClient);
  const consentStatus = resolveConsentStatus(deps, apiClient);
  const currentResult = getCurrentResultState(Boolean(deps));
  const callsRemaining = getCallsRemainingState(Boolean(deps));
  const callsRemainingMonth = getCallsRemainingMonthState(Boolean(deps));
  const state = createDerivedState({ entitlement, mutation, consentMutation, currentResult });

  /**
   * Generates an insight for the current user when premium access is available.
   *
   * @param variables Optional generation variables.
   * @returns Generated insight, or null when the user is free.
   */
  const generate = async (
    variables?: GenerateAIInsightVariables,
  ): Promise<GeneratedAIInsight | null> => {
    if (!state.hasPremium.value) {
      return null;
    }

    const result = mapGeneratedInsight(await mutation.mutateAsync(variables));
    currentResult.value = result;
    callsRemaining.value = result.callsRemaining;
    callsRemainingMonth.value = result.callsRemainingMonth;
    return result;
  };

  /**
   * Records explicit AI consent before retrying insight generation.
   */
  const grantAIConsent = async (): Promise<void> => {
    await consentMutation.mutateAsync(undefined);
  };

  /**
   * Checks whether AI consent is already active.
   *
   * @returns Whether the user has an active AI consent grant.
   */
  const hasAIConsentStatus = async (): Promise<boolean> => consentStatus.hasAIConsent();

  /**
   * Checks whether the snapshot changed since the last insight (no LLM call).
   *
   * @param variables Period and optional anchor date to check.
   * @returns The backend change-status payload.
   */
  const checkChangeStatus = (
    variables: CheckChangeStatusVariables,
  ): Promise<InsightChangeStatusDTO> =>
    deps?.changeStatus
      ? deps.changeStatus.checkChangeStatus(variables)
      : apiClient!.checkChangeStatus(variables);

  return {
    generate,
    checkChangeStatus,
    isLoading: state.isLoading,
    currentInsight: state.currentInsight,
    currentInsightId: state.currentInsightId,
    forecast: state.forecast,
    currentResult,
    callsRemaining,
    callsRemainingMonth,
    hasPremium: state.hasPremium,
    entitlementLoading: state.entitlementLoading,
    hasAIConsent: hasAIConsentStatus,
    grantAIConsent,
    isGrantingAIConsent: state.isGrantingAIConsent,
    insightPeriodLabel: state.insightPeriodLabel,
    insightMonth: state.insightMonth,
    insightModel: state.insightModel,
    tokensUsed: state.tokensUsed,
    costUsd: state.costUsd,
    isStale: state.isStale,
    cached: state.cached,
    error: mutation.error,
  };
};
