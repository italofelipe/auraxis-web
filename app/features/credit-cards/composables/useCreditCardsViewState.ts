import { type ComputedRef, type Ref, computed, ref } from "vue";

import { monthKeyLabel, shiftMonthKey } from "../utils/transaction-billing";

/** Visões disponíveis na página de Cartões. */
export type CreditCardsView = "faturas" | "analitico";

/**
 * Chave de mês (YYYY-MM) do mês de referência (default: hoje).
 *
 * @param reference Data de referência.
 * @returns Chave YYYY-MM.
 */
export const currentMonthKey = (reference: Date = new Date()): string =>
  `${reference.getFullYear()}-${String(reference.getMonth() + 1).padStart(2, "0")}`;

/** Estado compartilhado entre as visões Faturas e Analítico. */
export interface CreditCardsViewState {
  readonly view: Ref<CreditCardsView>;
  readonly month: Ref<string>;
  readonly selectedCardId: Ref<string | null>;
  readonly monthLabel: ComputedRef<string>;
  setView(next: CreditCardsView): void;
  setMonth(next: string): void;
  shiftMonth(delta: number): void;
  selectCard(cardId: string | null): void;
}

/** Opções iniciais do estado da página de Cartões. */
export interface UseCreditCardsViewStateOptions {
  readonly initialView?: CreditCardsView;
  readonly initialMonth?: string;
  readonly initialCardId?: string | null;
}

/**
 * Estado de UI compartilhado da página de Cartões: visão ativa, mês selecionado
 * e cartão selecionado (null = "Todos"). Façade fina sobre refs; a lógica de mês
 * vive em funções puras testadas (`shiftMonthKey`, `monthKeyLabel`).
 *
 * @param options Valores iniciais opcionais.
 * @returns Estado reativo e ações.
 */
export const useCreditCardsViewState = (
  options?: UseCreditCardsViewStateOptions,
): CreditCardsViewState => {
  const view = ref<CreditCardsView>(options?.initialView ?? "faturas");
  const month = ref<string>(options?.initialMonth ?? currentMonthKey());
  const selectedCardId = ref<string | null>(options?.initialCardId ?? null);

  const monthLabel = computed<string>(() => monthKeyLabel(month.value));

  /**
   * Troca a visão ativa.
   *
   * @param next Visão alvo.
   */
  const setView = (next: CreditCardsView): void => {
    view.value = next;
  };
  /**
   * Define o mês selecionado.
   *
   * @param next Mês alvo (YYYY-MM).
   */
  const setMonth = (next: string): void => {
    month.value = next;
  };
  /**
   * Desloca o mês selecionado.
   *
   * @param delta Deslocamento em meses.
   */
  const shiftMonth = (delta: number): void => {
    month.value = shiftMonthKey(month.value, delta);
  };
  /**
   * Seleciona um cartão (null = "Todos").
   *
   * @param cardId Id do cartão ou null.
   */
  const selectCard = (cardId: string | null): void => {
    selectedCardId.value = cardId;
  };

  return { view, month, selectedCardId, monthLabel, setView, setMonth, shiftMonth, selectCard };
};
