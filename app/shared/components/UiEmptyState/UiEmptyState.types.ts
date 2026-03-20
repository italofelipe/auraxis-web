import type { Component } from "vue";

export interface UiEmptyStateProps {
  /** Ícone Lucide */
  icon?: Component
  /** Título principal */
  title: string
  /** Descrição secundária */
  description?: string
  /** Label do botão CTA */
  actionLabel?: string
}

export interface UiEmptyStateEmits {
  (e: "action"): void
}
