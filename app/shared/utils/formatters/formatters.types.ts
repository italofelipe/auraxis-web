export interface FormattedTrend {
  /** Valor formatado ex: "+12,5%" */
  label: string
  /** Direção semântica */
  direction: "positive" | "negative" | "neutral"
  /** CSS custom property a usar para cor */
  colorVar: string
}
