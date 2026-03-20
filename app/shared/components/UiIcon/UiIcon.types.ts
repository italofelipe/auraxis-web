import type { AuraxisIconName } from "../../utils/icons/icons.types";

export interface UiIconProps {
  name: AuraxisIconName
  size?: number
  /** Acessibilidade: se o ícone é decorativo (ocultar de leitores de tela) */
  decorative?: boolean
  /** Label para leitores de tela quando não decorativo */
  label?: string
}
