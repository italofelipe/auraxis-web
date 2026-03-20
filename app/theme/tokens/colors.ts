export const colors = {
  // Backgrounds (dark warm base)
  bg: {
    base:     "#0b0909",            // deepest background
    surface:  "#272020",            // cards, panels
    elevated: "#413939",            // elevated surfaces, dropdowns
    glass:    "rgba(39, 32, 32, 0.6)", // glassmorphism
  },
  // Amber/gold brand — single palette across the product
  brand: {
    400: "#ffd180",  // lightest — hovers, disabled
    500: "#ffbe4d",  // secondary accent
    600: "#ffab1a",  // DEFAULT — CTAs, links, focus
    700: "#f59600",  // pressed
    800: "#d97600",  // darkest
  },
  // Brand glows (alpha)
  brandGlow: {
    lg:  "rgba(255, 171, 26, 0.4)",
    md:  "rgba(255, 171, 26, 0.3)",
    sm:  "rgba(255, 171, 26, 0.2)",
    xs:  "rgba(255, 171, 26, 0.1)",
    xxs: "rgba(255, 171, 26, 0.05)",
  },
  // Text
  text: {
    primary:   "#faf9f9",
    secondary: "#d1c7c7",
    muted:     "#9b8888",
    subtle:    "#6c5a5a",
  },
  // Semantic — positive (positive financial values)
  positive: {
    DEFAULT: "#10b981",
    dark:    "#059669",
    bg:      "rgba(16, 185, 129, 0.1)",
    glow:    "rgba(16, 185, 129, 0.4)",
  },
  // Semantic — negative (negative financial values, errors)
  negative: {
    DEFAULT: "#ef4444",
    dark:    "#dc2626",
    bg:      "rgba(239, 68, 68, 0.1)",
    glow:    "rgba(239, 68, 68, 0.2)",
  },
  // Borders and dividers
  outline: {
    hard:   "rgba(65, 57, 57, 0.8)",
    soft:   "rgba(65, 57, 57, 0.5)",
    subtle: "rgba(38, 33, 33, 0.2)",
    ghost:  "rgba(38, 33, 33, 0.08)",
  },
} as const;

export type Colors = typeof colors;
