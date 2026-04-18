import { darkTheme, type GlobalThemeOverrides } from "naive-ui";
import { colors } from "~/theme/tokens/colors";
import { fonts } from "~/theme/tokens/typography";
import { radii } from "~/theme/tokens/radii";

export interface NaiveThemeResult {
  theme: typeof darkTheme;
  themeOverrides: GlobalThemeOverrides;
}

/** @returns GlobalThemeOverrides.common mapped from Auraxis DS v3 tokens. */
function buildCommonOverrides(): GlobalThemeOverrides["common"] {
  return {
    primaryColor:             colors.cyan[500],
    primaryColorHover:        colors.cyan[400],
    primaryColorPressed:      colors.cyan[600],
    primaryColorSuppl:        colors.violet[500],
    bodyColor:                colors.bg.canvas,
    cardColor:                colors.bg.surface,
    modalColor:               colors.bg.surface,
    popoverColor:             colors.bg.elevated,
    tableColor:               colors.bg.surface,
    inputColor:               colors.bg.elevated,
    inputColorDisabled:       colors.bg.surface,
    borderColor:              colors.border.subtle,
    dividerColor:             colors.border.subtle,
    textColorBase:            colors.text.primary,
    textColor1:               colors.text.primary,
    textColor2:               colors.text.secondary,
    textColor3:               colors.text.muted,
    placeholderColor:         colors.text.subtle,
    placeholderColorDisabled: colors.text.subtle,
    errorColor:               colors.negative.DEFAULT,
    errorColorHover:          colors.negative.dark,
    successColor:             colors.positive.DEFAULT,
    successColorHover:        colors.positive.dark,
    warningColor:             colors.orange[500],
    fontFamily:               fonts.body,
    fontFamilyMono:           fonts.mono,
    borderRadius:             radii.md,
    borderRadiusSmall:        radii.sm,
  };
}

/** @returns Component-level GlobalThemeOverrides for form and interactive elements. */
function buildComponentOverrides(): Omit<GlobalThemeOverrides, "common"> {
  return {
    Button: {
      colorPrimary:             colors.cyan[500],
      colorHoverPrimary:        colors.cyan[400],
      colorPressedPrimary:      colors.cyan[600],
      colorFocusPrimary:        colors.cyan[400],
      colorDisabledPrimary:     colors.bg.elevated,
      textColorPrimary:         colors.bg.canvas,
      textColorHoverPrimary:    colors.bg.canvas,
      textColorPressedPrimary:  colors.bg.canvas,
      textColorDisabledPrimary: colors.text.muted,
      borderRadiusPrimary:      radii.md,
    },
    Input: {
      color:            colors.bg.elevated,
      colorFocus:       colors.bg.elevated,
      colorDisabled:    colors.bg.surface,
      textColor:        colors.text.primary,
      placeholderColor: colors.text.subtle,
      border:           `1px solid ${colors.border.subtle}`,
      borderFocus:      `1px solid ${colors.cyan[500]}`,
      borderHover:      `1px solid ${colors.cyan[400]}`,
      borderRadius:     radii.md,
      boxShadowFocus:   "0 0 0 2px rgba(68, 212, 255, 0.18)",
    },
    Card: {
      color:          colors.bg.surface,
      colorModal:     colors.bg.surface,
      borderColor:    colors.border.subtle,
      borderRadius:   radii.lg,
      titleTextColor: colors.text.primary,
      textColor:      colors.text.secondary,
    },
    Form: {
      labelTextColor:         colors.text.secondary,
      feedbackTextColorError: colors.negative.DEFAULT,
    },
  };
}

/** @returns Component-level GlobalThemeOverrides for overlay and display elements. */
function buildOverlayOverrides(): Omit<GlobalThemeOverrides, "common"> {
  return {
    Select: {
      menuColor:             colors.bg.elevated,
      optionColorActive:     "rgba(68, 212, 255, 0.1)",
      optionColorPending:    "rgba(68, 212, 255, 0.05)",
      optionTextColorActive: colors.cyan[400],
      optionCheckColor:      colors.cyan[500],
      peers: {
        InternalSelectMenu: {
          color: colors.bg.elevated,
        },
      },
    },
    Modal: {
      color:        colors.bg.surface,
      textColor:    colors.text.primary,
      borderRadius: radii.lg,
    },
    Drawer: {
      color:     colors.bg.surface,
      textColor: colors.text.primary,
    },
    Tag: {
      colorBordered:  "transparent",
      textColor:      colors.text.secondary,
      borderColor:    colors.border.subtle,
      closeIconColor: colors.text.muted,
    },
    Tabs: {
      tabTextColorLine:       colors.text.muted,
      tabTextColorHoverLine:  colors.text.secondary,
      tabTextColorActiveLine: colors.cyan[500],
      barColor:               colors.cyan[500],
      tabFontWeightActive:    "600",
    },
    DataTable: {
      thColor:     colors.bg.elevated,
      thTextColor: colors.text.muted,
      tdColor:     colors.bg.surface,
      tdColorHover: colors.bg.elevated,
      borderColor: colors.border.subtle,
    },
    Skeleton: {
      color:    colors.bg.elevated,
      colorEnd: colors.bg.surface,
    },
    Tooltip: {
      color:        colors.bg.elevated,
      textColor:    colors.text.primary,
      borderRadius: radii.sm,
    },
  };
}

/**
 * Composable canônico de tema do Auraxis para o Naive UI.
 * Use com NConfigProvider em app.vue:
 *   `<NConfigProvider :theme="theme" :theme-overrides="themeOverrides">`
 *
 * @returns Naive UI theme object and GlobalThemeOverrides derived from Auraxis DS v3 tokens.
 */
export function useNaiveTheme(): NaiveThemeResult {
  const themeOverrides: GlobalThemeOverrides = {
    common: buildCommonOverrides(),
    ...buildComponentOverrides(),
    ...buildOverlayOverrides(),
  };

  return {
    theme: darkTheme,
    themeOverrides,
  };
}
