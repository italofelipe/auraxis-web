import { darkTheme, type GlobalThemeOverrides } from "naive-ui";
import { colors } from "~/theme/tokens/colors";
import { fonts } from "~/theme/tokens/typography";
import { radii } from "~/theme/tokens/radii";

export interface NaiveThemeResult {
  theme: typeof darkTheme;
  themeOverrides: GlobalThemeOverrides;
}

/** @returns GlobalThemeOverrides.common mapped from Auraxis design tokens. */
function buildCommonOverrides(): GlobalThemeOverrides["common"] {
  return {
    primaryColor:             colors.brand[600],
    primaryColorHover:        colors.brand[500],
    primaryColorPressed:      colors.brand[700],
    primaryColorSuppl:        colors.brand[400],
    bodyColor:                colors.bg.base,
    cardColor:                colors.bg.surface,
    modalColor:               colors.bg.surface,
    popoverColor:             colors.bg.elevated,
    tableColor:               colors.bg.surface,
    inputColor:               colors.bg.elevated,
    inputColorDisabled:       colors.bg.surface,
    borderColor:              colors.outline.soft,
    dividerColor:             colors.outline.subtle,
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
    warningColor:             colors.brand[500],
    fontFamily:               fonts.body,
    fontFamilyMono:           "ui-monospace, SFMono-Regular, monospace",
    borderRadius:             radii.md,
    borderRadiusSmall:        radii.sm,
  };
}

/** @returns Component-level GlobalThemeOverrides for form and interactive elements. */
function buildComponentOverrides(): Omit<GlobalThemeOverrides, "common"> {
  return {
    Button: {
      colorPrimary:             colors.brand[600],
      colorHoverPrimary:        colors.brand[500],
      colorPressedPrimary:      colors.brand[700],
      colorFocusPrimary:        colors.brand[500],
      colorDisabledPrimary:     colors.bg.elevated,
      textColorPrimary:         colors.bg.base,
      textColorHoverPrimary:    colors.bg.base,
      textColorPressedPrimary:  colors.bg.base,
      textColorDisabledPrimary: colors.text.muted,
      borderRadiusPrimary:      radii.md,
    },
    Input: {
      color:            colors.bg.elevated,
      colorFocus:       colors.bg.elevated,
      colorDisabled:    colors.bg.surface,
      textColor:        colors.text.primary,
      placeholderColor: colors.text.subtle,
      border:           `1px solid ${colors.outline.soft}`,
      borderFocus:      `1px solid ${colors.brand[600]}`,
      borderHover:      `1px solid ${colors.brand[500]}`,
      borderRadius:     radii.md,
      boxShadowFocus:   `0 0 0 2px ${colors.brandGlow.xs}`,
    },
    Card: {
      color:          colors.bg.surface,
      colorModal:     colors.bg.surface,
      borderColor:    colors.outline.subtle,
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
      optionColorActive:     colors.brandGlow.xs,
      optionColorPending:    colors.brandGlow.xxs,
      optionTextColorActive: colors.brand[500],
      optionCheckColor:      colors.brand[600],
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
      borderColor:    colors.outline.soft,
      closeIconColor: colors.text.muted,
    },
    Tabs: {
      tabTextColorLine:       colors.text.muted,
      tabTextColorHoverLine:  colors.text.secondary,
      tabTextColorActiveLine: colors.brand[600],
      barColor:               colors.brand[600],
      tabFontWeightActive:    "600",
    },
    DataTable: {
      thColor:     colors.bg.elevated,
      thTextColor: colors.text.muted,
      tdColor:     colors.bg.surface,
      tdColorHover: colors.bg.elevated,
      borderColor: colors.outline.subtle,
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
 * @returns Naive UI theme object and GlobalThemeOverrides derived from Auraxis design tokens.
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
