/**
 * Auraxis design tokens mapped to Naive UI's GlobalThemeOverrides.
 *
 * The design-system tokens live in `app/theme/tokens`; this module is the
 * bridge that lets Naive UI controls follow the active light/dark theme.
 */
import type { GlobalThemeOverrides } from "naive-ui";
import { themePalettes, type ResolvedTheme } from "~/theme/tokens/semantic";
import { fonts } from "~/theme/tokens/typography";
import { radii } from "~/theme/tokens/radii";

const darkPalette = themePalettes.dark;

/**
 * Legacy token export used by chart helpers. Keep this shape stable while the
 * chart layer is migrated to `themePalettes`.
 */
export const tokens = {
  surface: {
    base: darkPalette.bg.surface,
    deep: darkPalette.bg.canvas,
    card: darkPalette.bg.elevated,
    cardActive: darkPalette.bg.muted,
  },
  brand: {
    primary: darkPalette.action.primary,
    secondary: darkPalette.chart.investment,
    highlight: darkPalette.feedback.positive,
    primaryPressed: darkPalette.action.primaryPressed,
  },
  text: {
    default: darkPalette.text.primary,
    muted: darkPalette.text.muted,
    disabled: darkPalette.text.subtle,
  },
  status: {
    success: darkPalette.feedback.positive,
    successSoft: "#86f7cc",
    danger: darkPalette.feedback.negative,
    dangerSoft: "#ff9099",
    warning: darkPalette.feedback.warning,
    info: darkPalette.feedback.info,
  },
  border: darkPalette.border.subtle,
} as const;

const focusShadowByTheme: Record<ResolvedTheme, string> = {
  light: "0 0 0 2px rgba(8, 127, 167, 0.18)",
  dark: "0 0 0 2px rgba(68, 212, 255, 0.18)",
};

const pendingOptionByTheme: Record<ResolvedTheme, string> = {
  light: "rgba(8, 127, 167, 0.08)",
  dark: "rgba(68, 212, 255, 0.08)",
};

type ThemePalette = (typeof themePalettes)[ResolvedTheme];

/**
 * Builds common Naive UI theme tokens for the active palette.
 * @param palette Active semantic palette.
 * @returns Common Naive UI theme tokens.
 */
function buildCommonOverrides(palette: ThemePalette): GlobalThemeOverrides["common"] {
  return {
    primaryColor:             palette.action.primary,
    primaryColorHover:        palette.action.primaryHover,
    primaryColorPressed:      palette.action.primaryPressed,
    primaryColorSuppl:        palette.chart.investment,
    baseColor:                palette.bg.canvas,
    bodyColor:                palette.bg.canvas,
    cardColor:                palette.bg.surface,
    modalColor:               palette.bg.surface,
    popoverColor:             palette.bg.elevated,
    tableColor:               palette.bg.surface,
    inputColor:               palette.bg.elevated,
    inputColorDisabled:       palette.bg.muted,
    borderColor:              palette.border.subtle,
    dividerColor:             palette.border.subtle,
    textColorBase:            palette.text.primary,
    textColor1:               palette.text.primary,
    textColor2:               palette.text.secondary,
    textColor3:               palette.text.muted,
    placeholderColor:         palette.text.subtle,
    placeholderColorDisabled: palette.text.subtle,
    errorColor:               palette.feedback.negative,
    errorColorHover:          palette.feedback.negative,
    successColor:             palette.feedback.positive,
    successColorHover:        palette.feedback.positive,
    warningColor:             palette.feedback.warning,
    warningColorHover:        palette.feedback.warning,
    infoColor:                palette.feedback.info,
    infoColorHover:           palette.feedback.info,
    fontFamily:               fonts.body,
    fontFamilyMono:           fonts.mono,
    fontSize:                 "14px",
    fontSizeSmall:            "13px",
    fontSizeMedium:           "14px",
    fontSizeLarge:            "16px",
    borderRadius:             radii.md,
    borderRadiusSmall:        radii.sm,
  };
}

/**
 * Builds form and card overrides for the active palette.
 * @param theme Resolved light/dark theme.
 * @param palette Active semantic palette.
 * @returns Form and card component overrides.
 */
