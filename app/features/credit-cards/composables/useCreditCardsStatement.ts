import { type ComputedRef, type MaybeRefOrGetter, computed, toValue } from "vue";

import type { CreditCardDto } from "../contracts/credit-card.dto";
import { useCreditCardBillQuery } from "../queries/use-credit-card-bill-query";
import { useCreditCardUtilizationQuery } from "../queries/use-credit-card-utilization-query";
import { type StatementViewModel, buildStatement } from "../model/credit-card-statement";
import {
  CREDIT_CARDS_WINDOW_MONTHS,
  useCardTransactionsWindow,
} from "./useCardTransactionsWindow";

/** Resultado do composable da visão Faturas. */
export interface CreditCardsStatement {
  readonly statement: ComputedRef<StatementViewModel>;
  readonly cards: ComputedRef<CreditCardDto[]>;
  readonly isLoading: ComputedRef<boolean>;
  readonly isError: ComputedRef<boolean>;
  readonly error: ComputedRef<Error | null>;
}

/**
 * Orquestra os dados da visão Faturas: janela de transações + fatura/utilização
 * oficiais (apenas para cartão único) e delega a montagem ao model puro.
 *
 * @param month Mês selecionado (YYYY-MM), reativo.
 * @param cardId Cartão selecionado (string) ou null para "Todos", reativo.
 * @returns View-model reativo e estado de carregamento.
 */
export const useCreditCardsStatement = (
  month: MaybeRefOrGetter<string>,
  cardId: MaybeRefOrGetter<string | null>,
): CreditCardsStatement => {
  const window = useCardTransactionsWindow(month);

  const billCardId = computed<string>(() => toValue(cardId) ?? "");
  const billMonth = computed<string | undefined>(() => toValue(month));
  const billQuery = useCreditCardBillQuery(billCardId, billMonth);
  const utilizationQuery = useCreditCardUtilizationQuery(billCardId);

  const statement = computed<StatementViewModel>(() => {
    const selectedCard = toValue(cardId);
    return buildStatement({
      transactions: window.enrichedTransactions.value,
      tags: window.tags.value,
      cards: window.cards.value,
      month: toValue(month),
      cardId: selectedCard,
      bill: selectedCard ? billQuery.data.value ?? null : null,
      utilization: selectedCard ? utilizationQuery.data.value ?? null : null,
      trendMonths: CREDIT_CARDS_WINDOW_MONTHS,
    });
  });

  return {
    statement,
    cards: window.cards,
    isLoading: window.isLoading,
    isError: window.isError,
    error: window.error,
  };
};
