import type { AuraxisIconName } from "../../utils/icons/icons.types";

export interface UiIconProps {
  name: AuraxisIconName
  size?: number
  /** Accessibility: whether the icon is decorative (hidden from screen readers) */
  decorative?: boolean
  /** Screen reader label when the icon is not decorative */
  label?: string
}
