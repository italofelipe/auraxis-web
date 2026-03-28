export interface UiTrendBadgeProps {
  /** Valor numérico da variação. Positivo = verde, negativo = vermelho, zero = neutro */
  value: number
  /** Exibir ícone de tendência. Padrão: true */
  showIcon?: boolean
  /** Casas decimais. Padrão: 2 */
  decimals?: number
}

export type TrendDirection = "positive" | "negative" | "neutral"
