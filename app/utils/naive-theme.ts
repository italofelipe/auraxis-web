/**
 * Auraxis design tokens mapped to Naive UI's GlobalThemeOverrides.
 *
 * Source of truth: `.context/30_design_reference.md` + `designs/1920w default.png`.
 *
 * Rules:
 * - Do NOT use raw hex values outside this file in product code.
 * - Reference tokens via the `n-config-provider` :theme-overrides prop (already
 *   injected globally in `app/app.vue`) or via the exported `tokens` object.
 * - To add a new override, extend the relevant component key below and open a PR.
 */
import type { GlobalThemeOverrides } from "naive-ui";

/**
 * Core Auraxis token palette — mirrors `.context/30_design_reference.md`.
 * Exported so wrappers and composables can reference tokens without duplicating values.
 */
export const tokens = {
  surface: {
    base: "#272020",
    deep: "#0c0909",
    card: "#413a3a",
    cardActive: "#322a2a",
  },
  brand: {
    primary: "#ffab1a",
    secondary: "#ffbe4d",
    highlight: "#ffd080",
    primaryPressed: "#e09600",
  },
  text: {
    default: "#f5f0f0",
    muted: "#bcb3b3",
    disabled: "#6b6060",
  },
  status: {
    success: "#059669",
    successSoft: "#4ade80",
    danger: "#ef4343",
    dangerSoft: "#f87171",
    warning: "#f59e0b",
    info: "#3b82f6",
  },
  border: "#4a3f3f",
} as const;

/**
 * Naive UI GlobalThemeOverrides applying the Auraxis visual identity.
 *
 * Passed to `<NConfigProvider :theme-overrides="auraxisThemeOverrides">` in app.vue.
 * All product components inherit these values automatically — no per-component theming needed.
 *
 * @returns GlobalThemeOverrides
 */
export const auraxisThemeOverrides: GlobalThemeOverrides = {
  common: {
    // Brand
    primaryColor: tokens.brand.primary,
    primaryColorHover: tokens.brand.secondary,
    primaryColorPressed: tokens.brand.primaryPressed,
    primaryColorSuppl: tokens.brand.highlight,
    // Surfaces
    baseColor: tokens.surface.deep,
    bodyColor: tokens.surface.deep,
    cardColor: tokens.surface.card,
    modalColor: tokens.surface.card,
    popoverColor: tokens.surface.cardActive,
    // Text
    textColorBase: tokens.text.default,
    textColor1: tokens.text.default,
    textColor2: tokens.text.muted,
    textColor3: tokens.text.disabled,
    placeholderColor: tokens.text.disabled,
    // Borders
    borderColor: tokens.border,
    dividerColor: tokens.border,
    // Status
    successColor: tokens.status.success,
    warningColor: tokens.status.warning,
    errorColor: tokens.status.danger,
    infoColor: tokens.status.info,
    // Typography — fonts loaded via @nuxtjs/google-fonts (Playfair Display + Raleway)
    fontFamily: "Raleway, system-ui, sans-serif",
    fontFamilyMono: "\"Fira Code\", \"Cascadia Code\", monospace",
    fontSize: "14px",
    fontSizeMini: "12px",
    fontSizeSmall: "13px",
    fontSizeMedium: "14px",
    fontSizeLarge: "16px",
    fontSizeHuge: "20px",
    // Radius — 8px grid
    borderRadius: "8px",
    borderRadiusSmall: "4px",
  },
  Button: {
    // Primary button text is dark (brand primary is bright amber)
    textColor: tokens.surface.deep,
    fontWeightStrong: "600",
  },
  Input: {
    color: tokens.surface.card,
    colorFocus: tokens.surface.cardActive,
    borderColor: tokens.border,
    borderFocusColor: tokens.brand.primary,
    borderHoverColor: tokens.brand.secondary,
    caretColor: tokens.brand.primary,
  },
  Card: {
    color: tokens.surface.card,
    borderColor: tokens.border,
  },
  Layout: {
    color: tokens.surface.deep,
    siderColor: tokens.surface.base,
    headerColor: tokens.surface.base,
  },
  DataTable: {
    thColor: tokens.surface.card,
    tdColor: tokens.surface.base,
    tdColorHover: tokens.surface.cardActive,
    borderColor: tokens.border,
  },
};
