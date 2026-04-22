import type { Component } from "vue";
import type { AuraxisIconName } from "~/shared/utils/icons/icons.types";

export interface UiEmptyStateProps {
  /** Ícone: nome canônico do ICON_MAP ou componente Vue direto */
  icon?: AuraxisIconName | Component
  /** Título principal */
  title: string
  /** Descrição secundária */
  description?: string
  /** Label do botão CTA primário */
  actionLabel?: string
  /** Label do link secundário (renderizado abaixo do CTA) */
  secondaryLabel?: string
  /** Se fornecido, renderiza o secundário como `<a href>` em vez de `<button>` */
  secondaryHref?: string
  /** Variante compacta — menor padding e ícone reduzido, para uso dentro de cards */
  compact?: boolean
}

export interface UiEmptyStateEmits {
  (e: "action" | "secondary-action"): void
}
