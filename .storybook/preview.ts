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
    primaryColor:        colors.brand[600],
    primaryColorHover:   colors.brand[500],
    primaryColorPressed: colors.brand[700],
    primaryColorSuppl:   colors.brand[400],
    bodyColor:           colors.bg.base,
    cardColor:           colors.bg.surface,
    modalColor:          colors.bg.surface,
    popoverColor:        colors.bg.elevated,
    inputColor:          colors.bg.elevated,
    borderColor:         colors.outline.soft,
    dividerColor:        colors.outline.subtle,
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
        { name: "auraxis-dark", value: colors.bg.base },
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
        colorPrimary: colors.brand[600],
        colorSecondary: colors.brand[500],
        appBg: colors.bg.base,
        appContentBg: colors.bg.surface,
        textColor: colors.text.primary,
        textMutedColor: colors.text.muted,
        barBg: colors.bg.elevated,
        barTextColor: colors.text.secondary,
        barHoverColor: colors.brand[500],
        barSelectedColor: colors.brand[600],
        inputBg: colors.bg.elevated,
        inputBorder: colors.outline.soft,
        inputTextColor: colors.text.primary,
        inputBorderRadius: 8,
        fontBase: fonts.body,
      },
    },
  },
};

export default preview;
