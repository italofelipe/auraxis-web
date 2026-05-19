import type { GlobalTheme, GlobalThemeOverrides } from "naive-ui";
import { computed, type ComputedRef } from "vue";
import { useTheme } from "~/composables/useTheme";
import { buildNaiveThemeOverrides } from "~/utils/naive-theme";

export interface NaiveThemeResult {
  theme: ComputedRef<GlobalTheme | null>;
  themeOverrides: ComputedRef<GlobalThemeOverrides>;
}

/**
 * Composable canônico de tema do Auraxis para o Naive UI.
 *
 * Use com NConfigProvider em app.vue:
 *   `<NConfigProvider :theme="theme" :theme-overrides="themeOverrides">`
 *
 * @returns Naive UI theme object and GlobalThemeOverrides derived from the active Auraxis theme.
 */
export function useNaiveTheme(): NaiveThemeResult {
  const { naiveTheme, resolvedTheme } = useTheme();

  const themeOverrides = computed<GlobalThemeOverrides>(() =>
    buildNaiveThemeOverrides(resolvedTheme.value),
  );

  return {
    theme: naiveTheme,
    themeOverrides,
  };
}
