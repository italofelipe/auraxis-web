export const colors = {
  // Backgrounds (navy base — DS v3 "Market Pulse")
  bg: {
    canvas:   "#05070d",            // deepest background (--a3-neutral-950)
    app:      "#0a0f1a",            // app-level background (--a3-neutral-900)
    elevated: "#0e1523",            // elevated overlays (--a3-neutral-850)
    surface:  "#121a2a",            // cards, panels (--a3-neutral-800)
    surface2: "#172338",            // secondary surface (--a3-neutral-750)
    glass:    "rgba(18, 26, 42, 0.86)", // glassmorphism
  },
  // Neutral scale
  neutral: {
    950: "#05070d",
    900: "#0a0f1a",
    850: "#0e1523",
    800: "#121a2a",
    750: "#172338",
    700: "#1d2b44",
    650: "#243652",
    600: "#2d4466",
  },
  // Text
  text: {
    primary:   "#f1f5ff",
    secondary: "#d2dcf3",
    muted:     "#94a3bf",
    subtle:    "#6e7f9f",
  },
  // Accent — Cyan (primary action)
  cyan: {
    300: "#9be9ff",
    400: "#6fe0ff",
    500: "#44d4ff",
    600: "#24beea",
    700: "#1598be",
  },
  // Accent — Violet
  violet: {
    300: "#bfb5ff",
    400: "#a495ff",
    500: "#8b7dff",
    600: "#6f62e2",
    700: "#594fc2",
  },
  // Accent — Lime (profit / positive)
  lime: {
    300: "#86f7cc",
    400: "#63f0b9",
    500: "#42e8a9",
    600: "#22c88a",
    700: "#169b6b",
  },
  // Accent — Orange (warning)
  orange: {
    300: "#ffd7a7",
    400: "#ffc985",
    500: "#ffb861",
    600: "#e89e47",
    700: "#c68431",
  },
  // Accent — Red (loss / error)
  red: {
    300: "#ffb0b6",
    400: "#ff9099",
    500: "#ff6f79",
    600: "#e85763",
    700: "#c53f4a",
  },
  // Semantic — positive (profit)
  positive: {
    DEFAULT: "#42e8a9",
    dark:    "#22c88a",
    bg:      "rgba(66, 232, 169, 0.1)",
    glow:    "rgba(66, 232, 169, 0.4)",
  },
  // Semantic — negative (loss / errors)
  negative: {
    DEFAULT: "#ff6f79",
    dark:    "#e85763",
    bg:      "rgba(255, 111, 121, 0.1)",
    glow:    "rgba(255, 111, 121, 0.2)",
  },
  // Borders and dividers
  border: {
    subtle: "rgba(255, 255, 255, 0.1)",
    strong: "rgba(68, 212, 255, 0.4)",
  },
} as const;

export type Colors = typeof colors;
