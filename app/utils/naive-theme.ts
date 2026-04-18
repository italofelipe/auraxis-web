/**
 * Auraxis design tokens mapped to Naive UI's GlobalThemeOverrides.
 *
 * Source of truth: DS v3 "Market Pulse"
 * - `docs/wiki/MVP-1-Web-Design-System-v3-Market-Pulse.md`
 * - `designs/web/revamp/tokens/auraxis-ds-v3.tokens.css`
 */
import type { GlobalThemeOverrides } from "naive-ui";

/**
 * Core Auraxis token palette — DS v3 "Market Pulse".
 * Exported so wrappers and composables can reference tokens without duplicating values.
 */
export const tokens = {
  surface: {
    base: "#121a2a",
    deep: "#05070d",
    card: "#0e1523",
    cardActive: "#172338",
  },
  brand: {
    primary: "#44d4ff",
    secondary: "#8b7dff",
    highlight: "#42e8a9",
    primaryPressed: "#24beea",
  },
  text: {
    default: "#f1f5ff",
    muted: "#d2dcf3",
    disabled: "#6e7f9f",
  },
  status: {
    success: "#42e8a9",
    successSoft: "#86f7cc",
    danger: "#ff6f79",
    dangerSoft: "#ff9099",
    warning: "#ffb861",
    info: "#44d4ff",
  },
  border: "rgba(255, 255, 255, 0.1)",
} as const;

/**
 * Naive UI GlobalThemeOverrides applying the Auraxis DS v3 visual identity.
 *
 * Passed to `<NConfigProvider :theme-overrides="auraxisThemeOverrides">` in app.vue.
 * All product components inherit these values automatically — no per-component theming needed.
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
    // Typography — Inter + IBM Plex Mono (DS v3)
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
    fontFamilyMono: "\"IBM Plex Mono\", \"SF Mono\", ui-monospace, Menlo, monospace",
    fontSize: "14px",
    fontSizeMini: "12px",
    fontSizeSmall: "13px",
    fontSizeMedium: "14px",
    fontSizeLarge: "16px",
    fontSizeHuge: "20px",
    // Radius — DS v3 scale
    borderRadius: "10px",
    borderRadiusSmall: "6px",
  },
  Button: {
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