function buildControlOverrides(
  theme: ResolvedTheme,
  palette: ThemePalette,
): Omit<GlobalThemeOverrides, "common"> {
  return {
    Button: {
      colorPrimary:             palette.action.primary,
      colorHoverPrimary:        palette.action.primaryHover,
      colorPressedPrimary:      palette.action.primaryPressed,
      colorFocusPrimary:        palette.action.primaryHover,
      colorDisabledPrimary:     palette.bg.muted,
      textColorPrimary:         palette.text.inverse,
      textColorHoverPrimary:    palette.text.inverse,
      textColorPressedPrimary:  palette.text.inverse,
      textColorDisabledPrimary: palette.text.subtle,
      borderRadiusPrimary:      radii.md,
      fontWeightStrong:         "600",
    },
    Input: {
      color:            palette.bg.elevated,
      colorFocus:       palette.bg.elevated,
      colorDisabled:    palette.bg.muted,
      textColor:        palette.text.primary,
      placeholderColor: palette.text.subtle,
      border:           `1px solid ${palette.border.subtle}`,
      borderFocus:      `1px solid ${palette.border.focus}`,
      borderHover:      `1px solid ${palette.action.primaryHover}`,
      borderRadius:     radii.md,
      boxShadowFocus:   focusShadowByTheme[theme],
      caretColor:       palette.action.primary,
    },
    Card: {
      color:          palette.bg.surface,
      colorModal:     palette.bg.surface,
      borderColor:    palette.border.subtle,
      borderRadius:   radii.lg,
      titleTextColor: palette.text.primary,
      textColor:      palette.text.secondary,
    },
    Layout: {
      color:       palette.bg.canvas,
      headerColor: palette.bg.surface,
      siderColor:  palette.bg.surface,
    },
    Form: {
      labelTextColor:         palette.text.secondary,
      feedbackTextColorError: palette.feedback.negative,
    },
  };
}

/**
 * Builds overlay and menu overrides for the active palette.
 * @param theme Resolved light/dark theme.
 * @param palette Active semantic palette.
 * @returns Overlay and menu component overrides.
 */
function buildOverlayOverrides(
  theme: ResolvedTheme,
  palette: ThemePalette,
): Omit<GlobalThemeOverrides, "common"> {
  return {
    Select: {
      menuColor:             palette.bg.elevated,
      optionColorActive:     palette.action.primarySubtle,
      optionColorPending:    pendingOptionByTheme[theme],
      optionTextColorActive: palette.action.primary,
      optionCheckColor:      palette.action.primary,
      peers: {
        InternalSelectMenu: {
          color: palette.bg.elevated,
        },
      },
    },
    Dropdown: {
      color:                palette.bg.elevated,
      optionTextColor:      palette.text.secondary,
      optionColorHover:     pendingOptionByTheme[theme],
      optionTextColorHover: palette.text.primary,
    },
    Modal: {
      color:        palette.bg.surface,
      textColor:    palette.text.primary,
      borderRadius: radii.lg,
    },
    Dialog: {
      color:        palette.bg.surface,
      textColor:    palette.text.primary,
      borderRadius: radii.lg,
    },
    Drawer: {
      color:     palette.bg.surface,
      textColor: palette.text.primary,
    },
  };
}

/**
 * Builds display component overrides for tables, tabs, tags and feedback.
 * @param theme Resolved light/dark theme.
 * @param palette Active semantic palette.
 * @returns Display component overrides.
 */
function buildDisplayOverrides(
  theme: ResolvedTheme,
  palette: ThemePalette,
): Omit<GlobalThemeOverrides, "common"> {
  return {
    Tag: {
      colorBordered:  "transparent",
      textColor:      palette.text.secondary,
      borderColor:    palette.border.subtle,
      closeIconColor: palette.text.muted,
    },
    Tabs: {
      tabTextColorLine:       palette.text.muted,
      tabTextColorHoverLine:  palette.text.secondary,
      tabTextColorActiveLine: palette.action.primary,
      barColor:               palette.action.primary,
      tabFontWeightActive:    "600",
    },
    DataTable: {
      thColor:      palette.bg.elevated,
      thTextColor:  palette.text.muted,
      tdColor:      palette.bg.surface,
      tdColorHover: palette.bg.elevated,
      borderColor:  palette.border.subtle,
    },
    Pagination: {
      itemColorActive:      palette.action.primarySubtle,
      itemTextColorActive:  palette.action.primary,
      itemBorderActive:     `1px solid ${palette.border.focus}`,
      itemBorderHover:      `1px solid ${palette.action.primaryHover}`,
      itemTextColorHover:   palette.action.primary,
      buttonColorHover:     pendingOptionByTheme[theme],
      buttonIconColorHover: palette.action.primary,
      buttonIconColor:      palette.text.muted,
    },
    Skeleton: {
      color:    palette.bg.elevated,
      colorEnd: palette.bg.muted,
    },
    Tooltip: {
      color:        palette.bg.elevated,
      textColor:    palette.text.primary,
      borderRadius: radii.sm,
    },
    Popover: {
      color:        palette.bg.elevated,
      textColor:    palette.text.primary,
      borderRadius: radii.md,
    },
    Message: {
      color:     palette.bg.elevated,
      textColor: palette.text.primary,
    },
  };
}

/**
 * Builds Naive UI theme overrides for the active Auraxis theme.
 * @param theme Resolved light/dark theme.
 * @returns Naive UI GlobalThemeOverrides aligned to semantic tokens.
 */
export function buildNaiveThemeOverrides(theme: ResolvedTheme): GlobalThemeOverrides {
  const palette = themePalettes[theme];

  return {
    common: buildCommonOverrides(palette),
    ...buildControlOverrides(theme, palette),
    ...buildOverlayOverrides(theme, palette),
    ...buildDisplayOverrides(theme, palette),
  };
}

export const auraxisThemeOverrides: GlobalThemeOverrides = buildNaiveThemeOverrides("dark");
