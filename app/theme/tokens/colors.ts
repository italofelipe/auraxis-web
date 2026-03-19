export const colors = {
  // Backgrounds (fundo escuro quente)
  bg: {
    base:     "#0b0909",            // fundo mais profundo
    surface:  "#272020",            // cards, painéis
    elevated: "#413939",            // superfícies elevadas, dropdowns
    glass:    "rgba(39, 32, 32, 0.6)", // glassmorphism
  },
  // Marca amber/gold — paleta única para todo o produto
  brand: {
    400: "#ffd180",  // mais claro — hovers, disabled
    500: "#ffbe4d",  // accent secundário
    600: "#ffab1a",  // DEFAULT — CTAs, links, foco
    700: "#f59600",  // pressed
    800: "#d97600",  // mais escuro
  },
  // Glows da marca (alpha)
  brandGlow: {
    lg:  "rgba(255, 171, 26, 0.4)",
    md:  "rgba(255, 171, 26, 0.3)",
    sm:  "rgba(255, 171, 26, 0.2)",
    xs:  "rgba(255, 171, 26, 0.1)",
    xxs: "rgba(255, 171, 26, 0.05)",
  },
  // Texto
  text: {
    primary:   "#faf9f9",
    secondary: "#d1c7c7",
    muted:     "#9b8888",
    subtle:    "#6c5a5a",
  },
  // Semântico — positivo (valores financeiros positivos)
  positive: {
    DEFAULT: "#10b981",
    dark:    "#059669",
    bg:      "rgba(16, 185, 129, 0.1)",
    glow:    "rgba(16, 185, 129, 0.4)",
  },
  // Semântico — negativo (valores financeiros negativos, erros)
  negative: {
    DEFAULT: "#ef4444",
    dark:    "#dc2626",
    bg:      "rgba(239, 68, 68, 0.1)",
    glow:    "rgba(239, 68, 68, 0.2)",
  },
  // Bordas e divisores
  outline: {
    hard:   "rgba(65, 57, 57, 0.8)",
    soft:   "rgba(65, 57, 57, 0.5)",
    subtle: "rgba(38, 33, 33, 0.2)",
    ghost:  "rgba(38, 33, 33, 0.08)",
  },
} as const;

export type Colors = typeof colors;
