import { colors } from "./colors";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const defaultThemePreference: ThemePreference = "light";
export const defaultResolvedTheme: ResolvedTheme = "light";

export const themePalettes = {
  light: {
    bg: {
      canvas:   "#F4F8FB",
      app:      "#EFF5FA",
      surface:  "#FFFFFF",
      elevated: "#F8FBFF",
      muted:    "#EEF4FA",
    },
    text: {
      primary:   "#0A1628",
      secondary: "#263A56",
      muted:     "#5D6F89",
      subtle:    "#7A8BA3",
      inverse:   "#FFFFFF",
    },
    border: {
      subtle: "#D8E3EF",
      strong: "#087FA7",
      focus:  "#087FA7",
    },
    action: {
      primary:        "#087FA7",
      primaryHover:   "#0A94BF",
      primaryPressed: "#066985",
      primarySubtle:  "#D8F3FB",
    },
    feedback: {
      positive:   "#087F5B",
      positiveBg: "#DDF8EF",
      negative:   "#C2414D",
      negativeBg: "#FCE6EA",
      warning:    "#B7791F",
      warningBg:  "#FFF3D6",
      info:       "#2563EB",
      infoBg:     "#E6EEFF",
    },
    chart: {
      income:     "#087F5B",
      expense:    "#C2414D",
      balance:    "#087FA7",
      investment: "#6F62E2",
      debt:       "#B7791F",
      grid:       "#D8E3EF",
      axis:       "#5D6F89",
    },
  },
  dark: {
    bg: {
      canvas:   colors.bg.canvas,
      app:      colors.bg.app,
      surface:  colors.bg.surface,
      elevated: colors.bg.elevated,
      muted:    colors.bg.surface2,
    },
    text: {
      primary:   colors.text.primary,
      secondary: colors.text.secondary,
      muted:     colors.text.muted,
      subtle:    colors.text.subtle,
      inverse:   colors.bg.canvas,
    },
    border: {
      subtle: colors.border.subtle,
      strong: colors.border.strong,
      focus:  colors.cyan[500],
    },
    action: {
      primary:        colors.cyan[500],
      primaryHover:   colors.cyan[400],
      primaryPressed: colors.cyan[600],
      primarySubtle:  "rgba(68, 212, 255, 0.1)",
    },
    feedback: {
      positive:   colors.positive.DEFAULT,
      positiveBg: colors.positive.bg,
      negative:   colors.negative.DEFAULT,
      negativeBg: colors.negative.bg,
      warning:    colors.orange[500],
      warningBg:  "rgba(255, 184, 97, 0.12)",
      info:       colors.violet[400],
      infoBg:     "rgba(139, 125, 255, 0.12)",
    },
    chart: {
      income:     colors.positive.DEFAULT,
      expense:    colors.negative.DEFAULT,
      balance:    colors.cyan[500],
      investment: colors.violet[500],
      debt:       colors.orange[500],
      grid:       colors.border.subtle,
      axis:       colors.text.muted,
    },
  },
} as const;

// Semantic aliases — use these in components, not the primitives directly
export const semantic = {
  // Surfaces
  surface: {
    page:    colors.bg.canvas,
    card:    colors.bg.surface,
    overlay: colors.bg.elevated,
    glass:   colors.bg.glass,
  },
  // Actions
  action: {
    primary:        colors.cyan[500],
    primaryHover:   colors.violet[500],
    primaryPressed: colors.cyan[600],
    primarySubtle:  "rgba(68, 212, 255, 0.1)",
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
