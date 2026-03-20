import { colors } from "./colors";

// Semantic aliases — use these in components, not the primitives directly
export const semantic = {
  // Surfaces
  surface: {
    page:    colors.bg.base,
    card:    colors.bg.surface,
    overlay: colors.bg.elevated,
    glass:   colors.bg.glass,
  },
  // Actions
  action: {
    primary:        colors.brand[600],
    primaryHover:   colors.brand[500],
    primaryPressed: colors.brand[700],
    primarySubtle:  colors.brandGlow.xs,
  },
  // Financial feedback
  financial: {
    positive:   colors.positive.DEFAULT,
    positiveBg: colors.positive.bg,
    negative:   colors.negative.DEFAULT,
    negativeBg: colors.negative.bg,
  },
  // Text
  text: {
    primary:   colors.text.primary,
    secondary: colors.text.secondary,
    muted:     colors.text.muted,
    subtle:    colors.text.subtle,
  },
} as const;

export type Semantic = typeof semantic;
