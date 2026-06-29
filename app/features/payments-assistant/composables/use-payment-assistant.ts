/**
 * Orchestrates the Payments Assistant: which overdue transactions to review,
 * deck navigation, and the pay/delete/skip/undo actions backed by the existing
 * transaction mutations.
 *
 * This composable deliberately owns NO presentation concern (no i18n, no toast).
 * It exposes reactive state and async actions; the modal component renders them
 * and surfaces toasts/undo affordances. Decision logic lives in the pure
 * `services/payment-assistant.*` modules and the action handlers in
 * `use-assistant-actions`, so this stays a thin, testable façade.
 */

import { type ComputedRef, type Ref, computed, ref } from "vue";

import { useFeatureFlag } from "~/shared/feature-flags/use-feature-flag";
import { useSubscriptionQuery } from "~/features/subscription/queries/use-subscription-query";
import { useListAllTransactionsQuery } from "~/features/transactions/queries/use-list-all-transactions-query";
import { useMarkTransactionPaidMutation } from "~/features/transactions/queries/use-mark-transaction-paid-mutation";
import { useDeleteTransactionMutation } from "~/features/transactions/queries/use-delete-transaction-mutation";
import { useUpdateTransactionMutation } from "~/features/transactions/queries/use-update-transaction-mutation";
import { useRestoreTransactionMutation } from "~/features/transactions/queries/use-restore-transaction-mutation";
import type { ListTransactionsFilters } from "~/features/transactions/services/transactions.client";
import type { TransactionDto } from "~/features/transactions/contracts/transaction.dto";

import {
  OVERDUE_THRESHOLD_DAYS,
  isPremiumSubscription,
  selectOverdueCandidates,
} from "../services/payment-assistant.eligibility";
import {
  type DeckAction,
  type DeckProgress,
  type DeckState,
  createDeck,
  currentCard,
  deckProgress,
  isDeckDone,
} from "../services/payment-assistant.deck";
import { type AssistantActions, useAssistantActions } from "./use-assistant-actions";

/** Feature flag gating the assistant (kill-switch / staged rollout). */
export const PAYMENTS_ASSISTANT_FLAG = "web.features.payments-assistant";

/** Reactive surface returned by {@link usePaymentAssistant}. */
export interface UsePaymentAssistantReturn extends AssistantActions {
  readonly isOpen: Ref<boolean>;
  readonly isPremium: ComputedRef<boolean>;
  readonly candidates: ComputedRef<TransactionDto[]>;
  readonly current: ComputedRef<TransactionDto | null>;
  readonly progress: ComputedRef<DeckProgress>;
  readonly isDone: ComputedRef<boolean>;
  readonly lastAction: Ref<DeckAction | null>;
}

/**
 * Formats a Date as a local `YYYY-MM-DD` calendar date.
 *
 * @param date Date to format.
 * @returns ISO calendar-date string.
 */
const toIsoDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Payments Assistant composable.
 *
 * @param now Clock injector (defaults to `() => new Date()`), overridable in tests.
 * @returns Reactive state and actions for the assistant.
 */
export const usePaymentAssistant = (
  now: () => Date = () => new Date(),
): UsePaymentAssistantReturn => {
  const flag = useFeatureFlag(PAYMENTS_ASSISTANT_FLAG);

  const subscriptionQuery = useSubscriptionQuery();
  const isPremium = computed(() => isPremiumSubscription(subscriptionQuery.data.value ?? null));

  // Cap the fetch to entries already past the overdue threshold; the precise
  // status/threshold filtering happens client-side via selectOverdueCandidates.
  const listFilters = computed<ListTransactionsFilters>(() => {
    const cutoff = now();
    cutoff.setDate(cutoff.getDate() - OVERDUE_THRESHOLD_DAYS);
    return { end_date: toIsoDate(cutoff) };
  });
  const transactionsQuery = useListAllTransactionsQuery(listFilters);
  const candidates = computed(() =>
    selectOverdueCandidates(transactionsQuery.data.value ?? [], now()),
  );

  const mutations = {
    markPaid: useMarkTransactionPaidMutation(),
    remove: useDeleteTransactionMutation(),
    update: useUpdateTransactionMutation(),
    restore: useRestoreTransactionMutation(),
  };

  const isOpen = ref(false);
  const deck = ref<DeckState>(createDeck([]));
  const lastAction = ref<DeckAction | null>(null);

  const current = computed(() => currentCard(deck.value));
  const progress = computed(() => deckProgress(deck.value));
  const isDone = computed(() => isDeckDone(deck.value));

  const actions = useAssistantActions({
    deck,
    current,
    candidates,
    isOpen,
    lastAction,
    flagEnabled: flag,
    isPremium,
    mutations,
    now,
  });

  return { isOpen, isPremium, candidates, current, progress, isDone, lastAction, ...actions };
};
