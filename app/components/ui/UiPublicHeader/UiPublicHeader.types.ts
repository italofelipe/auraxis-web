export interface UiPublicHeaderProps {
  /** Força o estado de autenticação (útil em Storybook/testes). Padrão: lido do sessionStore. */
  authenticated?: boolean
  /** Superfície pública: marketing mostra nav; app foca ações de auth. */
  surface?: "app" | "marketing"
}
