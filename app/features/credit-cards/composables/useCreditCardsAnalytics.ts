import { type ComputedRef, type MaybeRefOrGetter, computed, toValue } from "vue";

import type { CreditCardDto } from "../contracts/credit-card.dto";
import { useCreditCardUtilizationQuery } from "../queries/use-credit-card-utilization-query";
import { type AnalyticsViewModel, buildAnalytics } from "../model/credit-card-analytics";
import {
  CREDIT_CARDS_WINDOW_MONTHS,
  useCardTransactionsWindow,
} from "./useCardTransactionsWindow";

/** Resultado do composable da visão Analítico. */
export interface CreditCardsAnalytics {
  readonly analytics: ComputedRef<AnalyticsViewModel>;
  readonly cards: ComputedRef<CreditCardDto[]>;
  readonly isLoading: ComputedRef<boolean>;
  readonly isError: ComputedRef<boolean>;
  readonly error: ComputedRef<Error | null>;
}

/**
 * Orquestra os dados da visão Analítico: janela de transações + utilização
 * oficial (cartão único) e delega a montagem ao model puro.
 *
 * @param month Mês selecionado (YYYY-MM), reativo.
 * @param cardId Cartão selecionado (string) ou null para "Todos", reativo.
 * @returns View-model reativo e estado de carregamento.
 */
export const useCreditCardsAnalytics = (
  month: MaybeRefOrGetter<string>,
  cardId: MaybeRefOrGetter<string | null>,
): CreditCardsAnalytics => {
  const window = useCardTransactionsWindow(month);

  const utilizationCardId = computed<string>(() => toValue(cardId) ?? "");
  const utilizationQuery = useCreditCardUtilizationQuery(utilizationCardId);

  const analytics = computed<AnalyticsViewModel>(() => {
    const selectedCard = toValue(cardId);
    return buildAnalytics({
      transactions: window.enrichedTransactions.value,
      tags: window.tags.value,
      cards: window.cards.value,
      month: toValue(month),
      cardId: selectedCard,
      utilization: selectedCard ? utilizationQuery.data.value ?? null : null,
      windowMonths: CREDIT_CARDS_WINDOW_MONTHS,
    });
  });

  return {
    analytics,
    cards: window.cards,
    isLoading: window.isLoading,
    isError: window.isError,
    error: window.error,
  };
};
