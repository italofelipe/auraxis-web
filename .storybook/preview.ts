import { type Preview, type StoryContext, type StoryFn, setup } from "@storybook/vue3";
import { darkTheme, NConfigProvider, NMessageProvider, NDialogProvider } from "naive-ui";
import { defineComponent, h } from "vue";
import { buildNaiveThemeOverrides } from "../app/utils/naive-theme";
import { themePalettes, type ResolvedTheme } from "../app/theme/tokens/semantic";
import { fonts } from "../app/theme/tokens/typography";

setup((app) => {
  app.component("NConfigProvider", NConfigProvider);
  app.component("NMessageProvider", NMessageProvider);
  app.component("NDialogProvider", NDialogProvider);
});

const preview: Preview = {
  globalTypes: {
    themeMode: {
      name: "Tema",
      description: "Tema Auraxis usado nas stories",
      defaultValue: "light",
      toolbar: {
        icon: "mirror",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
      },
    },
  },
  decorators: [
    (story: StoryFn, context: StoryContext): ReturnType<typeof defineComponent> =>
      defineComponent({
        components: { NConfigProvider, NMessageProvider, NDialogProvider },
        setup(): () => ReturnType<typeof h> {
          return () => {
            const themeMode: ResolvedTheme = context.globals.themeMode === "dark" ? "dark" : "light";
            const palette = themePalettes[themeMode];

            if (typeof document !== "undefined") {
              document.documentElement.dataset.theme = themeMode;
              document.documentElement.style.colorScheme = themeMode;
            }

            return h(
              "div",
              {
                style: {
                  minHeight: "100vh",
                  padding: "24px",
                  background: palette.bg.canvas,
                  color: palette.text.primary,
                  fontFamily: fonts.body,
                },
              },
              [
                h(
                  NConfigProvider,
                  {
                    theme: themeMode === "dark" ? darkTheme : null,
                    themeOverrides: buildNaiveThemeOverrides(themeMode),
                  },
                  () =>
                    h(NMessageProvider, {}, () =>
                      h(NDialogProvider, {}, () => h(story(), {})),
                    ),
                ),
              ],
            );
          };
        },
      }),
  ],
  parameters: {
    backgrounds: {
      default: "auraxis-light",
      values: [
        { name: "auraxis-light", value: themePalettes.light.bg.canvas },
        { name: "auraxis-dark", value: themePalettes.dark.bg.canvas },
        { name: "light-surface", value: themePalettes.light.bg.surface },
        { name: "dark-surface", value: themePalettes.dark.bg.surface },
      ],
    },
    layout: "centered",
    docs: {
      theme: {
        base: "light",
        brandTitle: "Auraxis Design System",
        brandUrl: "/",
        colorPrimary: themePalettes.light.action.primary,
        colorSecondary: themePalettes.light.chart.investment,
        appBg: themePalettes.light.bg.canvas,
        appContentBg: themePalettes.light.bg.surface,
        textColor: themePalettes.light.text.primary,
        textMutedColor: themePalettes.light.text.muted,
        barBg: themePalettes.light.bg.elevated,
        barTextColor: themePalettes.light.text.secondary,
        barHoverColor: themePalettes.light.action.primaryHover,
        barSelectedColor: themePalettes.light.action.primary,
        inputBg: themePalettes.light.bg.elevated,
        inputBorder: themePalettes.light.border.subtle,
        inputTextColor: themePalettes.light.text.primary,
        inputBorderRadius: 8,
        fontBase: fonts.body,
      },
    },
  },
};

export default preview;
