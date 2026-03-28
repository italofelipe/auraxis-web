export interface UiSurfaceCardProps {
  /** Padding interno. Padrão: 'md' (24px) */
  padding?: "none" | "sm" | "md" | "lg"
  /** Exibir sombra. Padrão: true */
  shadow?: boolean
  /** Exibir borda. Padrão: true */
  bordered?: boolean
  /** Elemento HTML raiz. Padrão: 'div' */
  as?: "div" | "article" | "section"
}
