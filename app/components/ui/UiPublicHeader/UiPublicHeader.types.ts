import type { PublicSurface } from "~/shared/navigation/public-links";

export interface UiPublicHeaderProps {
  /** Força o estado de autenticação (útil em Storybook/testes). Padrão: lido do sessionStore. */
  authenticated?: boolean
  /** Superfície pública: marketing/landing mostram nav; app foca ações de auth. Padrão: runtimeConfig. */
  surface?: PublicSurface
}
