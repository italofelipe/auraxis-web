import type { Component } from "vue";

export interface UiEmptyStateProps {
  /** Ícone Lucide (componente) ou nome de ícone como string para uso com <component :is> */
  icon?: Component | string
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
