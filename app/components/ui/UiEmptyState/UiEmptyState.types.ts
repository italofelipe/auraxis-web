import type { Component } from "vue";
import type { AuraxisIconName } from "~/shared/utils/icons/icons.types";

export interface UiEmptyStateProps {
  /** Ícone: nome canônico do ICON_MAP ou componente Vue direto */
  icon?: AuraxisIconName | Component
  /** Título principal */
  title: string
  /** Descrição secundária */
  description?: string
  /** Label do botão CTA */
  actionLabel?: string
  /** Variante compacta — menor padding e ícone reduzido, para uso dentro de cards */
  compact?: boolean
}

export interface UiEmptyStateEmits {
  (e: "action"): void
}
