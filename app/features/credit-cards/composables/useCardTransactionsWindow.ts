import { type ComputedRef, type MaybeRefOrGetter, computed, toValue } from "vue";

import type { TagDto } from "~/features/tags/contracts/tag.dto";
import { useTagsQuery } from "~/features/tags/queries/use-tags-query";
import { useListTransactionsQuery } from "~/features/transactions/queries/use-list-transactions-query";

import type { CreditCardDto } from "../contracts/credit-card.dto";
import { useCreditCardsQuery } from "../queries/use-credit-cards-query";
import {
  type EnrichedTransaction,
  billWindowStartDate,
  enrichCardTransactions,
  monthEndDate,
} from "../utils/transaction-billing";

/** Tamanho padrão da janela temporal compartilhada (meses). */
export const CREDIT_CARDS_WINDOW_MONTHS = 6;

/** Resultado do composable-base de transações de cartão. */
export interface CardTransactionsWindow {
  readonly cards: ComputedRef<CreditCardDto[]>;
  readonly tags: ComputedRef<TagDto[]>;
  readonly enrichedTransactions: ComputedRef<EnrichedTransaction[]>;
  readonly isLoading: ComputedRef<boolean>;
  readonly isError: ComputedRef<boolean>;
  readonly error: ComputedRef<Error | null>;
}

/**
 * Carrega cartões, categorias e a janela de transações de despesa (N meses
 * terminando no mês selecionado) e devolve as transações enriquecidas com o mês
 * de fatura. Compartilhado por Faturas e Analítico — a mesma queryKey é deduzida
 * pelo Vue Query, evitando refetch ao alternar de visão.
 *
 * @param month Mês selecionado (YYYY-MM), reativo.
 * @returns Dados reativos da janela.
 */
export const useCardTransactionsWindow = (
  month: MaybeRefOrGetter<string>,
): CardTransactionsWindow => {
  const cardsQuery = useCreditCardsQuery();
  const tagsQuery = useTagsQuery();

  const filters = computed(() => ({
    type: "expense" as const,
    start_date: billWindowStartDate(toValue(month), CREDIT_CARDS_WINDOW_MONTHS),
    end_date: monthEndDate(toValue(month)),
  }));
  const transactionsQuery = useListTransactionsQuery(filters);

  const cards = computed<CreditCardDto[]>(() => cardsQuery.data.value ?? []);
  const tags = computed<TagDto[]>(() => tagsQuery.data.value ?? []);
  const enrichedTransactions = computed<EnrichedTransaction[]>(() =>
    enrichCardTransactions(transactionsQuery.data.value ?? [], cards.value),
  );

  const isLoading = computed<boolean>(
    () =>
      cardsQuery.isLoading.value
      || tagsQuery.isLoading.value
      || transactionsQuery.isLoading.value,
  );
  const isError = computed<boolean>(
    () => cardsQuery.isError.value || tagsQuery.isError.value || transactionsQuery.isError.value,
  );
  const error = computed<Error | null>(
    () =>
      cardsQuery.error.value
      ?? tagsQuery.error.value
      ?? transactionsQuery.error.value
      ?? null,
  );

  return { cards, tags, enrichedTransactions, isLoading, isError, error };
};
