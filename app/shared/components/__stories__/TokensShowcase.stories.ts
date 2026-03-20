import type { Meta, StoryObj } from "@storybook/vue3";
import { defineComponent, h } from "vue";
import { colors } from "~/theme/tokens/colors";
import { NCard, NButton } from "naive-ui";

/** Story de validação: verifica que o tema Auraxis está aplicado corretamente no Storybook. */
const TokensShowcase = defineComponent({
  name: "TokensShowcase",
  setup(): () => ReturnType<typeof h> {
    return () =>
      h(NCard, { title: "Auraxis Design Tokens", style: { maxWidth: "600px" } }, {
        default: () => [
          h("div", { style: "display:flex; gap:8px; flex-wrap:wrap; margin-bottom:16px;" }, [
            h("div", { style: `width:48px;height:48px;background:${colors.brand[600]};border-radius:8px;` }),
            h("div", { style: `width:48px;height:48px;background:${colors.brand[500]};border-radius:8px;` }),
            h("div", { style: `width:48px;height:48px;background:${colors.brand[400]};border-radius:8px;` }),
            h("div", { style: `width:48px;height:48px;background:${colors.positive.DEFAULT};border-radius:8px;` }),
            h("div", { style: `width:48px;height:48px;background:${colors.negative.DEFAULT};border-radius:8px;` }),
          ]),
          h("div", { style: "display:flex; gap:8px;" }, [
            h(NButton, { type: "primary" }, () => "Primary CTA"),
            h(NButton, { type: "default" }, () => "Default"),
            h(NButton, { type: "error" }, () => "Error"),
          ]),
        ],
      });
  },
});

const meta: Meta = {
  title: "Design System/Token Showcase",
  component: TokensShowcase,
  tags: ["autodocs"],
};

export default meta;

export const Default: StoryObj = {
  render: () => ({
    components: { TokensShowcase },
    template: "<TokensShowcase />",
  }),
};
