/**
 * Gestão dos cenários fixados para comparação no simulador de metas (PROD-02 / #536).
 *
 * O usuário pode fixar até {@link MAX_PINNED_SCENARIOS} cenários "E se?" para
 * comparar lado a lado no gráfico (cada um vira uma série; o ECharts atribui
 * cores distintas automaticamente).
 */

export const MAX_PINNED_SCENARIOS = 3;

export interface PinnedScenario {
  readonly id: string;
  readonly label: string;
  readonly monthlyContribution: number;
  readonly annualRatePct: number;
  readonly horizonMonths: number;
  /** Saldo projetado por mês (já arredondado para 2 casas). */
  readonly points: readonly number[];
}

/**
 * Adiciona um cenário à lista de comparação, respeitando o teto.
 *
 * @param list Lista atual de cenários fixados.
 * @param scenario Cenário a adicionar.
 * @returns Nova lista (inalterada quando o teto foi atingido).
 */
export const addPinnedScenario = (
  list: readonly PinnedScenario[],
  scenario: PinnedScenario,
): PinnedScenario[] => {
  if (list.length >= MAX_PINNED_SCENARIOS) {
    return [...list];
  }
  return [...list, scenario];
};

/**
 * Remove um cenário fixado por id.
 *
 * @param list Lista atual.
 * @param id Id do cenário a remover.
 * @returns Nova lista sem o cenário.
 */
export const removePinnedScenario = (
  list: readonly PinnedScenario[],
  id: string,
): PinnedScenario[] => list.filter((scenario) => scenario.id !== id);

/**
 * Indica se ainda é possível fixar mais um cenário.
 *
 * @param list Lista atual.
 * @returns True quando abaixo do teto.
 */
export const canPinScenario = (list: readonly PinnedScenario[]): boolean =>
  list.length < MAX_PINNED_SCENARIOS;
