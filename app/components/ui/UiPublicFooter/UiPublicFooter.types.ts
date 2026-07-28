import type { PublicSurface } from "~/shared/navigation/public-links";

export interface UiPublicFooterProps {
  /** Ano exibido no copyright. Padrão: ano atual. */
  year?: number
  /** Superfície pública ativa — decide quais links atravessam para o host do app. Padrão: runtimeConfig. */
  surface?: PublicSurface
}
