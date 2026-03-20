import type { Component } from "vue";

export interface UiMetricCardProps {
  /** Metric label, e.g. "Total Balance" */
  label: string
  /** Formatted value as string, e.g. "R$ 12.430,00" */
  value: string
  /** Numeric variation for UiTrendBadge. If omitted, the badge is not displayed */
  trend?: number
  /** Lucide icon for decoration */
  icon?: Component
  /** Loading state — displays a skeleton */
  loading?: boolean
}
