export interface UiSocialAuthButtonsProps {
  /** Desabilita todos os botões durante loading */
  disabled?: boolean
  /** Modo compacto: exibe apenas ícones, sem texto */
  compact?: boolean
}

export interface UiSocialAuthButtonsEmits {
  (e: "google-click" | "apple-click"): void
}
