import type { FormattedTrend } from "./formatters.types";
import { PercentFormatter } from "./PercentFormatter";

/**
 * Formata variação financeira com direção semântica e cor.
 * @param value - Valor percentual, ex: 12.5 para positivo, -3.2 para negativo.
 * @param decimals - Número de casas decimais (padrão: 2).
 * @returns Objeto com label, direction e colorVar.
 */
const format = (value: number, decimals = 2): FormattedTrend => {
  if (value > 0) {
    return {
      label: PercentFormatter.format(value, decimals),
      direction: "positive",
      colorVar: "var(--color-positive)",
    };
  }
  if (value < 0) {
    return {
      label: PercentFormatter.format(value, decimals),
      direction: "negative",
      colorVar: "var(--color-negative)",
    };
  }
  return {
    label: PercentFormatter.format(value, decimals),
    direction: "neutral",
    colorVar: "var(--color-text-muted)",
  };
};

/**
 * Formatador de variações financeiras com direção semântica e cor.
 */
export const TrendFormatter = { format };
