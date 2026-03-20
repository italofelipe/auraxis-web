import type { Component } from "vue";

export interface UiMetricCardProps {
  /** Label do métrica, ex: "Saldo Total" */
  label: string
  /** Valor formatado como string, ex: "R$ 12.430,00" */
  value: string
  /** Variação numérica para UiTrendBadge. Se omitido, badge não é exibido */
  trend?: number
  /** Ícone Lucide para decoração */
  icon?: Component
  /** Estado de carregamento — exibe skeleton */
  loading?: boolean
}
