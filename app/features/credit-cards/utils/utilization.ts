/**
 * Faixas de utilização do cartão (cc-4 / #864).
 *
 * - low:  < 70%  (verde)
 * - mid:  70–90% (amarelo)
 * - high: > 90%  (vermelho — inclui estouro > 100%)
 */
export type UtilizationBand = "low" | "mid" | "high";

/**
 * Classifica o percentual de utilização em faixa de cor.
 *
 * @param pct Percentual 0..100+ (pode passar de 100 quando estourado).
 * @returns A faixa correspondente.
 */
export const utilizationBand = (pct: number): UtilizationBand => {
  if (pct > 90) {
    return "high";
  }
  if (pct >= 70) {
    return "mid";
  }
  return "low";
};

/**
 * Classe CSS por faixa, mapeada a design tokens no componente.
 *
 * @param pct Percentual de utilização.
 * @returns Nome da classe da faixa.
 */
export const utilizationBandClass = (pct: number): string =>
  `cc-util--${utilizationBand(pct)}`;

/**
 * Clampa o percentual para a largura da barra (0..100).
 *
 * @param pct Percentual de utilização.
 * @returns Largura clampada entre 0 e 100.
 */
export const utilizationBarWidthPct = (pct: number): number =>
  Math.max(0, Math.min(100, pct));
