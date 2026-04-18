import { type Preview, type StoryFn, setup } from "@storybook/vue3";
import { darkTheme, NConfigProvider, NMessageProvider, NDialogProvider } from "naive-ui";
import { defineComponent, h } from "vue";
import { colors } from "../app/theme/tokens/colors";
import { fonts } from "../app/theme/tokens/typography";
import { radii } from "../app/theme/tokens/radii";

// Mesmo themeOverrides do useNaiveTheme — mantido em sync
// (o composable real usa a mesma paleta — este é o provider de story)
const auraxisOverrides = {
  common: {
    primaryColor:        colors.cyan[600],
    primaryColorHover:   colors.cyan[500],
    primaryColorPressed: colors.cyan[700],
    primaryColorSuppl:   colors.cyan[400],
    bodyColor:           colors.bg.app,
    cardColor:           colors.bg.surface,
    modalColor:          colors.bg.surface,
    popoverColor:        colors.bg.elevated,
    inputColor:          colors.bg.elevated,
    borderColor:         colors.border.subtle,
    dividerColor:        colors.border.subtle,
    textColorBase:       colors.text.primary,
    textColor1:          colors.text.primary,
    textColor2:          colors.text.secondary,
    textColor3:          colors.text.muted,
    placeholderColor:    colors.text.subtle,
    errorColor:          colors.negative.DEFAULT,
    successColor:        colors.positive.DEFAULT,
    fontFamily:          fonts.body,
    borderRadius:        radii.md,
    borderRadiusSmall:   radii.sm,
  },
};

// Registrar providers globais para todas as stories
setup((app) => {
  // Registrar componentes Naive UI globalmente nas stories
  app.component("NConfigProvider", NConfigProvider);
  app.component("NMessageProvider", NMessageProvider);
  app.component("NDialogProvider", NDialogProvider);
});

const preview: Preview = {
  decorators: [
    (story: StoryFn): ReturnType<typeof defineComponent> =>
      defineComponent({
        components: { NConfigProvider, NMessageProvider, NDialogProvider },
        setup(): () => ReturnType<typeof h> {
          return () =>
            h(
              NConfigProvider,
              { theme: darkTheme, themeOverrides: auraxisOverrides },
              () =>
                h(NMessageProvider, {}, () =>
                  h(NDialogProvider, {}, () => h(story(), {}))
                )
            );
        },
      }),
  ],

  parameters: {
    backgrounds: {
      default: "auraxis-dark",
      values: [
        { name: "auraxis-dark", value: colors.bg.app },
        { name: "surface", value: colors.bg.surface },
        { name: "elevated", value: colors.bg.elevated },
      ],
    },
    layout: "centered",
    docs: {
      theme: {
        base: "dark",
        brandTitle: "Auraxis Design System",
        brandUrl: "/",
        colorPrimary: colors.cyan[600],
        colorSecondary: colors.cyan[500],
        appBg: colors.bg.app,
        appContentBg: colors.bg.surface,
        textColor: colors.text.primary,
        textMutedColor: colors.text.muted,
        barBg: colors.bg.elevated,
        barTextColor: colors.text.secondary,
        barHoverColor: colors.cyan[500],
        barSelectedColor: colors.cyan[600],
        inputBg: colors.bg.elevated,
        inputBorder: colors.border.subtle,
        inputTextColor: colors.text.primary,
        inputBorderRadius: 8,
        fontBase: fonts.body,
      },
    },
  },
};

export default preview;
